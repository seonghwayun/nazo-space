// Shared by the /my lists and their skeletons, so both reflow the same way on wide screens.

/** Poster tiles: 3–4 across on phones, up to 8 on a PC. */
export const POSTER_GRID = "grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";

/** Rows with a small poster: one column on phones, two on a PC (each row keeps its divider). */
export const ROW_LIST =
  "flex flex-col divide-y lg:grid lg:grid-cols-2 lg:gap-x-10 lg:divide-y-0 lg:[&>li]:border-b";
