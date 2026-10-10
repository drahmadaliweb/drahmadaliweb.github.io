#!/usr/bin/env python3
# -*- coding: ascii -*-
from pathlib import Path
import html
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://profahmadali.com"
DEFAULT_IMAGE = BASE + "/assets/dr-ahmad-ali.jpg"
PERSON_ID = BASE + "/#person"
STATIC_MARKER = "<!-- AUTO-GENERATED SEO DETAIL PAGE. DO NOT EDIT DIRECTLY. -->"
PHASE1_RE = re.compile(r"<!-- SEO PHASE 1 START -->[\s\S]*?<!-- SEO PHASE 1 END -->\s*", re.I)
LEGACY_RE = re.compile(r"<!-- SEO PHASE 2 LEGACY START -->[\s\S]*?<!-- SEO PHASE 2 LEGACY END -->\s*", re.I)

PAGE_PAIRS = [
    (BASE + "/index.html", BASE + "/bn/"),
    (BASE + "/about.html", BASE + "/bn/about.html"),
    (BASE + "/biography.html", BASE + "/bn/biography.html"),
    (BASE + "/books.html", BASE + "/bn/books.html"),
    (BASE + "/publications.html", BASE + "/bn/publications.html"),
    (BASE + "/selected-articles.html", BASE + "/bn/selected-articles.html"),
    (BASE + "/window-of-time.html", BASE + "/bn/window-of-time.html"),
    (BASE + "/reader-reviews.html", BASE + "/bn/reader-reviews.html"),
    (BASE + "/contact.html", BASE + "/bn/contact.html"),
    (BASE + "/updates.html", BASE + "/bn/updates.html"),
]

CONTENT = {
    "book": {
        "manifest": "books-manifest.js",
        "variable": "window.ahmadAliBookDetails",
        "en_template": "book.html",
        "bn_template": "bn/book.html",
        "en_dir": "books",
        "bn_dir": "bn/books",
        "og_type": "book",
        "schema_type": "Book",
    },
    "article": {
        "manifest": "selected-articles-manifest.js",
        "variable": "window.ahmadAliSelectedArticles",
        "en_template": "article.html",
        "bn_template": "bn/article.html",
        "en_dir": "articles",
        "bn_dir": "bn/articles",
        "og_type": "article",
        "schema_type": "Article",
    },
    "post": {
        "manifest": "posts-manifest.js",
        "variable": "window.windowOfTimePosts",
        "en_template": "post.html",
        "bn_template": "bn/post.html",
        "en_dir": "writings",
        "bn_dir": "bn/writings",
        "og_type": "article",
        "schema_type": "Article",
    },
}

def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def read(path):
    p = ROOT / path
    if not p.exists():
        fail("Missing " + path)
    return p.read_text(encoding="utf-8")

def parse_manifest(kind):
    cfg = CONTENT[kind]
    text = read(cfg["manifest"])
    marker = cfg["variable"] + " ="
    i = text.find(marker)
    if i < 0:
        fail("Could not parse " + cfg["manifest"])
    raw = text[i + len(marker):].strip()
    if raw.endswith(";"):
        raw = raw[:-1].strip()
    data = json.loads(raw)
    if not isinstance(data, list):
        fail("Manifest is not an array: " + cfg["manifest"])
    return data

def safe_id(value):
    value = str(value or "").strip()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,119}", value):
        fail("Unsafe content id: " + value)
    return value

def localized(item, lang):
    return item.get(lang) or item.get("en") or item.get("bn") or {}

def clean_text(value):
    text = str(value or "")
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if re.fullmatch(r"\*{3}(?:\s+\*{3})+", line):
            continue
        if re.fullmatch(r"<{3}.*>{3}", line):
            continue
        line = re.sub(r"^#\s*", "", line)
        lines.append(line)
    return re.sub(r"\s+", " ", " ".join(lines)).strip()

def excerpt(value, limit=180):
    text = clean_text(value)
    if len(text) <= limit:
        return text
    cut = text[:limit + 1]
    stop = max(cut.rfind(" "), cut.rfind("."), cut.rfind("\u0964"))
    if stop < int(limit * 0.6):
        stop = limit
    return cut[:stop].rstrip() + "\u2026"

def esc(value):
    return html.escape(str(value or ""), quote=True)

def absolute_asset(path):
    path = str(path or "").strip()
    if not path:
        return DEFAULT_IMAGE
    if re.match(r"^https?://", path, re.I):
        return path
    return BASE + "/" + path.lstrip("/")

def person_node():
    return {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": "Dr. Ahmad Ali",
        "jobTitle": "Professor of Islamic Studies",
        "affiliation": {
            "@type": "CollegeOrUniversity",
            "name": "University of Chittagong",
        },
        "url": BASE + "/bn/",
        "image": DEFAULT_IMAGE,
    }

