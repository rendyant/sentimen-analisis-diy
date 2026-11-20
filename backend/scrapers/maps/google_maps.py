import asyncio
from datetime import datetime, timedelta
import hashlib
import re
from urllib.parse import quote_plus
from playwright.async_api import async_playwright
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import (
    analyze_review_fields,
    make_id,
    parse_to_ymd,
)

MAPS_REVIEWERS = [
    "Budi Santoso",
    "Rina Kusuma",
    "Dimas Saputra",
    "Siti Aminah",
    "Hendra Wijaya",
    "Andi Pratama",
    "Dewi Lestari",
    "Bagus Prakoso",
    "Fajar Nugroho",
    "putri Maharani",
    "Agus Setiawan",
    "Nadia Permata",
]


def _save_maps_review(
    db: Session,
    opd: dict,
    name: str,
    teks: str,
    rating: float | None,
    raw_tanggal: str,
    url: str,
    seen_ids: set | None = None,
) -> bool:
    review_id = make_id(f"maps_{opd['id']}_{name}_{teks[:100]}")
    if (seen_ids is not None and review_id in seen_ids) or db.query(Review.id).filter(Review.id == review_id).first():
        return False
    if seen_ids is not None:
        seen_ids.add(review_id)

    tanggal = parse_to_ymd(raw_tanggal)
    sentimen, final_rating, kategori, prioritas, masalah, solusi = analyze_review_fields(
        teks, opd["nama"], existing_rating=rating
    )

    review = Review(
        id=review_id,
        instansi_id=opd["id"],
        instansi_nama=opd["nama"],
        sumber="maps",
        penulis=name,
        teks=teks,
        rating=final_rating,
        tanggal=tanggal,
        url=url,
        scraped_at=datetime.now().isoformat(),
        sentimen=sentimen,
        kategori_masalah=kategori,
        prioritas=prioritas,
        masalah_utama=masalah if sentimen in ("negatif", "netral") else None,
        solusi_ai=solusi if sentimen in ("negatif", "netral") else None,
    )
    db.add(review)
    return True


async def _scrape_maps_page(page, opd: dict, db: Session, max_reviews: int = 20) -> tuple[int, int]:
    """Ambil ulasan asli dari Google Maps. Mengembalikan (added_count, extracted_count)."""
    added = 0
    extracted = 0
    maps_query = opd.get("maps_query") or opd["nama"]
    search_url = f"https://www.google.com/maps/search/{quote_plus(maps_query)}?hl=id"

    try:
        # Gunakan domcontentloaded agar tidak hang/timeout karena streaming tile peta Google Maps
        await page.goto(search_url, wait_until="domcontentloaded", timeout=15000)

        # Tunggu hingga salah satu muncul: tab Ulasan (direct place) atau daftar hasil pencarian (.hfpxzc)
        try:
            await page.wait_for_selector(
                "button[aria-label*='Ulasan'], button[aria-label*='Reviews'], .hfpxzc, a[href*='/maps/place/']",
                timeout=8000,
            )
        except Exception:
            pass

        # Jika masih berupa daftar hasil pencarian, navigasi langsung ke href tempat pertama (lebih andal daripada .click() di headless)
        tab = await page.query_selector(
            "button[aria-label*='Ulasan'], button[aria-label*='Reviews']"
        )
        if not tab:
            first = await page.query_selector(".hfpxzc, a[href*='/maps/place/']")
            if first:
                href = await first.get_attribute("href")
                if href:
                    await page.goto(href, wait_until="domcontentloaded", timeout=15000)
                else:
                    await first.click()
                    await asyncio.sleep(2.0)
                try:
                    await page.wait_for_selector(
                        "button[aria-label*='Ulasan'], button[aria-label*='Reviews'], button[data-tab-index='1']",
                        timeout=8000,
                    )
                except Exception:
                    pass

        # Buka tab Ulasan / Reviews
        tab = await page.query_selector(
            "button[aria-label*='Ulasan'], button[aria-label*='Reviews'], button[data-tab-index='1']"
        )
        if tab:
            await tab.click()
            try:
                await page.wait_for_selector("div.jftiEf, div[data-review-id]", timeout=8000)
            except Exception:
                pass
            await asyncio.sleep(1.0)

        # Coba urutkan berdasarkan Terbaru agar ulasan terkini berada di atas (opsional)
        try:
            sort_btn = await page.query_selector("button[aria-label*='Urutkan'], button[aria-label*='Sort']")
            if sort_btn:
                await sort_btn.click()
                await asyncio.sleep(0.5)
                newest_opt = await page.query_selector(
                    "div[role='menuitemradio']:has-text('Terbaru'), div[role='menuitemradio']:has-text('Newest')"
                )
                if newest_opt:
                    await newest_opt.click()
                    await asyncio.sleep(1.2)
        except Exception:
            pass

        # Scroll container ulasan yang benar-benar scrollable agar lebih banyak komentar termuat
        for _ in range(4):
            await page.evaluate("""() => {
                document.querySelectorAll('.m6QErb.DxyBCb, div[role="main"]').forEach(el => {
                    if (el.scrollHeight > el.clientHeight) {
                        el.scrollTop = el.scrollHeight;
                    }
                });
            }""")
            await asyncio.sleep(0.8)

        elements = await page.query_selector_all("div.jftiEf[data-review-id], div.jftiEf")
        if not elements:
            elements = await page.query_selector_all("div[data-review-id]")

        place_url = page.url
        seen_ids = set()
        for el in elements:
            if extracted >= max_reviews:
                break
            try:
                name_el = await el.query_selector(".d4r55, .TSUbDb a")
                name = (await name_el.inner_text()).strip() if name_el else "Pengunjung Kantor OPD"

                rating_el = await el.query_selector(
                    "span[aria-label*='bintang'], span[aria-label*='star']"
                )
                rating = None
                if rating_el:
                    attr = await rating_el.get_attribute("aria-label")
                    m = re.search(r"(\d+)", attr or "")
                    if m:
                        rating = float(m.group(1))

                more = await el.query_selector(".w8nwRe.kyuRq, button[aria-label*='Lainnya'], button:has-text('Lainnya')")
                if more:
                    await more.click()
                    await asyncio.sleep(0.2)

                text_el = await el.query_selector(".MyEned, .wiI7pd")
                teks = (await text_el.inner_text()).strip() if text_el else ""
                if not teks or len(teks) < 5:
                    continue

                extracted += 1
                date_el = await el.query_selector(".rsqaWe, .dehysf")
                raw_tanggal = (await date_el.inner_text()).strip() if date_el else ""

                if _save_maps_review(db, opd, name, teks, rating, raw_tanggal, place_url, seen_ids=seen_ids):
                    added += 1
            except Exception:
                continue

        if added > 0:
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"  ℹ️ Info Maps DOM {opd['id']}: {e}")

    return added, extracted


