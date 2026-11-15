# Admin Forms as Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin nazo/creator/tag create and edit popups with full pages, and let the nazo form create missing creators and tags inline.

**Architecture:** Each form becomes a client component (`NazoForm`, `CreatorForm`, `TagForm`) that renders inside a shared `FormPageShell`. The shell has a fixed top bar with `취소 | title | 저장` (the review page pattern) and shows an inline error. Each form owns its saving and error state and calls an `onSubmit(payload)` prop that throws on failure. Thin route pages handle the admin guard, data loading and navigation after save. The pure logic (route matching, the "offer create?" check, create-by-name API calls) lives in dependency-free `lib/` files tested with `node --test`.

**Tech Stack:** Next.js 16 App Router, React 19, next-auth, Tailwind. Tests run on Node 24's built-in test runner with native TS type stripping, so no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-15-admin-forms-as-pages-design.md`

## Global Constraints
- Routes: `/admin/nazo/new`, `/nazo/[id]/edit`, `/admin/creator/new`, `/creator/[id]/edit`, `/admin/tag/new`.
- Top bar copy: left `취소`, right `저장` (`저장 중...` while saving).
  - Titles: `나조 추가`, `나조 수정`, `제작자 추가`, `제작자 수정`, `태그 추가`.
- Inline create label: `'<query>' 새로 만들기`.
- Header and bottom nav are hidden on all five routes and on the existing `/nazo/[id]/review`.
- Login, share and image-zoom popups are untouched. Form fields, APIs and validation are unchanged, except that the forms gain inline create and inline errors.
- Pure helpers in `lib/` that are tested with `node --test` must not import `@/` aliases or packages.
- No new npm dependencies.

## Review Focus
1. **Inline create with a case or whitespace variant.** Typing `riddle ` when `Riddle` exists must not offer create. The exact match is trimmed and case-insensitive. Test in Task 1.
2. **Tag that already exists (409).** Inline create attaches the existing tag instead of failing. Test in Task 1.
3. **Opening an edit URL directly (no history).** `취소` must go to the fallback page instead of leaving the site. `goBackOr` is tested in Task 1.
4. **Double-tapping `저장`.** The second tap must not submit twice. The shell disables `저장` while `isSaving`. Manual check in Task 6.
5. **Upload or save failure.** Input is kept and the error is shown under the top bar. Manual check in Task 6.

---

### Task 1: Pure helpers + test runner

**Files:**
- Create: `lib/form-routes.ts`, `lib/form-routes.test.ts`
- Create: `lib/inline-create.ts`, `lib/inline-create.test.ts`
- Modify: `package.json` (add a `test` script)

**Interfaces:**
- Produces:
  - `isFullScreenFormRoute(pathname: string | null): boolean`
  - `goBackOr(router: { back(): void; replace(href: string): void }, fallback: string, historyLength?: number): void`
    - `historyLength` defaults to `window.history.length`.
    - If it is `> 1`, call `back()`. Otherwise call `replace(fallback)`.
  - `type NamedEntity = { _id: string; name: string }`
  - `shouldOfferCreate(query: string, results: { name: string }[]): boolean`
  - `createCreatorByName(name: string, fetchImpl?: typeof fetch): Promise<NamedEntity>`
    - POSTs `/api/creator` with `{ name }` and throws on non-OK.
  - `createTagByName(name: string, fetchImpl?: typeof fetch): Promise<NamedEntity>`
    - POSTs `/api/tag` with `{ name }`.
    - On 409, GETs `/api/tag?q=<encoded name>` and returns the result whose name matches exactly (trimmed, case-insensitive).
    - Throws if there is no match or on any other non-OK response.
  - The functions in `lib/inline-create.ts` trim `name` before sending.

- [ ] **Step 1: Write failing tests**

