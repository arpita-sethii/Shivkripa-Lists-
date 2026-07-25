# Shivkripa Parts Catalog — deploy with a real database

This version saves to a small cloud database (Turso) through a Vercel
serverless function at `/api/kv`, instead of only the browser's
localStorage. Any device/browser that opens the site with the same
access code will see the same lists.

## 1. Create a free Turso database

Install the CLI once, then create a database:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create shivkripa-catalog
turso db show shivkripa-catalog --url
turso db tokens create shivkripa-catalog
```

Save the two values you get:
- the `libsql://...` URL from `db show`
- the token from `db tokens create`

(No CLI installed? You can also do all of this from https://turso.tech
in the browser after signing up — same two values either way.)

## 2. Push this folder to GitHub

Replace the contents of your existing repo with everything in this
folder (`index.html`, `api/kv.js`, `package.json`), commit, and push.

## 3. Deploy on Vercel

1. vercel.com → **Add New → Project** → import the repo
2. Framework preset: **Other** (no build command needed)
3. Before deploying, open **Environment Variables** and add:
   - `TURSO_DATABASE_URL` = the `libsql://...` URL from step 1
   - `TURSO_AUTH_TOKEN` = the token from step 1
   - `APP_SECRET` = any password you make up (e.g. `shivkripa2026`) —
     this is the "access code" the app will ask for once per browser
4. Deploy

## 4. First open

Visit your `*.vercel.app` URL on any device. The first time, it'll ask
for the access code — enter whatever you set as `APP_SECRET`. After
that it's remembered on that browser, and every list you create/edit
syncs through the database, so the same lists show up on your phone,
laptop, anywhere.

## Notes

- If `APP_SECRET` is left unset, the API allows any request — fine for
  testing, but set it before sharing the URL.
- The app still writes to localStorage as a local cache, so it keeps
  working (read-only, from the last sync) if the network drops.
- To change the access code later, update `APP_SECRET` in Vercel and
  redeploy — existing browsers will get a 401 once and can be told the
  new code (clear `localStorage` key `sai-app-secret` or just use a
  fresh browser/incognito to get prompted again).
