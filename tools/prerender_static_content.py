#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pre-render JS-backed archive/home content into the normal HTML DOM.

JavaScript still replaces/enhances these nodes at runtime, so the interactive
site behavior is unchanged. Crawlers, previews, archive tools, and no-JS
visitors receive meaningful HTML immediately.
"""

from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]

TARGETS = {
    "index": ROOT / "index.html",
    "index_bn": ROOT / "bn" / "index.html",
    "books": ROOT / "books.html",
    "books_bn": ROOT / "bn" / "books.html",
    "publications": ROOT / "publications.html",
    "publications_bn": ROOT / "bn" / "publications.html",
}

CATEGORY_BN = {
    "Aqidah & Thought": "আকীদা ও চিন্তাধারা",
    "Fiqh & Law": "ফিকহ ও আইন",
    "Qur’an & Tafsir": "কুরআন ও তাফসীর",
    "Qur’an & Hadith": "কুরআন ও হাদীস",
    "Islamic Thought": "ইসলামী চিন্তাধারা",
    "Islamic Ethics & Society": "ইসলামী নৈতিকতা ও সমাজ",
    "Governance & Society": "শাসনব্যবস্থা ও সমাজ",
    "Sirah & Biography": "সীরাত ও জীবনী",
    "Spirituality": "আত্মশুদ্ধি ও আধ্যাত্মিকতা",
    "Arabic Language & Literature": "আরবি ভাষা ও সাহিত্য",
    "Islamic Economics & Zakat": "ইসলামী অর্থনীতি ও যাকাত",
}

SERIES = [
    {
        "id": "bidat",
        "en": {
            "title": "Bid‘ah",
            "note": "Eight-volume research project; the eighth volume is published in two parts as Modern Currents of Thought and Ideologies.",
        },
        "bn": {
            "title": "বিদ‘আত",
            "note": "আট খণ্ডের গবেষণা প্রকল্প; অষ্টম খণ্ডটি “আধুনিক চিন্তাধারা ও মতবাদ” নামে দুই ভাগে প্রকাশিত।",
        },
        "volumes": [
            ("1", "186396", None, None),
            ("2", "186398", None, None),
            ("3", "194779", None, None),
            ("4", "206454", None, None),
            ("5", "214109", None, None),
            ("6", "234608", None, None),
            ("7", "273066", None, None),
            ("8 · I", "509331", None, None),
            ("8 · II", "511409", None, None),
        ],
    },
    {
        "id": "usulul-iman",
        "en": {
            "title": "Usul al-Iman",
            "note": "A multi-volume treatment of the foundations of faith; Volumes 5 and 6 are forthcoming.",
        },
        "bn": {
            "title": "উসূলুল ঈমান",
            "note": "ঈমানের মৌলিক বিষয়াবলি নিয়ে বহু-খণ্ডের গ্রন্থমালা; ৫ম ও ৬ষ্ঠ খণ্ড প্রকাশের পথে।",
        },
        "volumes": [
            ("1", "305722", None, None),
            ("2", "305723", None, None),
            ("3", "394655", None, None),
            ("4", "394656", None, None),
            ("5", None, "forthcoming", "usulul-iman-vol-5"),
            ("6", None, "forthcoming", "usulul-iman-vol-6"),
        ],
    },
    {
        "id": "zubdatul-bayan",
        "en": {
            "title": "Zubdat al-Bayan",
            "note": "An ongoing Bengali tafsir project intended to develop into a complete commentary on the Qur’an.",
        },
        "bn": {
            "title": "যুবদাতুল বায়ান",
            "note": "পূর্ণাঙ্গ বাংলা কুরআন তাফসির হিসেবে বিকাশমান একটি চলমান তাফসির প্রকল্প।",
        },
        "volumes": [
            ("1", "204536", None, None),
            ("2", "234566", None, None),
            ("3", None, "forthcoming", "zubdatul-bayan-vol-3"),
            ("…", None, "ongoing", None),
        ],
    },
]

NOSCRIPT = (
    '<noscript data-static-prerender-fallback>'
    '<style>'
    '.reveal{opacity:1!important;transform:none!important;}'
    '.book-search,#bookFilters{display:none!important;}'
    '</style>'
    '</noscript>'
)


def fail(message: str) -> None:
    raise SystemExit("ERROR: " + message)


def esc(value) -> str:
    return html.escape(str(value or ""), quote=True)


def load_manifest(filename: str, variable: str):
    path = ROOT / filename
    if not path.exists():
        fail(f"Missing {filename}")
    text = path.read_text(encoding="utf-8")
    marker = variable + " ="
    i = text.find(marker)
    if i < 0:
        fail(f"Could not find {variable} in {filename}")
    raw = text[i + len(marker):].strip()
    if raw.endswith(";"):
        raw = raw[:-1].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"Could not parse {filename}: {exc}")
    if not isinstance(data, list):
        fail(f"{filename} does not contain an array")
    return data


def marker_start(element_id: str) -> str:
    return f"<!-- STATIC PRERENDER START: {element_id} -->"


def marker_end(element_id: str) -> str:
    return f"<!-- STATIC PRERENDER END: {element_id} -->"


def set_container(doc: str, tag: str, element_id: str, inner: str) -> str:
    start = marker_start(element_id)
    end = marker_end(element_id)
    block = start + inner + end

    if start in doc:
        pattern = re.compile(re.escape(start) + r"[\s\S]*?" + re.escape(end), re.I)
        updated, count = pattern.subn(lambda _m: block, doc, count=1)
        if count != 1:
            fail(f"Could not refresh prerender block for #{element_id}")
        return updated

    pattern = re.compile(
        r"(<" + re.escape(tag) + r"\b[^>]*\bid=[\"']"
        + re.escape(element_id)
        + r"[\"'][^>]*>)\s*(</"
        + re.escape(tag)
        + r">)",
        re.I,
    )
    updated, count = pattern.subn(
        lambda m: m.group(1) + block + m.group(2),
        doc,
        count=1,
    )
    if count == 1:
        return updated

    # The homepage originally contains a single loading-placeholder paragraph.
    # It is known template content and is safe to replace on the first prerender.
    if element_id in {"recentUpdatesList", "homeWritingsList"}:
        placeholder_pattern = re.compile(
            r"(<" + re.escape(tag) + r"\b[^>]*\bid=[\"']"
            + re.escape(element_id)
            + r"[\"'][^>]*>)\s*"
            r"<p\b[^>]*\bclass=[\"'][^\"']*\bpage-lead\b[^\"']*[\"'][^>]*>"
            r"[\s\S]*?</p>\s*"
            r"(</" + re.escape(tag) + r">)",
            re.I,
        )
        updated, count = placeholder_pattern.subn(
            lambda m: m.group(1) + block + m.group(2),
            doc,
            count=1,
        )
        if count == 1:
            return updated

    fail(
        f"#{element_id} is not empty and has no prerender markers; "
        "refusing to overwrite unknown content."
    )


def set_text(doc: str, tag: str, element_id: str, value: str) -> str:
    pattern = re.compile(
        r"(<" + re.escape(tag) + r"\b[^>]*\bid=[\"']"
        + re.escape(element_id)
        + r"[\"'][^>]*>)[\s\S]*?(</"
        + re.escape(tag)
        + r">)",
        re.I,
    )
    updated, count = pattern.subn(
        lambda m: m.group(1) + esc(value) + m.group(2),
        doc,
        count=1,
    )
    if count != 1:
        fail(f"Could not update #{element_id}")
    return updated


def ensure_noscript_visibility(doc: str) -> str:
    if "data-static-prerender-fallback" in doc:
        return doc
    if "</head>" not in doc:
        fail("Missing </head>")
    return doc.replace("</head>", NOSCRIPT + "\n</head>", 1)


def write_target(key: str, doc: str) -> None:
    path = TARGETS[key]
    path.write_text(doc, encoding="utf-8")
    print("Pre-rendered:", path.relative_to(ROOT))


def to_bn_digits(value: str) -> str:
    return str(value).translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))


def parse_iso_date(value: str):
    try:
        return datetime.strptime(str(value or ""), "%Y-%m-%d").date()
    except ValueError:
        return None


EN_MONTH_FULL = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
EN_MONTH_SHORT = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
BN_MONTH_FULL = [
    "", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
]
BN_MONTH_SHORT = [
    "", "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে",
]


def format_update_date(value: str, lang: str) -> str:
    d = parse_iso_date(value)
    if not d:
        return ""
    if lang == "bn":
        return f"{to_bn_digits(d.day)} {BN_MONTH_FULL[d.month]}, {to_bn_digits(d.year)}"
    return f"{EN_MONTH_FULL[d.month]} {d.day}, {d.year}"


def format_writing_date(value: str, lang: str) -> str:
    d = parse_iso_date(value)
    if not d:
        return ""
    if lang == "bn":
        return f"{to_bn_digits(d.day)} {BN_MONTH_SHORT[d.month]}, {to_bn_digits(d.year)}"
    return f"{d.day} {EN_MONTH_SHORT[d.month]} {d.year}"


def clean_long_text(value: str) -> str:
    lines = []
    for raw in str(value or "").splitlines():
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


def excerpt(value: str, max_len: int = 180) -> str:
    text = clean_long_text(value)
    if len(text) <= max_len:
        return text
    cut = text[:max_len]
    stop = max(cut.rfind("।"), cut.rfind("."), cut.rfind(" "))
    if stop <= 95:
        stop = max_len
    return cut[:stop].strip() + "…"


def localized(item, lang: str):
    return item.get(lang) or item.get("en") or item.get("bn") or {}


def asset_for_lang(url: str, lang: str) -> str:
    value = str(url or "").strip()
    if not value:
        return ""
    if re.match(r"^(?:https?:)?//", value, re.I):
        return value
    if value.startswith(("#", "mailto:", "data:")):
        return value
    return ("../" if lang == "bn" else "") + value


def publication_details(item, lang: str) -> str:
    details = (
        item.get("detailsBn") or item.get("detailsEn")
        if lang == "bn"
        else item.get("detailsEn") or item.get("detailsBn")
    )
    if details:
        return str(details)

    bits = []
    if item.get("volume"):
        bits.append(("খণ্ড " if lang == "bn" else "Vol. ") + str(item["volume"]))
    if item.get("issue"):
        bits.append(("সংখ্যা " if lang == "bn" else "Issue ") + str(item["issue"]))
    if item.get("pages"):
        bits.append(("পৃ. " if lang == "bn" else "pp. ") + str(item["pages"]))

    def pick(en_key, bn_key):
        if lang == "bn":
            return item.get(bn_key) or item.get(en_key)
        return item.get(en_key) or item.get(bn_key)

    issue_date = pick("issueDateEn", "issueDateBn")
    online_date = pick("onlineDateEn", "onlineDateBn")
    publisher = pick("publisherEn", "publisherBn")
    notes = pick("notesEn", "notesBn")

    if issue_date:
        bits.append(("মূল সংখ্যা প্রকাশকাল: " if lang == "bn" else "Issue date: ") + str(issue_date))
    if online_date:
        bits.append(("অনলাইন প্রকাশ: " if lang == "bn" else "Online publication: ") + str(online_date))
    if publisher:
        bits.append(("প্রকাশক: " if lang == "bn" else "Publisher: ") + str(publisher))
    if notes:
        bits.append(str(notes))
    return " · ".join(bits)


def publication_article(item, lang: str) -> str:
    item_type = str(item.get("type") or "")
    date_label = item.get("dateLabelBn") if lang == "bn" else item.get("dateLabelEn")
    date_html = "<br>".join(esc(x) for x in str(date_label or "").splitlines())

    if item_type == "arabic":
        title = item.get("titleAr") or item.get("titleEn") or item.get("titleBn") or ""
        title_html = f'<h3 lang="ar" dir="rtl">{esc(title)}</h3>'
    else:
        title = (
            item.get("titleBn") or item.get("titleEn")
            if lang == "bn"
            else item.get("titleEn") or item.get("titleBn")
        ) or ""
        title_html = "<h3>" + esc(title)
        original_bn = item.get("originalTitleBn")
        if lang == "en" and original_bn and original_bn != title:
            title_html += (
                '<small class="publication-original-title" lang="bn">'
                + esc(original_bn)
                + "</small>"
            )
        title_html += "</h3>"

    source = (
        item.get("sourceBn") or item.get("sourceEn") or item.get("sourceAr")
        if lang == "bn"
        else item.get("sourceEn") or item.get("sourceAr") or item.get("sourceBn")
    ) or ""
    details = publication_details(item, lang)

    p_parts = []
    if source:
        attrs = ' lang="ar" dir="rtl"' if item_type == "arabic" else ""
        p_parts.append(f"<em{attrs}>{esc(source)}</em>")
    if details:
        if source:
            p_parts.append(" · ")
        p_parts.append(esc(details))

    labels = {
        "en": {"article": "Article", "pdf": "PDF", "doi": "DOI", "link": "Link"},
        "bn": {"article": "প্রবন্ধ", "pdf": "PDF", "doi": "DOI", "link": "লিংক"},
    }[lang]
    links = []
    for key, label_key in (
        ("articleUrl", "article"),
        ("pdfUrl", "pdf"),
        ("doi", "doi"),
        ("otherUrl", "link"),
    ):
        if item.get(key):
            links.append(
                '<a href="'
                + esc(asset_for_lang(item[key], lang))
                + '" target="_blank" rel="noopener">'
                + esc(labels[label_key])
                + " ↗</a>"
            )

    body = title_html + "<p>" + "".join(p_parts) + "</p>"
    if links:
        body += '<div class="publication-links">' + "".join(links) + "</div>"

    return (
        '<article id="'
        + esc(item.get("id"))
        + '"><span>'
        + date_html
        + "</span><div>"
        + body
        + "</div></article>"
    )


def publication_simple_item(item, lang: str) -> str:
    title = (
        item.get("titleBn") or item.get("titleEn")
        if lang == "bn"
        else item.get("titleEn") or item.get("titleBn")
    ) or ""
    details = (
        item.get("detailsBn") or item.get("detailsEn")
        if lang == "bn"
        else item.get("detailsEn") or item.get("detailsBn")
    ) or ""
    text = f"{title} — {details}" if details else title
    return "<li>" + esc(text) + "</li>"


def prerender_publications(publications) -> None:
    for lang, key in (("en", "publications"), ("bn", "publications_bn")):
        doc = TARGETS[key].read_text(encoding="utf-8")
        research = "".join(
            publication_article(x, lang) for x in publications if x.get("type") == "research"
        )
        arabic = "".join(
            publication_article(x, lang) for x in publications if x.get("type") == "arabic"
        )
        edited = "".join(
            publication_simple_item(x, lang) for x in publications if x.get("type") == "edited"
        )
        translations = "".join(
            publication_simple_item(x, lang)
            for x in publications
            if x.get("type") == "translation"
        )

        doc = set_container(doc, "div", "publicationResearch", research)
        doc = set_container(doc, "div", "publicationArabic", arabic)
        doc = set_container(doc, "ul", "publicationEdited", edited)
        doc = set_container(doc, "ul", "publicationTranslations", translations)
        doc = ensure_noscript_visibility(doc)
        write_target(key, doc)


def category_name(value: str, lang: str) -> str:
    return CATEGORY_BN.get(value, value) if lang == "bn" else value


def text_lang_attrs(value: str) -> str:
    text = str(value or "")
    if re.search(r"[\u0600-\u06ff]", text):
        return ' lang="ar" dir="rtl" data-keep-latin-digits'
    if re.search(r"[\u0980-\u09ff]", text):
        return ' lang="bn" dir="ltr"'
    if re.search(r"[A-Za-z]", text):
        return ' lang="en" dir="ltr" data-keep-latin-digits'
    return ""


def book_card(book, lang: str) -> str:
    loc = localized(book, lang)
    title = loc.get("title") or (book.get("bn") or {}).get("title") or ""
    cover_title = (
        loc.get("coverTitle")
        or (book.get("bn") or {}).get("title")
        or loc.get("title")
        or ""
    )
    status = book.get("status") or "published"
    classes = "book-card" + (" is-forthcoming" if status == "forthcoming" else "")
    search_title = " ".join(
        [
            str(loc.get("title") or ""),
            str((book.get("bn") or {}).get("title") or ""),
            str((book.get("en") or {}).get("title") or ""),
        ]
    ).lower()
    details = "বিস্তারিত দেখুন" if lang == "bn" else "View Details"
    forthcoming = "প্রকাশিতব্য" if lang == "bn" else "Forthcoming"
    href = "books/" + str(book.get("id") or "") + ".html"

    media = book.get("media") or {}
    cover = media.get("cover")
    if cover:
        cover_html = (
            '<img class="book-cover-image" src="'
            + esc(asset_for_lang(cover, lang))
            + '" alt="'
            + esc(title or cover_title)
            + '">'
        )
        cover_class = "book-cover has-real-cover"
    else:
        cover_class = "book-cover"
        cover_html = (
            '<span class="book-series">'
            + esc(category_name(str(book.get("category") or ""), lang))
            + "</span>"
            + '<span class="book-glyph" aria-hidden="true">۞</span>'
            + "<h3"
            + text_lang_attrs(cover_title)
            + ">"
            + esc(cover_title)
            + "</h3>"
            + '<span class="book-author" lang="bn">ড. আহমদ আলী</span>'
        )

    overlay = (
        '<span class="book-hover-overlay"><span class="book-hover-action">'
        + esc(details)
        + "</span></span>"
    )
    badge = (
        '<span class="book-status-badge">' + esc(forthcoming) + "</span>"
        if status == "forthcoming"
        else ""
    )

    return (
        '<article class="'
        + classes
        + '" data-category="'
        + esc(book.get("category") or "")
        + '" data-title="'
        + esc(search_title)
        + '"><a class="'
        + cover_class
        + '" href="'
        + esc(href)
        + '" aria-label="'
        + esc(details + ": " + str(title or cover_title))
        + '">'
        + cover_html
        + overlay
        + badge
        + "</a></article>"
    )


def book_series_html(books, lang: str) -> str:
    by_rokomari = {
        str(book.get("rokomariId")): book
        for book in books
        if book.get("rokomariId")
    }
    pieces = []
    for series in SERIES:
        loc = series[lang]
        vols = []
        for label, rid, status, item_id in series["volumes"]:
            shown_label = to_bn_digits(label) if lang == "bn" else label
            if status:
                suffix = (
                    "চলমান" if (lang == "bn" and status == "ongoing")
                    else "প্রকাশিতব্য" if lang == "bn"
                    else "Ongoing" if status == "ongoing"
                    else "Forthcoming"
                )
                text = shown_label + " · " + suffix
                if item_id:
                    vols.append(
                        '<a class="series-volume muted" href="books/'
                        + esc(item_id)
                        + '.html">'
                        + esc(text)
                        + "</a>"
                    )
                else:
                    vols.append('<span class="series-volume muted">' + esc(text) + "</span>")
                continue

            book = by_rokomari.get(str(rid))
            if not book:
                continue
            vols.append(
                '<a class="series-volume" href="books/'
                + esc(book.get("id"))
                + '.html">'
                + esc(shown_label)
                + "</a>"
            )

        pieces.append(
            '<article class="series-card"><div class="series-card-head"><h3>'
            + esc(loc["title"])
            + "</h3><p>"
            + esc(loc["note"])
            + '</p></div><div class="series-volume-row">'
            + "".join(vols)
            + "</div></article>"
        )
    return "".join(pieces)


def prerender_books(books) -> None:
    published = [b for b in books if (b.get("status") or "published") == "published"]
    thesis = [b for b in books if b.get("status") == "thesis"]
    forthcoming = [b for b in books if b.get("status") == "forthcoming"]

    categories = []
    for book in published:
        cat = book.get("category")
        if cat and cat not in categories:
            categories.append(cat)

    for lang, key in (("en", "books"), ("bn", "books_bn")):
        doc = TARGETS[key].read_text(encoding="utf-8")

        doc = set_container(doc, "div", "bookSeries", book_series_html(books, lang))
        doc = set_container(
            doc, "div", "bookGrid",
            "".join(book_card(book, lang) for book in published),
        )
        doc = set_container(
            doc, "div", "bookThesis",
            "".join(book_card(book, lang) for book in thesis),
        )
        doc = set_container(
            doc, "div", "bookForthcoming",
            "".join(book_card(book, lang) for book in forthcoming),
        )

        filter_buttons = [
            '<button class="filter-btn active" data-filter="All">'
            + ("সব" if lang == "bn" else "All")
            + "</button>"
        ]
        for cat in categories:
            filter_buttons.append(
                '<button class="filter-btn" data-filter="'
                + esc(cat)
                + '">'
                + esc(category_name(cat, lang))
                + "</button>"
            )
        doc = set_container(doc, "div", "bookFilters", "".join(filter_buttons))
        doc = set_text(doc, "strong", "bookCatalogTitle", "গ্রন্থ তালিকা" if lang == "bn" else "Book catalog")
        doc = set_text(
            doc, "span", "bookCatalogNote",
            "বিষয় অনুসারে প্রকাশিত গ্রন্থসমূহ দেখুন।"
            if lang == "bn"
            else "Browse published works by topic.",
        )
        doc = set_text(
            doc, "p", "bookEmpty",
            "কোনো মিলযুক্ত গ্রন্থ পাওয়া যায়নি।"
            if lang == "bn"
            else "No matching books found.",
        )
        doc = ensure_noscript_visibility(doc)
        write_target(key, doc)


def update_row(item, lang: str) -> str:
    loc = localized(item, lang)
    href = str(item.get("href") or "").strip()
    tag = "a" if href else "article"
    href_attr = ' href="' + esc(href) + '"' if href else ""
    summary = (
        "<p>" + esc(loc.get("summary")) + "</p>"
        if loc.get("summary")
        else ""
    )
    arrow = "→" if href else ""
    return (
        "<" + tag + ' class="recent-update-item"' + href_attr + ">"
        + '<time datetime="' + esc(item.get("date")) + '">'
        + esc(format_update_date(item.get("date"), lang)) + "</time>"
        + '<div class="recent-update-copy"><h3>'
        + esc(loc.get("title")) + "</h3>" + summary + "</div>"
        + '<span class="recent-update-arrow" aria-hidden="true">'
        + arrow + "</span></" + tag + ">"
    )


def writing_row(post, lang: str) -> str:
    loc = localized(post, lang)
    post_id = str(post.get("id") or "")
    body_excerpt = loc.get("excerpt") or excerpt(loc.get("body"), 180)
    read = "পুরোটি পড়ুন" if lang == "bn" else "View Full"
    return (
        '<a class="home-writing-item" href="writings/'
        + esc(post_id)
        + '.html"><time datetime="'
        + esc(post.get("date"))
        + '">'
        + esc(format_writing_date(post.get("date"), lang))
        + '</time><div class="home-writing-copy"><h3>'
        + esc(loc.get("title"))
        + "</h3><p>"
        + esc(body_excerpt)
        + '</p></div><span class="home-writing-action">'
        + esc(read)
        + " →</span></a>"
    )


def set_view_more_hidden(doc: str, should_hide: bool) -> str:
    pat = re.compile(
        r'(<a\b[^>]*\bid=["\']recentUpdatesViewMore["\'][^>]*)(>)',
        re.I,
    )

    def repl(match):
        attrs = re.sub(r'\s+hidden(?:=["\'][^"\']*["\'])?', "", match.group(1), flags=re.I)
        if should_hide:
            attrs += ' hidden=""'
        return attrs + match.group(2)

    updated, count = pat.subn(repl, doc, count=1)
    if count != 1:
        fail("Could not update #recentUpdatesViewMore")
    return updated


def prerender_home(updates, posts) -> None:
    today = date.today()

    def visible_update(item):
        d = parse_iso_date(item.get("date"))
        return bool(d and d <= today)

    visible = sorted(
        [x for x in updates if visible_update(x)],
        key=lambda x: (str(x.get("date") or ""), str(x.get("id") or "")),
        reverse=True,
    )
    latest15 = visible[:15]
    ordered_posts = sorted(posts, key=lambda x: str(x.get("date") or ""), reverse=True)
    latest_posts = ordered_posts[:3]

    for lang, key in (("en", "index"), ("bn", "index_bn")):
        doc = TARGETS[key].read_text(encoding="utf-8")

        update_html = (
            "".join(update_row(x, lang) for x in latest15)
            if latest15
            else (
                '<p class="page-lead">এখনও কোনো আপডেট যোগ করা হয়নি।</p>'
                if lang == "bn"
                else '<p class="page-lead">No updates have been added yet.</p>'
            )
        )
        writing_html = (
            "".join(writing_row(x, lang) for x in latest_posts)
            if latest_posts
            else (
                '<p class="page-lead">এখনও কোনো লেখা যোগ করা হয়নি।</p>'
                if lang == "bn"
                else '<p class="page-lead">No writings have been added yet.</p>'
            )
        )

        doc = set_container(doc, "div", "recentUpdatesList", update_html)
        doc = set_container(doc, "div", "homeWritingsList", writing_html)
        doc = set_view_more_hidden(doc, len(visible) <= 15)
        doc = ensure_noscript_visibility(doc)
        write_target(key, doc)


def main() -> None:
    missing = [str(p.relative_to(ROOT)) for p in TARGETS.values() if not p.exists()]
    if missing:
        fail("Missing target pages: " + ", ".join(missing))

    publications = load_manifest("publications-manifest.js", "window.ahmadAliPublications")
    books = load_manifest("books-manifest.js", "window.ahmadAliBookDetails")
    posts = load_manifest("posts-manifest.js", "window.windowOfTimePosts")
    updates = load_manifest("updates-manifest.js", "window.ahmadAliUpdates")

    prerender_publications(publications)
    prerender_books(books)
    prerender_home(updates, posts)

    print()
    print(
        "Static prerender complete:",
        len(publications), "publications;",
        len(books), "books;",
        min(15, len(updates)), "homepage updates;",
        min(3, len(posts)), "homepage writings.",
    )
    print("JavaScript enhancement remains unchanged and will replace these nodes at runtime.")


if __name__ == "__main__":
    main()
