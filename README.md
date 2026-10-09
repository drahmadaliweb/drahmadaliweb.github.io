# Dr. Ahmad Ali — Academic Website

A bilingual multi-page static academic website for Dr. Ahmad Ali, Professor of Islamic Studies at the University of Chittagong.

## Main pages
- `index.html` — Home + Recent Updates
- `about.html` — Profile + research + academic service
- `biography.html` — Biography
- `books.html` — Books
- `publications.html` — Research publications
- `window-of-time.html` — **Through the Window of Time** writing archive
- `post.html` — Reusable English full-writing reader
- `contact.html` — Contact
- `updates.html` — All Updates archive (intentionally not shown in the top navigation)
- `bn/` — Bengali versions

`research.html`, `career.html`, and `service.html` remain only as compatibility redirects. Academic Service now lives inside `about.html#service`.

# Updating site Updates

Updates now use **one file per update** in the `updates/` folder. Do not edit the banner manually.

```text
updates/
  _template.mjs
  2026-10-05-research-islamization.mjs
  2026-10-05-modern-thought-books.mjs
  2026-10-05-zubdatul-bayan.mjs
```

## Add a new update
1. Open `updates/_template.mjs` in GitHub.
2. Copy its contents.
3. Choose **Add file → Create new file**.
4. Name it `YYYY-MM-DD-short-title.mjs`.
5. Fill in `date`, `href`, English title/summary, and Bengali title/summary.
6. Commit the new file.

Example:

```js
export default {
  date: '2026-10-20',
  href: 'publications.html',
  en: {
    title: 'New research article published',
    summary: 'Optional short explanation.'
  },
  bn: {
    title: 'নতুন গবেষণা প্রবন্ধ প্রকাশিত',
    summary: 'ঐচ্ছিক সংক্ষিপ্ত বিবরণ।'
  }
};
```

The `date` is the date the update is posted on the website. The GitHub Action automatically rebuilds `updates-manifest.js`.

### Automatic behavior
- Home page shows the **15 newest updates** by date.
- If there are more than 15 updates, **View More / আরও দেখুন** automatically appears and opens `updates.html` / `bn/updates.html`.
- The top banner uses only updates from the **current calendar month OR the last 15 days**, selected from those newest 15 items.
- The banner shows a **maximum of 5 updates**.
- Banner items run continuously from right to left with ten visible spaces between them.
- Changing pages keeps the banner on a shared timeline rather than restarting from the first item.
- `updates.html` is intentionally absent from the top navigation.

**Do not edit `updates-manifest.js` manually.** It is generated from `updates/`.

If GitHub Actions cannot push the generated file, enable:
**Settings → Actions → General → Workflow permissions → Read and write permissions**.

Manual rebuild fallback:
```bash
node scripts/build-updates-index.mjs
```

# Updating “Through the Window of Time” / “সময়ের সঙ্গে সংলাপ”

The writings archive uses **one file per writing** in `posts/`.

```text
posts/
  _template.mjs
  2026-10-05-hiba-to-children.mjs
```

## Add a new writing
1. Open `posts/_template.mjs`.
2. Copy it into a new file named `YYYY-MM-DD-short-title.mjs`.
3. Fill in the date, source type/label/link, Bengali title/body, and English title/body.
4. Commit.

The GitHub Action rebuilds `posts-manifest.js`. The site automatically sorts writings newest first, generates previews, creates **View Full / পুরোটি পড়ুন**, and preserves the original-source link.

**Do not edit `posts-manifest.js` manually.**

Manual rebuild fallback:
```bash
node scripts/build-post-index.mjs
```

## Compact modern design pass
The site-wide typography and spacing were tightened for a denser editorial/academic look. The change is centralized in `styles.css`, so it applies to English and Bengali pages, the homepage, profile, biography, books, publications, writings archive, full article reader, updates archive, and contact page.

## Dense editorial homepage
The homepage is intentionally publication-first and compact: a short hero, Recent Updates, the latest items from **Through the Window of Time**, then Featured Books and Featured Publications. Academic profile/research/service details live on the Profile page.

# Book library, series and detailed book pages

The Books page is now **source-neutral**. Rokomari is not treated as the catalog; it is only one optional availability/source link attached to a book. Books documented from available bibliographic sources and books that also happen to be available through Rokomari appear together in one catalog. Forthcoming books remain separate.

Every catalog item uses **one file per book** in `books/` and therefore has an internal detail page. Five books currently have richer descriptions and publication metadata; the remaining records can be expanded later without redesigning the catalog.

```text
books/
  _template.mjs
  usulul-iman-vol-1.mjs
  zubdatul-bayan-vol-1.mjs
  adhunik-chintadhara-vol-1.mjs
  tulonamulok-fiqh-vol-1.mjs
  islami-banking-sharia-compliance.mjs
  ...one file per additional book
```

