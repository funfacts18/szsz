from __future__ import annotations

import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
LIST_URL = "https://xgb.ahau.edu.cn/xsg/aqjy.htm"
ASSET_DIR = ROOT / "public" / "resources" / "fraud-education"
OUTPUT = ROOT / "src" / "data" / "fraudEducation.js"


def get_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8")


class ContentExtractor(HTMLParser):
    allowed = {"p", "span", "strong", "b", "em", "i", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th", "br", "img"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = False
        self.depth = 0
        self.parts: list[str] = []
        self.images: list[str] = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "div" and "v_news_content" in attributes.get("class", "").split():
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
        if tag == "img" and attributes.get("src"):
            marker = f"__IMAGE_{len(self.images)}__"
            self.images.append(attributes["src"])
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


def download(url: str, destination: Path):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        destination.write_bytes(response.read())


listing = get_text(LIST_URL)
pattern = re.compile(
    r'<a\s+href="([^"]+)"[^>]+title="([^"]+)"[^>]*class="lia"[^>]*>.*?</a>\s*'
    r'<div class="time">([^<]+)</div>',
    re.S,
)
entries = []
seen = set()
for href, title, date in pattern.findall(listing):
    article_url = urljoin(LIST_URL, href)
    if article_url in seen:
        continue
    seen.add(article_url)
    entries.append({"title": html.unescape(title), "date": date.strip(), "source": article_url})
    if len(entries) == 12:
        break

ASSET_DIR.mkdir(parents=True, exist_ok=True)
for index, entry in enumerate(entries, start=1):
    page = get_text(entry["source"])
    extractor = ContentExtractor()
    extractor.feed(page)
    content = "".join(extractor.parts)
    for image_index, source in enumerate(extractor.images, start=1):
        image_url = urljoin(entry["source"], source)
        suffix = Path(urlparse(image_url).path).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            suffix = ".jpg"
        filename = f"{index:02d}-{image_index:02d}{suffix}"
        download(image_url, ASSET_DIR / filename)
        content = content.replace(f"__IMAGE_{image_index - 1}__", f"/resources/fraud-education/{filename}")
    entry["content"] = content

OUTPUT.write_text(
    "export const fraudEducation = " + json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Synced {len(entries)} articles to {OUTPUT}")
