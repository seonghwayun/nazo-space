// Pure helpers (no imports) so they can be unit-tested with `node --test`.
//
// Per-browser layout hints ("was signed in last time", "had an unplayed shelf")
// so loading skeletons match the page that's about to appear. They are mirrored
// onto <html> as data attributes before first paint (see LAYOUT_HINT_SCRIPT),
// and skeletons pick their layout with CSS, so the server-rendered HTML is right too.
// Never load-bearing: a missing hint only means a slightly different skeleton.

export const LAYOUT_HINTS = {
  signedIn: "nazo-signed-in",
  homeShelf: "nazo-home-shelf",
} as const;

export type LayoutHint = (typeof LAYOUT_HINTS)[keyof typeof LAYOUT_HINTS];

/** `nazo-signed-in` → `data-nazo-signed-in` */
export function hintAttribute(hint: LayoutHint): string {
  return `data-${hint}`;
}

/** Store the hint and update <html> right away, so later client navigations use it too. */
export function writeLayoutHint(hint: LayoutHint, value: boolean) {
  try {
    if (value) localStorage.setItem(hint, "1");
    else localStorage.removeItem(hint);
  } catch {
    // Storage blocked: the hint just stays off after reload.
  }
  document.documentElement.toggleAttribute(hintAttribute(hint), value);
}

/** Runs in <head> before paint: copies stored hints onto <html>. */
export const LAYOUT_HINT_SCRIPT = `(function(){try{var r=document.documentElement;${JSON.stringify(
  Object.values(LAYOUT_HINTS)
)}.forEach(function(k){if(localStorage.getItem(k)==="1")r.setAttribute("data-"+k,"")});}catch(e){}})();`;