On the Books page, hovering/focusing a book reveals **View Details / বিস্তারিত দেখুন** over the cover. There are no Rokomari/action links underneath the cover. Any Rokomari, publisher, preview, PDF, audiobook, or other source links belong on the book's detail page.

To add or expand a book, copy `books/_template.mjs`, fill in the available metadata, and commit it. GitHub Actions rebuilds `books-manifest.js` automatically.

The Books page also groups the major series: **Bid‘ah**, **Usul al-Iman**, and **Zubdat al-Bayan**.

Manual rebuild fallback:

```bash
node scripts/build-book-index.mjs
```

## Adding cover art, a PDF, preview or audiobook

Each book file supports:

```js
media: {
  cover: null,
  preview: null,
  pdf: null,
  audio: []
}
```

You can use either local website files or external URLs.

Example with files stored in the repository:

```text
media/books/usulul-iman-vol-1/
  cover.jpg
  preview.pdf
  full-book.pdf
  01-introduction.mp3
  02-chapter-one.mp3
```

Then edit the corresponding book file:

```js
media: {
  cover: 'media/books/usulul-iman-vol-1/cover.jpg',
  preview: 'media/books/usulul-iman-vol-1/preview.pdf',
  pdf: 'media/books/usulul-iman-vol-1/full-book.pdf',
  audio: [
    {
      title: 'Introduction',
      titleBn: 'ভূমিকা',
      url: 'media/books/usulul-iman-vol-1/01-introduction.mp3'
    }
  ]
}
```

External availability links can also be added to the book record. `rokomariUrl` remains supported, and additional links can use a `links` array. The site hides buttons for resources that are not supplied. For large audio files, prefer a suitable external media host instead of committing very large files to GitHub.

Only upload/distribute PDFs or audio for which Dr. Ahmad Ali/publisher has permission to publish online.

# Site-wide search

A compact **Search / খুঁজুন** control appears in the top utility bar. `search.html` / `bn/search.html` searches across:

- detailed books and the wider Books catalog,
- research publications,
- Through the Window of Time writings,
- Updates,
- Profile/Biography and the main archive pages.

No separate search index needs normal manual maintenance.

# Writing archive filters

`Through the Window of Time / সময়ের সঙ্গে সংলাপ` automatically creates filters from the source types actually present in `/posts`:

- Facebook
- Newspaper
- Magazine
- Blog
- Website essays
- Other

For an original article published only on this website, use:

```js
source: {
  type: 'website',
  label: 'Dr. Ahmad Ali Website',
  url: ''
}
```


## Contact / book-order form

The shared bilingual contact form is implemented on `contact.html` and `bn/contact.html`. Book-detail **Order Here / অর্ডার করুন** buttons deep-link to the same form with the selected book prefilled.

Form submissions are sent from GitHub Pages through FormSubmit to `drahmadiscu@gmail.com`. On the **first live submission**, FormSubmit sends a one-time activation/confirmation email to that inbox. Confirm it once; subsequent submissions are delivered automatically. The form includes required-field validation, a honeypot field, dynamic subject-specific guidance, and an in-page success/error message.


## Book cover integration

User-supplied cover photographs are stored under `media/books/<book-id>/cover.jpg` and referenced from each book's `.mjs` record. The public package includes only the selected primary cover for each book, not duplicate/reference working images. As of this package, 36 book records have supplied cover images, including the newly added `salatut-tarabih` record.


## Reader reviews (2026-10-07)

Book detail pages now include a bilingual, collapsible reader-review form and a dated review archive. Reviews are sorted newest first. Persistent storage is implemented through Supabase RPC functions; see `READER_REVIEWS_SETUP.md` and `reviews/supabase-setup.sql` for the one-time setup. New submissions are moderated by default and reviewer email addresses are never displayed publicly.

Book-cover placeholders now use the same 2:3 frame as photographed covers on both the catalog and detail pages.


## Selected Articles / প্রবন্ধ সংকলন
Selected Articles now uses one file per article under `/articles/`, parallel to `/posts/`. Each record contains a topic plus full Bengali/English body fields. Run `node scripts/build-article-index.mjs` after adding or editing an article. The eight earlier bibliography-only entries were migrated, but their full article texts were not available in the supplied project; their body fields are intentionally blank until authentic text is provided.


## Fixed topic taxonomy for articles and writings

Selected Articles and Through the Window of Time now use a single `topic_slug`. The bilingual labels are defined once in `topic-taxonomy.mjs` / `topic-taxonomy.js`. New content must choose one of those 15 slugs; Bengali and English labels are resolved automatically. This is the same list that a future content-admin dropdown should use.

## Forthcoming books

The Books page has a separate `Forthcoming Books / প্রকাশের পথে` grid. Forthcoming records live in `/books/` with `status: "forthcoming"` and do not appear in the published catalog.

## Private content manager
A protected content manager is available at `/admin/` after one-time Supabase/GitHub setup. It can add, edit, and delete books, posts, selected articles, publications, and updates without editing code. See `ADMIN_SETUP.md`.
