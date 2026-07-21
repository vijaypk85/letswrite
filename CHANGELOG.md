# Changelog

Notes on recent feature additions, for whoever's picking this codebase back up later.

## General / global enhancements

**Files touched:** `src/context/ToastContext.jsx` (new), `src/components/ToastContainer.jsx` (new),
`src/components/SkeletonCard.jsx` (new), `src/hooks/usePageTitle.js` (new), `src/pages/NotFound.jsx`
(new), `public/favicon.svg` (new), `index.html`, `src/main.jsx`, `src/App.jsx`, and a small edit to
every page component.

- **Loading skeleton cards** — `Home.jsx` and `MyStories.jsx` now show a few pulsing placeholder
  cards (`SkeletonCard.jsx`) instead of a plain "Loading…" line while stories are being fetched.
  Other pages (`StoryDetail.jsx`, `EditStory.jsx`) still use the plain loading text — they only ever
  load one item, so a skeleton adds less value there.
- **404 page** — a catch-all route (`path="*"`) now renders `NotFound.jsx` for any URL that doesn't
  match, instead of a blank page.
- **Favicon + per-page browser tab titles** — added `public/favicon.svg` (a simple open-book mark)
  and linked it in `index.html`. Every page now calls a new `usePageTitle(title)` hook to set the
  browser tab title (e.g. "Write · StoryLoom", "My stories · StoryLoom") instead of every page
  showing the same generic title. The Story detail page sets its title dynamically once the story
  loads, so the tab shows the actual story title.
- **Toast notifications** — a lightweight `ToastProvider`/`useToast()` context (no new dependency)
  now shows a small dismissible message in the bottom-right corner for: publishing a story, editing
  a story, deleting a story, deleting a comment, and submitting a report. Toasts auto-dismiss after
  3 seconds or on click. Likes and sign-in errors intentionally still use their existing inline UI
  rather than a toast, since those need to stay visible longer or are tied to a specific button.

No Firestore rules or index changes were needed for this batch — all client-side.

## Navbar / Footer enhancements

**Files touched:** `src/components/Navbar.jsx`, `src/components/Footer.jsx` (no functional change, listed for completeness), `src/index.css`

