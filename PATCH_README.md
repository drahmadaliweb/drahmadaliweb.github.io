# Direct-manifest CMS patch

Apply this patch to the **current local clone after pulling the newest remote changes**. Do not replace the whole repository with an older website ZIP.

This patch changes the private CMS so that:

1. The source `.mjs` record remains the source of truth.
2. The admin Edge Function reads current source records directly from GitHub.
3. Save & Publish writes the source record **and the matching manifest in the same Git commit**.
4. Delete removes the source record **and updates the matching manifest in the same Git commit**.
5. The admin list refreshes from GitHub source records, not from a potentially cached/stale deployed manifest.
6. The old rebuild workflows are disabled so they no longer create a second follow-up commit.
7. GitHub Pages still deploys normally after the single publishing commit.

## Apply on Mac

From your local repository, first synchronize the admin-created changes:

```bash
git pull --rebase origin main
```

Then copy this patch folder over the repository root, preserving its directory structure. `rsync -av` is convenient because it also includes the hidden `.github` folder.

Then:

```bash
git add -A
git commit -m "Make admin publishing update manifests directly"
git push origin main
```

## Mandatory: redeploy the Supabase Edge Function

The GitHub files alone are not enough. Deploy the new backend code:

```bash
supabase functions deploy site-admin --no-verify-jwt
```

You do not need to recreate users, tokens, secrets, or the `admin_users` table if they are already configured.

## Existing orphan post

Because the updated admin reads source `.mjs` files directly from GitHub, the previously saved post that was missing from `posts-manifest.js` should now appear in the admin list after this function is deployed. Open that post and click **Save & Publish** once. That will regenerate `posts-manifest.js` in the same commit and make the post visible on the public site after GitHub Pages deploys.
