# Reader Reviews — one-time setup

The website now contains the complete bilingual review interface. Because GitHub Pages is static, persistent public reviews need a small database. The included implementation uses Supabase and keeps reviewer email addresses private.

## Setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste the contents of `reviews/supabase-setup.sql`, and run it once.
3. In Supabase project settings, copy the **Project URL** and the **publishable key**. Do **not** use the secret/service-role key.
4. Open `reviews-config.js` and fill in:

```js
window.AHMAD_ALI_REVIEW_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  publishableKey: "YOUR-PUBLIC-PUBLISHABLE-KEY"
};
```

5. Upload/push the site as usual.

## Moderation

New reviews are intentionally stored with `approved = false`. This prevents spam or abusive material from appearing automatically on an academic website. To publish a review, open **Table Editor → book_reviews** in Supabase and change `approved` to `true`. Approved reviews appear automatically on the corresponding book page, newest first.

Reviewer email addresses are stored only for administrative/contact purposes and are never returned by the public review-reading function.

If you later decide that reviews should publish immediately without moderation, the SQL function can be changed, but moderation is strongly recommended.