- **Active page highlighting** — switched from plain `Link` to react-router's `NavLink` in the
  navbar. The current page's link gets an underline (color + small bar) via the `active` class
  `NavLink` applies automatically. The "Write"/"Sign in" buttons are excluded from this styling
  (they're meant to look like buttons, not nav links) via a `:not(.btn)` selector.
- **Dark mode toggle** — a sun/moon button in the navbar. Implemented by setting a
  `data-theme="dark"` attribute on `<html>` and defining a `:root[data-theme='dark'] { ... }`
  override block in `index.css` with dark versions of every existing CSS variable (`--bg`,
  `--surface`, `--text`, etc). Because every component already styles itself using those variables,
  nothing else needed to change — the whole site (including the Footer) picks up the dark theme
  automatically. The choice is saved to `localStorage` (key: `storyloom-theme`) so it's remembered
  across visits — `localStorage` rather than `sessionStorage` here on purpose, since a theme
  preference is the kind of thing you'd want to persist, unlike the Write page's draft.
- **Mobile hamburger menu** — below 640px width, the nav links collapse behind a hamburger button
  and drop down as a small panel when tapped. Closes automatically on route change (there's a
  `useEffect` watching `location.pathname`). Above 640px, nothing changes — the navbar looks and
  behaves exactly as before.

No Firestore rules or index changes were needed for this batch — this was all client-side UI.

## My Stories page enhancements

**Files touched:** `src/pages/MyStories.jsx`, `src/index.css`

- **Stats bar** — shows total stories published and total likes across all of them, at the top of
  the page. Always reflects *everything* you've published, regardless of the search box or sort
  option below it.
- **Search box** — filters your own stories by title.
- **Sort options (Newest / Oldest / Most liked)** — unlike the Home feed's version of this, this one
  is reliable across *all* of your stories, not just a loaded page of them — `MyStories.jsx` has
  always fetched every story you've published in one query (nobody has thousands of stories), so
  there's no pagination limitation to work around here.
- **Empty state CTA** — "Write your first story" button when you haven't published anything yet,
  matching the same treatment already on the Home feed.

No Firestore rules or index changes were needed for this batch (it reuses the existing
`authorId + createdAt` composite index).

## Write page enhancements

**Files touched:** `src/pages/Write.jsx`, `src/pages/StoryDetail.jsx`, `src/utils/formatStory.jsx` (new), `src/index.css`

- **Draft auto-save** — title and content are saved to `sessionStorage` (key: `storyloom-write-draft`)
  on every change, and restored automatically if you reload the page mid-write. It's cleared as soon
  as a story is successfully published. Session-only by design: `sessionStorage` clears when the tab
  closes, so nothing lingers in the browser long-term. (This is a real deployed app, not a Claude
  Artifact, so `sessionStorage` is fine here — it's just not usable inside Claude.ai's in-chat
  Artifacts preview, if that ever comes up.)
- **Unsaved-changes warning** — a native browser confirmation appears if you try to close the tab,
  refresh, or navigate to a typed URL while there's unsaved text. **Limitation:** this uses the
  browser's `beforeunload` event, which only fires for actually leaving the page — it does **not**
  catch clicking another in-app link (e.g. the navbar). Catching in-app navigation too would need
  react-router's `useBlocker`, which requires switching from `<BrowserRouter>` to a data router
  (`createBrowserRouter`) — a bigger structural change than fits under "simple," so it's not done here.
- **Bold / Italic toolbar** — two buttons above the editor wrap the selected text in `**bold**` or
  `*italic*` markers (or insert placeholder "text" if nothing's selected). This is intentionally
  *not* full markdown — just enough for basic emphasis. The same rendering is now shared between the
  Write page's Preview and the published Story detail page, via the new `renderFormattedText()`
  helper in `src/utils/formatStory.jsx`, so a story looks the same in both places.
  **Known gap:** story card excerpts on the Home feed and "My stories" still show the raw
  `**`/`*` characters rather than rendering them, since those are short plain-text previews — low
  priority to fix, but worth knowing about.
- **Character count** — sits next to the word count in the ink meter label (e.g. `240 / 2000 words ·
  1,340 characters`).
- **Preview toggle** — swaps the title input + textarea for a read-only render of how the story will
  look once published (same styling as the Story detail page). Word/character counts and the Publish
  button stay visible and usable in both modes.

No Firestore rules or index changes were needed for this batch.

**Also worth knowing:** `src/pages/EditStory.jsx` (editing an already-published story) was *not*
updated with any of the above — no draft auto-save, no toolbar, no preview, no character count.
It's a near-identical layout to `Write.jsx`, so the same changes would drop in easily if wanted later.

## Story detail page enhancements

**Files touched:** `src/pages/StoryDetail.jsx`, `src/components/CommentSection.jsx`, `firestore.rules`, `src/index.css`

- **Share button** — copies the current story URL to the clipboard via `navigator.clipboard.writeText`.
  Falls back to a `window.prompt` if the Clipboard API isn't available (e.g. some older/embedded
  browsers). No backend involved.
- **More from this author** — queries `stories` where `authorId == story.authorId`, ordered by
  `createdAt desc`, limited to 5, then filters out the current story client-side and shows up to 4.
  Reuses the existing `authorId + createdAt` composite index (see `firestore.indexes.json`) — no new
  index needed.
- **Previous / Next story navigation** — "Previous" = the next-newer story, "Next" = the next-older
  story, matching the order stories appear in on the home feed. Implemented as two small queries
  filtering on `createdAt` (`>` for newer, `<` for older) ordered by that same field. This does
  **not** need a composite index, since the `where` and `orderBy` are on the same field
  (`createdAt`) — only cross-field combinations (like the author query above) need one.
- **Delete your own comment** — `CommentSection.jsx` now shows a "Delete" link next to any comment
  where `comment.authorId === currentUser.uid`. No rules change was needed here — the original
  rules already let a comment's author delete it.
- **Report button** — writes a document to a new top-level `reports` collection:
  `{ storyId, storyTitle, reporterId, createdAt }`. This is **write-only from the app** — the
  Firestore rules (see below) block read/update/delete from the client entirely, so reports can
  only be reviewed by opening the Firestore console directly. There's no in-app moderation UI yet;
  that would be a reasonable next addition if reports start coming in.

**Firestore rules change:** added a `match /reports/{reportId}` block — `allow create` if signed in
and `reporterId` matches the caller, `allow read/update/delete: if false` for everyone. If you're
running against an existing Firebase project, re-publish `firestore.rules` after pulling this in,
or the Report button will fail silently with a permissions error.

## Home / story feed enhancements

**Files touched:** `src/pages/Home.jsx`, `src/components/StoryCard.jsx`, `src/index.css`

- **Search box** — filters by story title. Client-side only, and only across whichever stories are
  already loaded on the page (the first 20, or more once "Load more" has been clicked) — not a
  full-database search. A proper full-text search would need a dedicated search index (e.g.
  Algolia) — out of scope for now.
- **Sort toggle (Newest / Most liked)** — also client-side, same "only what's loaded" caveat as
  search. True server-side "most liked across everything" sorting would need Firestore to `orderBy`
  a like *count*, which means storing a `likeCount` number field on each story (kept in sync
  whenever `likedBy` changes) instead of just the `likedBy` array — a schema change, not done here.
- **Likes badge on story cards** — `StoryCard.jsx` now shows `(story.likedBy || []).length` likes
  in the card meta row, not just on the detail page.
- **"Editor's pick" badge** — renders if `story.featured === true`. There's no UI to set this flag;
  toggle it manually on a story's document in the Firestore console. A real "feature this story"
  admin action would be the natural follow-up.
- **Empty state CTA** — when there are zero stories at all, the empty state now includes a
  "Write the first story" button linking to `/write`.

No Firestore rules or index changes were needed for this batch — everything here filters/sorts
data that was already being fetched.
