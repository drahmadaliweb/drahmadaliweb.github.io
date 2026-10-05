# Dr. Ahmad Ali — Academic Website

A multi-page static academic website for Dr. Ahmad Ali, Professor of Islamic Studies at the University of Chittagong.

## Pages
- `index.html` — Home
- `about.html` — Concise academic profile and education
- `biography.html` — Full chronological biography
- `research.html` — Compatibility redirect to the research section within Profile
- `books.html` — Books and bibliographic archive
- `publications.html` — Research publications
- `career.html` — Compatibility redirect to the academic-career section within Biography
- `service.html` — Editorial and institutional service
- `contact.html` — Contact information

The biography incorporates family-verified biographical details and the supplied academic CV. Rokomari links on the Books page are treated as a partial retail catalog rather than a complete bibliography.


## Bilingual English / Bengali
The website now includes a full Bengali version under `bn/`. Every main page has an EN / বাংলা switch in the top-right navigation. The language switch keeps the visitor on the corresponding page in the selected language.

## Latest updates bar
The slim top bar beside the EN/বাংলা toggle rotates through recent updates every ~5.5 seconds and pauses on hover/focus. To change the announcements, edit the `siteUpdates` object near the bottom of `script.js`. Each item has `text` and `href`; `href` can point to an internal page or any full external URL.

## Updating “Through the Window of Time” / “সময়ের সঙ্গে বাতায়ন”

The latest Facebook post is controlled by **one file only**:

`latest-facebook-post.js`

You do not need to edit the English or Bengali HTML pages when changing the post.

For each new post:

1. Open `latest-facebook-post.js`.
2. Replace `facebookUrl` with the new Facebook post URL.
3. Replace `bn.title` and `bn.body` with the Bengali original.
4. Replace `en.title` and `en.body` with the English translation.
5. Commit/upload only `latest-facebook-post.js` to GitHub.

The English page (`window-of-time.html`) and Bengali page (`bn/window-of-time.html`) will update automatically from that file.

### Plain-text formatting

You can paste ordinary text into each `body` field. The page formats it automatically:
- `1.`, `2.`, etc. (and Bengali digits such as `১.`, `২.`) become section headings.
- A line beginning with `#` becomes a highlighted question/item.
- `*** *** ***` or `<<< >>>` becomes a divider.
- Blank lines create paragraph spacing.