def publication_year(item):
    meta = item.get("meta") or {}
    for value in (meta.get("publicationYear"), meta.get("edition"), meta.get("editionBn")):
        m = re.search(r"\b(1[0-9]{3}|20[0-9]{2})\b", str(value or ""))
        if m:
            return m.group(1)
    return ""

def title_for(item, kind, lang):
    loc = localized(item, lang)
    return str(loc.get("title") or item.get("titleEn") or item.get("titleBn") or item.get("titleAr") or "").strip()

def description_for(item, kind, lang):
    loc = localized(item, lang)
    if kind == "book":
        source = loc.get("summary") or loc.get("subtitle") or loc.get("title")
    else:
        source = loc.get("excerpt") or loc.get("body") or loc.get("title")
    return excerpt(source, 180)

def item_image(item, kind):
    if kind == "book":
        return absolute_asset((item.get("media") or {}).get("cover"))
    return DEFAULT_IMAGE

def item_urls(kind, item_id):
    cfg = CONTENT[kind]
    return (
        BASE + "/" + cfg["en_dir"] + "/" + item_id + ".html",
        BASE + "/" + cfg["bn_dir"] + "/" + item_id + ".html",
    )

def schema_node(item, kind, lang, canonical, image_url, title, description):
    if kind == "book":
        meta = item.get("meta") or {}
        publisher = meta.get("publisherBn") if lang == "bn" else meta.get("publisher")
        publisher = publisher or meta.get("publisher") or meta.get("publisherBn")
        node = {
            "@type": "Book",
            "@id": canonical + "#book",
            "name": title,
            "url": canonical,
            "description": description,
            "inLanguage": lang,
            "author": {"@id": PERSON_ID},
            "image": image_url,
        }
        if meta.get("isbn"):
            node["isbn"] = str(meta["isbn"])
        if publisher:
            node["publisher"] = {"@type": "Organization", "name": str(publisher)}
        year = publication_year(item)
        if year:
            node["datePublished"] = year
        return node

    node = {
        "@type": "Article",
        "@id": canonical + "#article",
        "headline": title,
        "url": canonical,
        "description": description,
        "inLanguage": lang,
        "author": {"@id": PERSON_ID},
        "image": image_url,
    }
    if item.get("date"):
        node["datePublished"] = str(item["date"])
    return node

