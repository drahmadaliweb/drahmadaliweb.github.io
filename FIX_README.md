# CMS speed/error + Digital Access patch

This patch fixes two separate issues:

1. **Admin console slow / JSON / Invalid topic errors**
   - The Edge Function now loads the already-generated manifest for admin lists and for save/delete operations instead of downloading and parsing every `.mjs` source file one-by-one.
   - This removes the slow N-file GitHub read loop.
   - It also avoids failures caused by older source files that are valid JavaScript modules but are not strict JSON, and avoids re-validating every legacy record just to open a list.

2. **Book Digital Access**
   - Removes Preview / Read PDF / Audiobook buttons from the top action row.
   - Keeps Publisher / Rokomari / Order Here there.
   - Renames the media panel to **Digital Access / ডিজিটাল অ্যাক্সেস**.
   - Shows Preview and/or Read PDF buttons inside the panel when available.
   - Shows the audiobook player(s) inside the same panel when available.
   - Hides the entire panel when none are available.
   - Lets the panel stay compact instead of stretching to the height of Publication Information.

## Apply

From your Mac website repo root, first sync:

```bash
git pull --rebase origin main
```

Copy this patch folder over the repo, then run:

```bash
python3 apply_book_media_patch.py
```

Then commit and push:

```bash
git add -A
git commit -m "Fix admin loading and digital book access"
git push origin main
```

Finally redeploy the updated Supabase function:

```bash
supabase functions deploy site-admin --no-verify-jwt
```

You do **not** need to recreate admins, tokens, or secrets.
