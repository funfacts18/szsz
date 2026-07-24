from __future__ import annotations

import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
LIST_URL = "https://szsy.jmsu.edu.cn/szcx/AIzntzq.htm"
ASSET_DIR = ROOT / "public" / "resources" / "ai-agents"
OUTPUT = ROOT / "src" / "data" / "aiAgents.js"


def request_bytes(url: str, referer: str | None = None) -> bytes:
    headers = {"User-Agent": "Mozilla/5.0"}
    if referer:
        headers["Referer"] = referer
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def get_text(url: str) -> str:
    raw = request_bytes(url)
    for encoding in ("utf-8", "gb18030"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


class ArticleExtractor(HTMLParser):
    allowed = {"p", "span", "strong", "b", "em", "i", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th", "br", "img", "h2", "h3", "h4"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = False
        self.depth = 0
        self.parts: list[str] = []
        self.images: list[str] = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = attributes.get("class", "").split()
        if (tag == "div" and "v_news_content" in classes) or attributes.get("id") == "js_content":
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


listing = get_text(LIST_URL)
list_start = listing.index('<div class="lm_list">')
listing = listing[list_start:]
items = re.findall(
    r'<li>\s*<a href="([^"]+)">(.*?)</a>\s*<span>([^<]+)</span>\s*</li>',
    listing,
    re.S | re.I,
)[:12]
entries = []
ASSET_DIR.mkdir(parents=True, exist_ok=True)
for old_asset in ASSET_DIR.iterdir():
    if old_asset.is_file():
        old_asset.unlink()

for index, (href, raw_title, date) in enumerate(items, start=1):
    url = urljoin(LIST_URL, html.unescape(href))
    title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()
    page = get_text(url)
    extractor = ArticleExtractor()
    extractor.feed(page)
    content = "".join(extractor.parts).strip()
    if not content:
        description = re.search(r'<meta[^>]+(?:name|property)="(?:description|og:description)"[^>]+content="([^"]+)"', page, re.I)
        content = f"<p>{html.escape(description.group(1))}</p>" if description else "<p>该条目暂无可提取的正文内容。</p>"

    for image_index, source in enumerate(extractor.images, start=1):
        image_url = urljoin(url, html.unescape(source))
        suffix = Path(urlparse(image_url).path).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            suffix = ".jpg"
        filename = f"{index:02d}-{image_index:02d}{suffix}"
        try:
            (ASSET_DIR / filename).write_bytes(request_bytes(image_url, url))
            replacement = f"/resources/ai-agents/{filename}"
        except Exception:
            replacement = image_url
        content = content.replace(f"__IMAGE_{image_index - 1}__", replacement)

    entries.append({"title": title, "date": date.strip(), "source": url, "content": content})

OUTPUT.write_text(
    "export const aiAgents = " + json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Synced {len(entries)} AI agent articles to {OUTPUT}")
