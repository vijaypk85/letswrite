# Changelog

Notes on recent feature additions, for whoever's picking this codebase back up later.

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
