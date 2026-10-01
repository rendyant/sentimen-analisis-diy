import hashlib
import re
from bs4 import BeautifulSoup


def clean_html(html_text: str) -> str:
    """Membersihkan tag HTML dari teks ulasan/berita."""
    if not html_text:
        return ""
    soup = BeautifulSoup(str(html_text), "lxml")
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


def make_id(text: str) -> str:
    """Membuat ID unik 24 karakter dari MD5 hash teks/URL."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:24]