def detail_seo_block(item, kind, lang):
    item_id = safe_id(item.get("id"))
    en_url, bn_url = item_urls(kind, item_id)
    canonical = bn_url if lang == "bn" else en_url
    title = title_for(item, kind, lang)
    desc = description_for(item, kind, lang)
    image_url = item_image(item, kind)
    author_name = "\u09a1. \u0986\u09b9\u09ae\u09a6 \u0986\u09b2\u09c0" if lang == "bn" else "Dr. Ahmad Ali"
    full_title = title + " | " + author_name
    locale = "bn_BD" if lang == "bn" else "en_US"
    alt_locale = "en_US" if lang == "bn" else "bn_BD"
    cfg = CONTENT[kind]

    entity = schema_node(item, kind, lang, canonical, image_url, title, desc)
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            person_node(),
            entity,
            {
                "@type": "WebPage",
                "@id": canonical + "#webpage",
                "url": canonical,
                "name": title,
                "description": desc,
                "inLanguage": lang,
                "about": entity["@id"],
                "mainEntity": entity["@id"],
                "isPartOf": {"@id": BASE + "/#website"},
            },
        ],
    }
    ld = json.dumps(graph, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    lines = [
        "<!-- SEO PHASE 2 DETAIL START -->",
        '<meta name="content-id" content="' + esc(item_id) + '"/>',
        '<link rel="canonical" href="' + esc(canonical) + '"/>',
        '<link rel="alternate" hreflang="en" href="' + esc(en_url) + '"/>',
        '<link rel="alternate" hreflang="bn" href="' + esc(bn_url) + '"/>',
        '<link rel="alternate" hreflang="x-default" href="' + esc(bn_url) + '"/>',
        '<link rel="icon" type="image/svg+xml" href="' + BASE + '/favicon.svg"/>',
        '<meta property="og:title" content="' + esc(full_title) + '"/>',
        '<meta property="og:description" content="' + esc(desc) + '"/>',
        '<meta property="og:url" content="' + esc(canonical) + '"/>',
        '<meta property="og:type" content="' + cfg["og_type"] + '"/>',
        '<meta property="og:site_name" content="Dr. Ahmad Ali"/>',
        '<meta property="og:locale" content="' + locale + '"/>',
        '<meta property="og:locale:alternate" content="' + alt_locale + '"/>',
        '<meta property="og:image" content="' + esc(image_url) + '"/>',
        '<meta property="og:image:alt" content="' + esc(title) + '"/>',
        '<meta name="twitter:card" content="summary"/>',
        '<meta name="twitter:title" content="' + esc(full_title) + '"/>',
        '<meta name="twitter:description" content="' + esc(desc) + '"/>',
        '<meta name="twitter:image" content="' + esc(image_url) + '"/>',
    ]
    if kind in ("article", "post") and item.get("date"):
        lines.append('<meta property="article:published_time" content="' + esc(item["date"]) + '"/>')
    lines.extend([
        '<script type="application/ld+json">' + ld + "</script>",
        "<!-- SEO PHASE 2 DETAIL END -->",
    ])
    return "\n".join(lines), full_title, desc

def set_title_and_description(doc, title, description):
    doc = re.sub(r"<title>[\s\S]*?</title>", "<title>" + esc(title) + "</title>", doc, count=1, flags=re.I)
    patterns = [
        re.compile(r'(<meta[^>]+name=["\']description["\'][^>]+content=["\'])[^"\']*(["\'][^>]*>)', re.I),
        re.compile(r'(<meta[^>]+content=["\'])[^"\']*(["\'][^>]+name=["\']description["\'][^>]*>)', re.I),
    ]
    for pat in patterns:
        if pat.search(doc):
            return pat.sub(lambda m: m.group(1) + esc(description) + m.group(2), doc, count=1)
    return doc.replace("</head>", '<meta name="description" content="' + esc(description) + '"/>\n</head>', 1)

def set_element_text(doc, tag, element_id, text):
    pat = re.compile(
        r'(<'+tag+r'\b[^>]*\bid=["\']'+re.escape(element_id)+r'["\'][^>]*>)[\s\S]*?(</'+tag+r'>)',
        re.I,
    )
    return pat.sub(lambda m: m.group(1) + esc(text) + m.group(2), doc, count=1)

def render_longform_body(body):
    out = []
    for raw in str(body or "").splitlines():
        line = raw.strip()
        if not line:
            continue
        if re.fullmatch(r"\*{3}(?:\s+\*{3})+", line) or re.fullmatch(r"<{3}.*>{3}", line):
            out.append('<div class="post-divider" aria-hidden="true"></div>')
        elif re.match(r"^(?:\d+|[\u09e6-\u09ef]+)\.\s+", line):
            out.append("<h3>" + esc(line) + "</h3>")
        elif re.match(r"^#\s*", line):
            out.append('<p class="post-question">' + esc(re.sub(r"^#\s*", "", line)) + "</p>")
        else:
            out.append("<p>" + esc(line) + "</p>")
    return "".join(out)

def set_div_html(doc, element_id, inner_html):
    pat = re.compile(
        r'(<div\b[^>]*\bid=["\']'+re.escape(element_id)+r'["\'][^>]*>)[\s\S]*?(</div>)',
        re.I,
    )
    return pat.sub(lambda m: m.group(1) + inner_html + m.group(2), doc, count=1)

def pre_render(doc, item, kind, lang):
    loc = localized(item, lang)
    title = str(loc.get("title") or "")
    if kind == "book":
        doc = set_element_text(doc, "h1", "bookDetailTitle", title)
        doc = set_element_text(doc, "p", "bookDetailSubtitle", loc.get("subtitle") or "")
        doc = set_element_text(doc, "h2", "detailCoverTitle", (item.get("bn") or {}).get("title") or title)
        doc = set_element_text(doc, "p", "bookDetailSummary", loc.get("summary") or "")
        return doc

    body = str(loc.get("body") or "")
    if kind == "article":
        doc = set_element_text(doc, "h1", "selectedArticleTitle", title)
        doc = set_element_text(doc, "time", "selectedArticleDate", str(item.get("date") or ""))
        if body:
            doc = set_div_html(doc, "selectedArticleBody", render_longform_body(body))
        return doc

    doc = set_element_text(doc, "h1", "postDetailTitle", title)
    doc = set_element_text(doc, "time", "postDetailDate", str(item.get("date") or ""))
    if body:
        doc = set_div_html(doc, "postDetailBody", render_longform_body(body))
    return doc

def rewrite_language_links(doc, kind, lang, item_id):
    cfg = CONTENT[kind]
    if kind == "book":
        en_old, bn_old = ("book.html", "bn/book.html") if lang == "en" else ("../book.html", "book.html")
    elif kind == "article":
        en_old, bn_old = ("article.html", "bn/article.html") if lang == "en" else ("../article.html", "article.html")
    else:
        en_old, bn_old = ("post.html", "bn/post.html") if lang == "en" else ("../post.html", "post.html")

    if lang == "en":
        en_new = cfg["en_dir"] + "/" + item_id + ".html"
        bn_new = cfg["bn_dir"] + "/" + item_id + ".html"
    else:
        en_new = "../" + cfg["en_dir"] + "/" + item_id + ".html"
        bn_new = cfg["bn_dir"].split("/", 1)[1] + "/" + item_id + ".html"

    doc = doc.replace('href="' + en_old + '"', 'href="' + en_new + '"', 1)
    doc = doc.replace('href="' + bn_old + '"', 'href="' + bn_new + '"', 1)
    return doc

def make_page(template, item, kind, lang):
    item_id = safe_id(item.get("id"))
    doc = LEGACY_RE.sub("", template, count=1)
    doc = PHASE1_RE.sub("", doc, count=1)
    doc = re.sub(r'<base\b[^>]*>\s*', "", doc, flags=re.I)
    seo, full_title, desc = detail_seo_block(item, kind, lang)
    doc = set_title_and_description(doc, full_title, desc)
    doc = doc.replace("<head>", '<head>\n<base href="' + ("/bn/" if lang == "bn" else "/") + '"/>', 1)
    doc = doc.replace("</head>", seo + "\n</head>", 1)
    doc = rewrite_language_links(doc, kind, lang, item_id)
    doc = pre_render(doc, item, kind, lang)
    if STATIC_MARKER not in doc:
        if re.match(r"\s*<!DOCTYPE", doc, re.I):
            m = re.search(r">", doc)
            doc = doc[:m.end()] + "\n" + STATIC_MARKER + doc[m.end():]
        else:
            doc = STATIC_MARKER + "\n" + doc
    return doc

def remove_stale_html(directory, expected_names):
    d = ROOT / directory
    if not d.exists():
        return
    for p in d.glob("*.html"):
        if p.name in expected_names:
            continue
        try:
            head = p.read_text(encoding="utf-8")[:500]
        except Exception:
            continue
        if STATIC_MARKER in head:
            p.unlink()

def write_generated_pages():
    all_items = {}
    total = 0
    for kind, cfg in CONTENT.items():
        items = parse_manifest(kind)
        all_items[kind] = items
        en_template = read(cfg["en_template"])
        bn_template = read(cfg["bn_template"])
        en_dir = ROOT / cfg["en_dir"]
        bn_dir = ROOT / cfg["bn_dir"]
        en_dir.mkdir(parents=True, exist_ok=True)
        bn_dir.mkdir(parents=True, exist_ok=True)
        expected = set()
        for item in items:
            item_id = safe_id(item.get("id"))
            name = item_id + ".html"
            expected.add(name)
            (en_dir / name).write_text(make_page(en_template, item, kind, "en"), encoding="utf-8")
            (bn_dir / name).write_text(make_page(bn_template, item, kind, "bn"), encoding="utf-8")
            total += 2
        remove_stale_html(cfg["en_dir"], expected)
        remove_stale_html(cfg["bn_dir"], expected)
    return all_items, total

def sitemap_url(loc, en_url, bn_url, lastmod=""):
    lines = [
        "  <url>",
        "    <loc>" + html.escape(loc) + "</loc>",
        '    <xhtml:link rel="alternate" hreflang="en" href="' + html.escape(en_url, quote=True) + '"/>',
        '    <xhtml:link rel="alternate" hreflang="bn" href="' + html.escape(bn_url, quote=True) + '"/>',
        '    <xhtml:link rel="alternate" hreflang="x-default" href="' + html.escape(bn_url, quote=True) + '"/>',
    ]
    if lastmod:
        lines.append("    <lastmod>" + html.escape(lastmod) + "</lastmod>")
    lines.append("  </url>")
    return "\n".join(lines)

def write_sitemap(all_items):
    entries = []
    for en_url, bn_url in PAGE_PAIRS:
        entries.append(sitemap_url(en_url, en_url, bn_url))
        entries.append(sitemap_url(bn_url, en_url, bn_url))

    for kind, items in all_items.items():
        for item in items:
            item_id = safe_id(item.get("id"))
            en_url, bn_url = item_urls(kind, item_id)
            lastmod = str(item.get("date") or "") if kind in ("article", "post") else ""
            entries.append(sitemap_url(en_url, en_url, bn_url, lastmod))
            entries.append(sitemap_url(bn_url, en_url, bn_url, lastmod))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")

def main():
    all_items, count = write_generated_pages()
    write_sitemap(all_items)
    print("Generated", count, "static EN/BN detail pages.")
    print("Books:", len(all_items["book"]), "Articles:", len(all_items["article"]), "Writings:", len(all_items["post"]))
    print("Updated sitemap.xml.")

if __name__ == "__main__":
    main()
