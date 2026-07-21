# StoryLoom

Read and write short stories (up to 2000 words). Sign in with Google, write, publish, done.
Built with React + Vite, Firebase Auth (Google sign-in), and Firestore — all on free tiers.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Firebase project (free)

1. Go to https://console.firebase.google.com → **Add project** (name it anything, e.g. "storyloom").
2. In the project, go to **Build → Authentication → Get started**, then enable the **Google** sign-in provider.
3. Go to **Build → Firestore Database → Create database**. Start in **production mode**, pick any region.
4. In Firestore, open the **Rules** tab and paste in the contents of `firestore.rules` from this project, then **Publish**.
5. Still in Firestore, open the **Indexes** tab and create a **composite index**:
   - Collection: `stories`
   - Fields: `authorId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

   This is required for the "My stories" page, which filters by `authorId` and sorts by `createdAt` at the same time — Firestore needs an index for that specific combination. (If you skip this, "My stories" will get stuck on "Loading…" and the browser console will show an error with a direct link to create the index — clicking that link also works.)

   Alternatively, deploy it with the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # pick your Firebase project
   firebase deploy --only firestore:indexes
   ```
   This project already includes `firebase.json` (pointing at `firestore.rules` and `firestore.indexes.json`), so once you've run `firebase use --add` once, this command will work as-is.
6. Go to **Project settings** (gear icon) → scroll to **Your apps** → click the **</>** (web) icon to register a web app.
7. Copy the `firebaseConfig` values shown into a new `.env` file in this project (copy `.env.example` to `.env` first and fill it in).
8. Back in **Authentication → Settings → Authorized domains**, make sure `localhost` is listed (it is by default). Later, add your deployed domain here too (e.g. `your-app.vercel.app`).

## 3. Run locally

```bash
npm run dev
```

Visit the printed localhost URL, sign in with Google, and publish a story.

## 4. Deploy for free

Easiest option — **Vercel**:

1. Push this project to a GitHub repo.
2. Go to https://vercel.com → **Add New Project** → import the repo.
3. Framework preset: **Vite**. Add the same environment variables from your `.env` file in Vercel's project settings.
4. Deploy. Then add the resulting `*.vercel.app` domain to Firebase **Authentication → Settings → Authorized domains**.

(Netlify or Firebase Hosting work the same way — both are free for a project this size.)

## How it's built

- `src/firebase.js` — Firebase app + Auth + Firestore setup, reads config from environment variables.
- `src/context/AuthContext.jsx` — tracks the signed-in user everywhere in the app.
- `src/pages/Write.jsx` — the editor. Enforces the 2000-word cap client-side and shows a live word meter; the same cap is also enforced server-side in `firestore.rules` so it can't be bypassed.
- `src/pages/Home.jsx` — public feed of all published stories, newest first.
- `src/pages/StoryDetail.jsx` — full story view.
- `src/pages/MyStories.jsx` — stories published by the signed-in user.
- Firestore has a single `stories` collection: `{ title, content, wordCount, authorId, authorName, createdAt }`.

## Where to go next

Some natural next additions, roughly in order of effort:

1. **Edit / delete your own stories** — add buttons on `MyStories`, call `updateDoc` / `deleteDoc`.
2. **Likes** — a `likes` subcollection or a `likedBy: [uid]` array on each story.
3. **Comments** — a `comments` subcollection under each story.
4. **Drafts** — add a `status: 'draft' | 'published'` field, filter the home feed to `published` only.
5. **Tags / categories** — add a `tags: string[]` field, filter the feed by tag.
6. **Pagination** — Firestore `startAfter()` cursors once you have more than ~20 stories.
7. **Profile pages** — a route like `/author/:uid` listing one author's stories.

## Troubleshooting

### "Could not load your stories... Firestore likely needs an index for this query"

This means the composite index described in step 5 of Setup hasn't been created in your Firebase
project yet. Open the browser console (F12) on the "My stories" page — the real error there
includes a direct link to create the index in one click. See step 5 above for the manual and CLI
options.

### Sign-in works on localhost but fails on my deployed URL

This is almost always one of two things:

1. **Your deployed domain isn't in Firebase's authorized domain list.** Go to Firebase console →
   Authentication → Settings → Authorized domains, and add your domain exactly as it appears in
   the browser (e.g. `letswrite-alpha.vercel.app` — no `https://`, no trailing slash).
2. **The `VITE_FIREBASE_*` environment variables weren't set in your hosting provider before the
   last deploy.** Vite bakes environment variables into the build at build time — if you add them
   in Vercel's project settings *after* your last deploy, you need to trigger a fresh deploy
   (Vercel → Deployments → ⋯ → Redeploy) for them to take effect. Adding the variables alone does
   nothing until the app is rebuilt.

As of this version, the sign-in error message on screen will tell you which of these it is — for
example `auth/unauthorized-domain` means #1, and a missing/invalid API key means #2. Open the
browser console for the full error if the on-screen message isn't specific enough.
