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
5. Go to **Project settings** (gear icon) → scroll to **Your apps** → click the **</>** (web) icon to register a web app.
6. Copy the `firebaseConfig` values shown into a new `.env` file in this project (copy `.env.example` to `.env` first and fill it in).
7. Back in **Authentication → Settings → Authorized domains**, make sure `localhost` is listed (it is by default). Later, add your deployed domain here too (e.g. `your-app.vercel.app`).

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
