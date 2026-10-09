# Private Content Manager — one-time setup

The site includes a private admin UI at `/admin/`. Security comes from Supabase login + the `admin_users` allow-list.

The admin can add, edit and delete Books, Through the Window of Time posts, Selected Articles, Publications and Updates.

## Important architecture change

**Save & Publish now updates the source `.mjs` file and its generated manifest in the same GitHub commit.**

There is no longer a second GitHub Action required to rebuild `books-manifest.js`, `posts-manifest.js`, `selected-articles-manifest.js`, `publications-manifest.js` or `updates-manifest.js`.

The five old rebuild workflows included in `.github/workflows/` are intentionally disabled (manual-only legacy placeholders). GitHub Pages still deploys the site normally after the content commit.

## 1. Supabase public configuration

In `reviews-config.js`:

```js
window.AHMAD_ALI_REVIEW_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "YOUR_PUBLIC_PUBLISHABLE_KEY"
};
```

Never put a service-role key or GitHub token in this public file.

## 2. Admin login accounts

Supabase Dashboard → Authentication → Users. Create/invite the accounts that should administer the website.

## 3. Administrator allow-list

Run `admin-setup.sql` in Supabase SQL Editor, then add your approved users:

```sql
insert into public.admin_users(user_id,email)
select id,email
from auth.users
where email in ('FATHER_EMAIL@example.com','YOUR_EMAIL@example.com')
on conflict (user_id) do update set email=excluded.email;
```

## 4. GitHub token

Create a fine-grained Personal Access Token restricted to `drahmadaliweb.github.io` with:

- **Contents: Read and write**

No Actions write permission is required for content publishing anymore.

## 5. Deploy/redeploy the Supabase Edge Function

From the website folder on your Mac:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GITHUB_TOKEN='YOUR_GITHUB_TOKEN'
supabase secrets set GITHUB_OWNER='drahmadaliweb'
supabase secrets set GITHUB_REPO='drahmadaliweb.github.io'
supabase secrets set GITHUB_BRANCH='main'
supabase functions deploy site-admin --no-verify-jwt
```

**If you already set up the admin earlier, you still must run the final `supabase functions deploy ...` command after installing this version**, because the Edge Function contains the new direct-manifest publisher.

## 6. Test

Open `https://drahmadaliweb.github.io/admin/`, log in, add a small test Update/Post, and click Save & Publish.

The resulting GitHub commit should contain both the source record and its manifest. Example for a post:

- `posts/<id>.mjs`
- `posts-manifest.js`

The admin list is refreshed directly from the source `.mjs` files in GitHub, so it can see a source record even if an older manifest was stale. Saving that record (or any record in the same section) regenerates the manifest directly in the publishing commit.

## Local Mac clone

Because the admin writes directly to GitHub, always run this before making local changes:

```bash
git pull --rebase origin main
```
