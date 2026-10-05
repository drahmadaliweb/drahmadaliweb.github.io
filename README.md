# Dr. Ahmad Ali — Academic Website

A bilingual multi-page static academic website for Dr. Ahmad Ali, Professor of Islamic Studies at the University of Chittagong.

## Main pages
- `index.html` — Home
- `about.html` — Profile + research
- `biography.html` — Biography
- `books.html` — Books
- `publications.html` — Research publications
- `window-of-time.html` — **Through the Window of Time** writing archive
- `post.html` — Reusable English full-writing reader
- `service.html` — Service and affiliations
- `contact.html` — Contact
- `bn/` — Bengali versions

`research.html` and `career.html` remain only as compatibility redirects.

## Updating the top announcement ticker
Edit the `siteUpdates` object in `script.js`. After the current site is deployed, announcement-only changes require uploading only `script.js`.

## Updating “Through the Window of Time” / “সময়ের সঙ্গে বাতায়ন”

All writing entries are controlled by **one file only**:

`posts-data.js`

This archive is designed for Facebook posts, original blog-style writings, magazine articles, newspaper columns, and other published pieces.

### To add a new writing
1. Open `posts-data.js`.
2. Copy the template object at the top of the file.
3. Set `date` in `YYYY-MM-DD` format, e.g. `2026-10-05`.
4. Set the source:
   - `facebook`
   - `newspaper`
   - `magazine`
   - `blog`
   - `website`
   - `other`
5. Put the publication/source name in `label` and its original link in `url`. For an original website-only essay, `url` can be empty.
6. Paste the Bengali title and full Bengali body.
7. Paste the English title and English translation.
8. Commit/upload **only `posts-data.js`** to GitHub.

You do **not** have to keep the objects in chronological order. The website automatically sorts them by date, newest first.

The archive automatically creates:
- publication date
- source badge/icon (including the Facebook logo for Facebook posts)
- a short preview from the beginning of the article
- **View Full / পুরোটি পড়ুন**
- an original-source link when supplied
- an individual full-reading page in both English and Bengali

### Formatting inside `body`
Paste normal text. The reader formats it automatically:
- `1.`, `2.`, etc. and Bengali `১.`, `২.` become section headings.
- Lines beginning with `#` become highlighted points.
- `*** *** ***` or `<<< >>>` becomes a divider.
- Blank lines create paragraph spacing.

### Date note for the first sample
The first existing entry currently uses `2026-10-05` as its date. If the original Facebook post was published on another date, change only that `date` value in `posts-data.js`.