`lib/form-routes.test.ts` (`import { test } from "node:test"; import assert from "node:assert/strict"; import { … } from "./form-routes.ts";`):
- `isFullScreenFormRoute` is true for `/nazo/abc/review`, `/nazo/abc/edit`, `/creator/abc/edit`, `/admin/nazo/new`, `/admin/creator/new`, `/admin/tag/new`.
- It is false for `/`, `/admin`, `/nazo/abc`, `/creator/abc`, `/search` and `null`.
- `goBackOr`:
  - with `historyLength` 3, it calls `back` once and `replace` zero times;
  - with `historyLength` 1, it calls `replace("/admin")` once and `back` zero times.

`lib/inline-create.test.ts`:
- `shouldOfferCreate`:
  - `("", [])` → false
  - `("  ", [])` → false
  - `("New", [])` → true
  - `("riddle ", [{ name: "Riddle" }])` → false
  - `("Ridd", [{ name: "Riddle" }])` → true
- `createTagByName`, with a fake fetch:
  - Returns 201 `{ _id: "t1", name: "Puzzle" }` → resolves to `{ _id: "t1", name: "Puzzle" }`.
  - Returns 409, then a GET body `{ results: [{ _id: "t0", name: "Puzzle Hunt" }, { _id: "t2", name: "puzzle" }] }`, called with `" Puzzle "` → resolves to `{ _id: "t2", name: "puzzle" }`. Also assert the POST body was `{"name":"Puzzle"}`.
  - Returns 500 → rejects.
- `createCreatorByName`:
  - 201 → resolves to the returned entity.
  - 401 → rejects.

- [ ] **Step 2: Run tests to verify they fail**

