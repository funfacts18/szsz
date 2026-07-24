from __future__ import annotations

import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "resources" / "research-exchange"
OUTPUT = ROOT / "src" / "data" / "researchExchange.js"
URLS = [
    "https://www.ciste.org.cn/gjjsmy/dwjl/art/2026/art_5704e96feb0e4610bcf5bf971703073d.html",
    "https://www.ciste.org.cn/gjjsmy/dwjl/art/2026/art_ba01f0c2df6141f08eacb4eabbf773b9.html",
    "https://www.ciste.org.cn/gjjsmy/dwjl/art/2026/art_a725a836a0854416a3af33e1e7a16ad5.html",
]


def request_bytes(url: str, referer: str | None = None) -> bytes:
    headers = {"User-Agent": "Mozilla/5.0"}
    if referer:
        headers["Referer"] = referer
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


class Extractor(HTMLParser):
    allowed = {"p", "span", "strong", "b", "em", "i", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th", "br", "img", "h2", "h3", "h4"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = False
        self.depth = 0
        self.parts: list[str] = []
        self.images: list[str] = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "div" and "showtxt" in attributes.get("class", "").split():
            self.active = True
            self.depth = 1
            return
        if not self.active:
            return
        if tag == "div":
            self.depth += 1
            return
        if tag not in self.allowed:
            return
        if tag == "img":
            source = attributes.get("data-src") or attributes.get("src")
            if source:
                marker = f"__IMAGE_{len(self.images)}__"
                self.images.append(source)
                self.parts.append(f'<img src="{marker}" alt="">')
        elif tag == "br":
            self.parts.append("<br>")
        else:
            self.parts.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if not self.active:
            return
        if tag == "div":
            self.depth -= 1
            if self.depth == 0:
                self.active = False
            return
        if tag in self.allowed and tag not in {"img", "br"}:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        if self.active:
            self.parts.append(html.escape(data))


ASSET_DIR.mkdir(parents=True, exist_ok=True)
for old_asset in ASSET_DIR.iterdir():
    if old_asset.is_file():
        old_asset.unlink()

entries = []
for index, url in enumerate(URLS, start=1):
    page = request_bytes(url).decode("utf-8")
    title_match = re.search(r'<meta\s+name="ArticleTitle"\s+content="([^"]+)"', page, re.I)
    if not title_match:
        title_match = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S | re.I)
    title = html.unescape(re.sub(r"<[^>]+>", "", title_match.group(1))).strip()
    date_match = re.search(r'<meta\s+name="PubDate"\s+content="(20\d{2}-\d{2}-\d{2})', page, re.I)
    date = date_match.group(1) if date_match else ""

    extractor = Extractor()
    extractor.feed(page)
    content = "".join(extractor.parts).strip()
    for image_index, source in enumerate(extractor.images, start=1):
        image_url = urljoin(url, html.unescape(source))
        suffix = Path(urlparse(image_url).path).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            suffix = ".jpg"
        filename = f"{index:02d}-{image_index:02d}{suffix}"
        try:
            (ASSET_DIR / filename).write_bytes(request_bytes(image_url, url))
            replacement = f"resources/research-exchange/{filename}"
        except Exception:
            replacement = image_url
        content = content.replace(f"__IMAGE_{image_index - 1}__", replacement)
    entries.append({"title": title, "date": date, "source": url, "content": content})

OUTPUT.write_text(
    "export const researchExchange = " + json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Synced {len(entries)} research exchange articles to {OUTPUT}")
