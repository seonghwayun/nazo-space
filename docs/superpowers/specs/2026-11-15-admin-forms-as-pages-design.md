# Admin forms as pages (instead of popups)

**Size:** small change (short design)

## Intent
Admin create/edit forms open as popups, which feel cramped and awkward, especially on mobile.
Turn them into full pages that match the existing review page (`/nazo/[id]/review`).

Goals:
- Every admin create/edit form is a real page with its own URL. Back navigation works and the URL can be opened in a new tab.
- Creating a creator or tag that doesn't exist yet doesn't mean leaving the nazo form and losing input.

Non-goals:
- Login, share, and image-zoom popups stay as they are. They're quick, one-tap interactions.
- No changes to fields, validation, or APIs beyond what the pages need.
- No visual redesign of the form fields themselves.

Anti-goals:
- Losing typed input because of a navigation step the user didn't intend.

## Approaches
| | Approach | Trade-off |
|---|---|---|
| **A (picked)** | Dedicated routes with a shared form component | A few more files. Real URLs, natural back navigation, full-screen on mobile. |
| B | Full-screen sheet (bigger modal) | Fewest changes, but no URL, back button leaves the page and loses input, still feels like a popup. |
| C | Intercepting routes (modal on soft nav, page on hard nav) | Keeps the popup feel, which is what the user dislikes. Rejected. |

The user picked A.

## Design
**Routes**
| Route | Replaces |
|---|---|
| `/admin/nazo/new` | `NazoFormModal` on `/admin` (create) |
| `/nazo/[id]/edit` | `NazoFormModal` on the nazo detail page (edit) |
| `/admin/creator/new` | `CreatorFormModal` on `/admin` |
| `/creator/[id]/edit` | `CreatorFormModal` in `CreatorEditButton` |
| `/admin/tag/new` | `TagFormModal` on `/admin` |

**Page shell:** same pattern as the review page. A fixed top bar with `취소 | <title> | 저장`, the form in the page body, and the bottom nav hidden on these routes.
- Cancel goes back with `router.back()`, or falls back to a sensible page when there's no history.
- Admin-only routes redirect non-admins, the same way `/admin` does today.

**Shared form components:** the field markup and state move out of the modals into `NazoForm`, `CreatorForm` and `TagForm`. The same component serves both create and edit. Once nothing uses the modal wrappers, they're deleted.

**After save**
- Nazo create or edit → `/nazo/[id]`
- Creator create → `/admin`
- Creator edit → `/creator/[id]`
- Tag create → `/admin`

**Inline create in the nazo form:** when a creator or tag search has no exact name match, the dropdown shows "'<query>' 새로 만들기".
- Tapping it calls the existing `POST /api/creator` with `{ name }` or `POST /api/tag` with `{ name }`, and attaches the result to the form.
- If the tag API answers `409` (the tag already exists), the existing tag is looked up and attached instead.

**Errors:** a failed save shows an inline error message under the top bar and keeps the input. Today the failure is silent.

**Admin dashboard:** the three buttons become links to the new routes.

## Builder's calls
- Exact layout and spacing (follow the review page)
- How a creator's URL is added after an inline create (via the creator edit page)
- Whether to warn about unsaved changes on cancel (nice-to-have, not required)
