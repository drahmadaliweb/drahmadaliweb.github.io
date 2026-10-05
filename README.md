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

# Updating “Through the Window of Time” / “সময়ের সঙ্গে বাতায়ন”

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