Add the `package.json` script `"test": "node --test \"lib/**/*.test.ts\""`.
Run: `pnpm test`. Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `lib/form-routes.ts` and `lib/inline-create.ts`** with the signatures above.
  - Route match is a regex over path segments: `^/nazo/[^/]+/(review|edit)$`, `^/creator/[^/]+/edit$`, `^/admin/(nazo|creator|tag)/new$`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`. Expected: all pass, 0 fail.

- [ ] **Step 5: Commit**: `feat: add form route and inline-create helpers with tests`

---

### Task 2: Page shell, admin guard, hide chrome on form routes

**Files:**
- Create: `components/layout/form-page-shell.tsx`
- Create: `hooks/use-admin-guard.ts`
- Modify: `components/layout/header.tsx:15` (return null when `isFullScreenFormRoute(pathname)`, in addition to the existing checks)
- Modify: `components/layout/bottom-nav.tsx:38` (replace `pathname?.endsWith("/review")` with `isFullScreenFormRoute(pathname)`)

**Interfaces:**
- Consumes: `isFullScreenFormRoute` (Task 1)
- Produces:
  - `FormPageShell(props: { title: string; formId: string; onCancel: () => void; isSaving: boolean; error?: string | null; children: React.ReactNode })`
    - Fixed `h-14` top bar with the same classes as `app/nazo/[id]/review/page.tsx` (`취소` ghost button left, bold title center, `저장` ghost `text-primary` button right).
    - `저장` is `type="submit" form={formId}`, disabled while `isSaving`, and labelled `저장 중...` while saving.
    - Below the bar, a `h-14` spacer and a red error box when `error` is set.
    - Content uses `max-w-2xl mx-auto p-4 md:p-8`.
  - `useAdminGuard(): "loading" | "admin" | "denied"`
    - Uses `useSession`. When `denied`, it calls `router.replace("/")`.

- [ ] **Step 1: Implement the shell, the hook, and the header/bottom-nav changes**
- [ ] **Step 2: Verify**: `npx tsc --noEmit` passes, and `npx eslint components/layout hooks/use-admin-guard.ts` reports no errors in the new files.
- [ ] **Step 3: Commit**: `feat: add form page shell and admin guard; hide chrome on form routes`

---

### Task 3: Nazo form as pages (create + edit) with inline create

**Files:**
- Create: `components/admin/nazo-form.tsx` (fields and search logic moved from `components/admin/nazo-form-modal.tsx`)
- Create: `app/admin/nazo/new/page.tsx`
- Create: `app/nazo/[id]/edit/page.tsx`
- Modify: `app/nazo/[id]/client-page.tsx`
  - The pencil button (around line 322) becomes `router.push(\`/nazo/${id}/edit\`)`.
  - Remove `isEditModalOpen`, `handleUpdateNazo` and the `NazoFormModal` render (around lines 59, 194-210 and 568-578), plus its import.
- Delete: `components/admin/nazo-form-modal.tsx`

**Interfaces:**
- Consumes:
  - `FormPageShell`, `useAdminGuard` (Task 2)
  - `shouldOfferCreate`, `createCreatorByName`, `createTagByName`, `NamedEntity`, `goBackOr` (Task 1)
  - `uploadImage` from `lib/upload-image.ts`
- Produces:
  - `type NazoPayload = { originalTitle: string; translatedTitle: string; description: string; imageUrl: string; difficulty: string; estimatedTime: string; creators: string[]; tags: string[] }`
  - `NazoForm(props: { title: string; initialData?: any; onSubmit: (payload: NazoPayload) => Promise<void>; onCancel: () => void })`
    - `initialData` has the same shape as today: populated `creators` and `tags`.
    - Owns `isSaving` and `error`. On submit it uploads the file if one was chosen, then awaits `onSubmit`.
    - If `onSubmit` throws, it sets `error` to the thrown message (fallback `저장에 실패했습니다.`) and keeps all input.

- [ ] **Step 1: Build `NazoForm`**
  - Move the modal's fields, the creator/tag search effects and the chips into `<form id="nazo-form">` inside `FormPageShell`.
  - In the creator and tag dropdowns, when `shouldOfferCreate(query, results)` is true and the search isn't loading, append a row labelled `'<query.trim()>' 새로 만들기`.
    - Clicking it calls `createCreatorByName` or `createTagByName` and then the existing `handleAddCreator` or `handleAddTag`.
    - On failure, set `error`.
- [ ] **Step 2: Build `app/admin/nazo/new/page.tsx`** (client)
  - Uses `useAdminGuard`. Show a spinner while loading, render nothing when denied.
  - `onSubmit` POSTs `/api/nazo` and throws `나조 추가에 실패했습니다.` on non-OK.
  - On success it calls `router.replace(\`/nazo/${created._id}\`)`.
  - `onCancel`: `goBackOr(router, "/admin")`.
- [ ] **Step 3: Build `app/nazo/[id]/edit/page.tsx`** (client)
  - Uses the guard, then fetches `/api/nazo/${id}` for `initialData` (`나조를 찾을 수 없습니다.` if missing).
  - `onSubmit` PUTs `/api/nazo/${id}` and throws `나조 수정에 실패했습니다.` on non-OK.
  - On success: `router.refresh()`, then `goBackOr(router, \`/nazo/${id}\`)`.
  - `onCancel`: `goBackOr(router, \`/nazo/${id}\`)`.
- [ ] **Step 4: Rewire the detail page and delete `nazo-form-modal.tsx`**
- [ ] **Step 5: Verify**
  - `npx tsc --noEmit` passes.
  - `grep -rn "NazoFormModal\|nazo-form-modal" app components` prints nothing.
  - `pnpm test` still passes.
- [ ] **Step 6: Commit**: `feat: nazo create/edit as pages with inline creator/tag create`

---

### Task 4: Creator form as pages

**Files:**
- Create: `components/admin/creator-form.tsx`
- Create: `app/admin/creator/new/page.tsx`
- Create: `app/creator/[id]/edit/page.tsx` (server component) + `app/creator/[id]/edit/client.tsx`
- Modify: `components/creator/creator-edit-button.tsx`
  - It becomes an admin-only `Link` to `/creator/${creator._id}/edit` with the same icon button styling.
  - Drop the modal and `handleUpdate`.
- Delete: `components/admin/creator-form-modal.tsx`

**Interfaces:**
- Consumes: `FormPageShell`, `useAdminGuard`, `goBackOr`
- Produces:
  - `CreatorForm(props: { title: string; initialData?: { name: string; url: string }; onSubmit: (data: { name: string; url: string }) => Promise<void>; onCancel: () => void })`
    - Fields: `Name` (required) and `Profile URL`.
    - Error and saving handling are the same as `NazoForm`.

- [ ] **Step 1: Build `CreatorForm`** (`<form id="creator-form">` in `FormPageShell`)
- [ ] **Step 2: Build `/admin/creator/new`** (client, guarded)
  - POST `/api/creator`. Throw `제작자 추가에 실패했습니다.` on non-OK.
  - On success: `goBackOr(router, "/admin")`.
- [ ] **Step 3: Build `/creator/[id]/edit`**
  - The server page loads the creator with `connectToDatabase()` + `Creator.findById(id).lean()`, calls `notFound()` if missing, and passes `{ id, name, url }` as plain strings to the client.
  - The client is guarded. It PUTs `/api/creator/${id}` and throws `제작자 수정에 실패했습니다.` on non-OK.
  - On success: `router.refresh()`, then `goBackOr(router, \`/creator/${id}\`)`.
- [ ] **Step 4: Swap `CreatorEditButton` to a link and delete `creator-form-modal.tsx`**
- [ ] **Step 5: Verify**
  - `npx tsc --noEmit` passes.
  - `grep -rn "CreatorFormModal" app components` prints nothing.
- [ ] **Step 6: Commit**: `feat: creator create/edit as pages`

---

### Task 5: Tag form page + admin dashboard links

**Files:**
- Create: `components/admin/tag-form.tsx`
- Create: `app/admin/tag/new/page.tsx`
- Modify: `app/admin/page.tsx`
  - The three buttons become `Button asChild` + `Link` to `/admin/nazo/new`, `/admin/creator/new` and `/admin/tag/new`.
  - Remove the modal state, the `handleCreate*` functions, the modal renders and their imports.
- Delete: `components/admin/tag-form-modal.tsx`

**Interfaces:**
- Consumes: `FormPageShell`, `useAdminGuard`, `goBackOr`
- Produces: `TagForm(props: { title: string; onSubmit: (data: { name: string }) => Promise<void>; onCancel: () => void })`
  - Uses plain `useState`, without react-hook-form.
  - Its one field is `Tag Name`, which is required.

- [ ] **Step 1: Build `TagForm` and `/admin/tag/new`**
  - POST `/api/tag`.
  - On non-OK, throw the API's `error` field if present, otherwise `태그 추가에 실패했습니다.`.
  - On success: `goBackOr(router, "/admin")`.
- [ ] **Step 2: Update the admin dashboard and delete `tag-form-modal.tsx`**
- [ ] **Step 3: Verify**
  - `npx tsc --noEmit` passes.
  - `grep -rn "FormModal" app components` prints nothing.
- [ ] **Step 4: Commit**: `feat: tag create page; admin dashboard links to form pages`

---

### Task 6: Full verification

- [ ] **Step 1:** `pnpm test`. Expected: all pass.
- [ ] **Step 2:** `npx tsc --noEmit`, then `npx eslint` on every created or modified file.
  - Expected: no new errors. The `any` errors already in `lib/auth.ts` are known and excluded.
- [ ] **Step 3:** `pnpm build`. Expected: build succeeds, and the route list includes all five new routes.
- [ ] **Step 4:** Run `pnpm dev` and `curl -s -o /dev/null -w "%{http_code}"` each new route. Expected: `200` each.
  - Use an existing nazo id and creator id from the DB for the edit routes.
- [ ] **Step 5:** Manual checks for the user, listed in the hand-off since they need an admin login:
  - Review Focus 4 (double-tap `저장`) and 5 (upload or save failure keeps input).
  - Inline creating a creator and a tag.
  - Opening an edit URL directly, then pressing `취소`.
