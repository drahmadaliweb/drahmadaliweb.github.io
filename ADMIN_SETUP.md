# Private Content Manager — one-time setup

The site now includes a private admin UI at `/admin/`. It is not linked from public navigation and is blocked from search-engine crawling, but **security comes from Supabase login + an admin allow-list**, not from the hidden URL.

The admin can add, edit and delete:
- Books (including cover, small PDF, preview/audio links, publisher/Rokomari details)
- Through the Window of Time posts
- Selected Articles
- Publications (research, Arabic, edited works, translations)
- Updates

Publishing writes the source `.mjs` file to GitHub. GitHub Actions rebuild the generated manifests, so the public site updates automatically.

## 1. Reuse the existing Supabase project

Keep the same Supabase project used for Readers' Reviews. In `reviews-config.js`, set only the public values:

```js
window.AHMAD_ALI_REVIEW_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "YOUR_PUBLIC_PUBLISHABLE_KEY"
};
```

Never put a service-role key or GitHub token in this public file.

## 2. Create the two login accounts

In Supabase Dashboard → Authentication → Users, create/invite the accounts that should be allowed to administer the website (for example Dr. Ahmad Ali and you). Do not add a public sign-up form to the website.

## 3. Create the administrator allow-list

Open Supabase → SQL Editor and run `admin-setup.sql`.

Then run this after replacing the two emails:

```sql
insert into public.admin_users(user_id,email)
select id,email
from auth.users
where email in ('FATHER_EMAIL@example.com','YOUR_EMAIL@example.com')
on conflict (user_id) do update set email=excluded.email;
```

Only users present in this table can use the publishing function.

## 4. Create a GitHub fine-grained token

On GitHub create a fine-grained Personal Access Token for the repository `drahmadaliweb.github.io`.
Grant only the minimum repository permission needed:

- **Contents: Read and write**

Do not put this token anywhere in the website files.

## 5. Deploy the protected Supabase Edge Function

The function source is at:

`supabase/functions/site-admin/index.ts`

From your Mac, with the Supabase CLI installed and logged in:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GITHUB_TOKEN='YOUR_GITHUB_TOKEN'
supabase secrets set GITHUB_OWNER='drahmadaliweb'
supabase secrets set GITHUB_REPO='drahmadaliweb.github.io'
supabase secrets set GITHUB_BRANCH='main'
supabase functions deploy site-admin --no-verify-jwt
```

The function validates the Supabase access token itself and then checks `admin_users`. The GitHub token stays server-side as a secret.

## 6. Allow GitHub Actions to update generated manifests

In GitHub repository → Settings → Actions → General → Workflow permissions, choose **Read and write permissions**.

The repository contains rebuild workflows for books, posts, articles, publications and updates.

## 7. Open the private manager

After deploying the website, go directly to:

`https://drahmadaliweb.github.io/admin/`

(or the equivalent `/admin/` URL on Cloudflare/your custom domain).

Log in with one of the authorized Supabase accounts.

## Publishing behavior

- Saving or deleting content commits the source file to GitHub immediately.
- GitHub Actions then regenerate the corresponding manifest. This usually takes a short time.
- The public site may therefore take roughly tens of seconds to reflect a content edit.
- The admin list updates immediately in the current browser session.

## Files and PDFs

Cover images and small PDFs can be uploaded from the Book/Publication forms. The admin interface caps direct uploads at 6 MB to keep browser → Edge Function → GitHub uploads reliable. For larger PDFs, upload them to an appropriate public file host and paste the PDF URL into the form.

## Local Mac clone

Because your father can now publish directly to GitHub, before you make local changes on your Mac run:

```bash
git pull --rebase origin main
```

That keeps your local master folder synchronized with edits made through `/admin/`.
