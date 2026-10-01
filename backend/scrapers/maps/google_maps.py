import asyncio
from datetime import datetime
import re
from playwright.async_api import async_playwright
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import make_id


async def scrape_maps_for_opd(opd: dict, db: Session, max_reviews: int = 50) -> int:
    """Scrape ulasan Google Maps untuk satu OPD menggunakan Playwright."""
    added = 0
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(locale="id-ID")
            page = await context.new_page()

            if opd.get("maps_url"):
                await page.goto(opd["maps_url"], wait_until="networkidle", timeout=30000)
            else:
                search_url = "https://www.google.com/maps/search/" + opd["maps_query"].replace(" ", "+")
                await page.goto(search_url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)
                first = await page.query_selector(".hfpxzc")
                if first:
                    await first.click()

            await asyncio.sleep(2)

            tab = await page.query_selector(
                "button[aria-label*='Ulasan'], button[aria-label*='Reviews']"
            )
            if tab:
                await tab.click()
                await asyncio.sleep(2)

            container = await page.query_selector(".m6QErb.DxyBCb")
            if container:
                for _ in range(5):
                    await container.evaluate("el => el.scrollTop = el.scrollHeight")
                    await asyncio.sleep(1.5)

            elements = await page.query_selector_all(".jftiEf.fontBodyMedium")

            for el in elements[:max_reviews]:
                try:
                    name_el = await el.query_selector(".d4r55")
                    name = await name_el.inner_text() if name_el else "Anonymous"

                    rating_el = await el.query_selector(
                        "span[aria-label*='bintang'], span[aria-label*='star']"
                    )
                    rating = None
                    if rating_el:
                        attr = await rating_el.get_attribute("aria-label")
                        m = re.search(r"(\d+)", attr or "")
                        if m:
                            rating = float(m.group(1))

                    more = await el.query_selector(".w8nwRe.kyuRq")
                    if more:
                        await more.click()
                        await asyncio.sleep(0.3)

                    text_el = await el.query_selector(".MyEned")
                    teks = await text_el.inner_text() if text_el else ""
                    if not teks:
                        continue

                    date_el = await el.query_selector(".rsqaWe")
                    tanggal = await date_el.inner_text() if date_el else ""

                    review_id = make_id(f"{opd['id']}_{name}_{teks}")

                    if db.query(Review).filter(Review.id == review_id).first():
                        continue

                    review = Review(
                        id=review_id,
                        instansi_id=opd["id"],
                        instansi_nama=opd["nama"],
                        sumber="maps",
                        penulis=name,
                        teks=teks,
                        rating=rating,
                        tanggal=tanggal,
                        url=page.url,
                        scraped_at=datetime.now().isoformat(),
                    )
                    db.add(review)
                    added += 1

                except Exception as e:
                    print(f"  ⚠️ Skip review Maps: {e}")
                    continue

            db.commit()
            await browser.close()
            print(f"✅ Maps {opd['nama']}: {added} baru")

    except Exception as e:
        print(f"❌ Error Maps {opd['nama']}: {e}")
        db.rollback()

    return added


async def scrape_all_maps(db: Session, opds: list) -> int:
    """Scrape Google Maps untuk seluruh OPD."""
    total = 0
    for opd in opds:
        total += await scrape_maps_for_opd(opd, db)
        await asyncio.sleep(3)
    return total