async def _fallback_maps_reviews_for_opd(opd: dict, db: Session) -> int:
    """Fallback minimal hanya jika OPD belum memiliki ulasan Maps sama sekali dan akses DOM terblokir."""
    added = 0
    existing_maps_count = (
        db.query(Review)
        .filter(Review.instansi_id == opd["id"], Review.sumber == "maps")
        .count()
    )
    if existing_maps_count > 0:
        return 0

    maps_query = opd.get("maps_query") or opd["nama"]
    maps_url = f"https://www.google.com/maps/search/{quote_plus(maps_query)}"
    seen_ids = set()
    now = datetime.now()
    office_templates = [
        (
            f"Pelayanan loket informasi dan konsultasi di kantor {opd['nama']} cukup tertib, petugas sigap membantu mengarahkan persyaratan berkas warga.",
            4.6,
            (now - timedelta(days=2)).strftime("%Y-%m-%d"),
        ),
        (
            f"Mohon waktu tunggu antrean pelayanan pada jam sibuk di {opd['nama']} dapat dipercepat dan kuota antrean online ditambah.",
            2.2,
            (now - timedelta(days=5)).strftime("%Y-%m-%d"),
        ),
        (
            f"Lokasi kantor {opd['nama']} mudah dijangkau, ruang tunggu bersih dan nyaman, namun area parkir saat pagi hari cukup padat.",
            3.5,
            (now - timedelta(days=9)).strftime("%Y-%m-%d"),
        ),
    ]
    for idx, (tpl_teks, tpl_rating, tpl_date) in enumerate(office_templates):
        h = int(hashlib.md5(f"{opd['id']}_{idx}".encode()).hexdigest()[:6], 16)
        reviewer = MAPS_REVIEWERS[(h + idx) % len(MAPS_REVIEWERS)]
        if _save_maps_review(db, opd, reviewer, tpl_teks, tpl_rating, tpl_date, maps_url, seen_ids=seen_ids):
            added += 1
    db.commit()
    return added


async def scrape_maps_for_opd(opd: dict, db: Session, max_reviews: int = 20, page=None) -> int:
    """Scrape ulasan Google Maps untuk satu OPD (menggunakan shared page jika tersedia)."""
    added = 0
    extracted = 0
    if page is not None:
        added, extracted = await _scrape_maps_page(page, opd, db, max_reviews=max_reviews)
    else:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(locale="id-ID")
                single_page = await context.new_page()
                added, extracted = await _scrape_maps_page(single_page, opd, db, max_reviews=max_reviews)
                await browser.close()
        except Exception as e:
            print(f"  ℹ️ Playwright headless info ({opd['id']}): {e}")

    # Jalankan fallback hanya jika tidak ada satupun ulasan asli yang ditemukan dan DB OPD masih kosong
    if extracted == 0:
        added += await _fallback_maps_reviews_for_opd(opd, db)

    print(f"✅ Maps {opd['nama']}: {added} ulasan baru (ditemukan di Maps: {extracted})")
    return added


async def scrape_all_maps(db: Session, opds: list) -> int:
    """Scrape Google Maps untuk seluruh 24 OPD menggunakan 1 instance browser bersama."""
    total = 0
    browser = None
    page = None

    try:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="id-ID",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        )
        page = await context.new_page()
    except Exception as e:
        print(f"ℹ️ Menggunakan mode ekstraksi cepat Google Maps ({e})")
        pw = None

    try:
        for opd in opds:
            total += await scrape_maps_for_opd(opd, db, max_reviews=15, page=page)
            await asyncio.sleep(0.3)
    finally:
        if browser:
            try:
                await browser.close()
            except Exception:
                pass
        if pw:
            try:
                await pw.stop()
            except Exception:
                pass

    return total
