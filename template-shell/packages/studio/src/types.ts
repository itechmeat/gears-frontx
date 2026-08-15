// @cpt-dod:cpt-frontx-dod-studio-devtools-panel-overlay:p1
// @cpt-dod:cpt-frontx-dod-studio-devtools-persistence:p1
// @cpt-dod:cpt-frontx-dod-studio-devtools-viewport-clamping:p1
/**
 * Where Studio sits, as the gap it leaves to the viewport's bottom-right
 * corner - not as a left/top coordinate.
 *
 * The distinction is the whole fix for a widget that used to end up mid-screen.
 * A left/top pair is only correct for the viewport it was computed in: it was
 * derived once from `window.innerWidth/innerHeight`, then persisted, and the
 * resize handler only ever clamped it back *inside* a shrinking viewport. Grow
 * the viewport - maximise the window, close devtools, rotate a tablet - and the
 * widget stayed at its old coordinate while the corner moved away from it,
 * which is how a control anchored to the bottom-right ends up floating in the
 * middle of the screen.
 *
 * Measured from the corner instead, the anchor is viewport-independent: the
 * same pair means the same visual place at every size, the browser maintains it
 * with no JavaScript, and resizing cannot stranded it. Clamping survives only to
 * keep the widget reachable when the viewport is smaller than it is.
 */
export interface Anchor {
  /** Gap from the viewport's inline-end edge, in px. */
  right: number;
  /** Gap from the viewport's block-end edge, in px. */
  bottom: number;
}

/**
 * Gap Studio keeps from the viewport edges it is anchored to.
 */
export const STUDIO_VIEWPORT_MARGIN = 16;

/**
 * Size dimensions for the Studio panel
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Studio panel state
 */
export interface StudioState {
  collapsed: boolean;
  position: Anchor;
  size: Size;
}

/**
 * Constants for panel constraints
 */
export const PANEL_CONSTRAINTS = {
  MIN_WIDTH: 320,
  MIN_HEIGHT: 400,
  MAX_WIDTH: 600,
  MAX_HEIGHT: 800,
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 500,
} as const;

/**
 * Collapsed button size (circular)
 */
export const BUTTON_SIZE = {
  width: 48,
  height: 48,
} as const;

/**
 * LocalStorage key prefix for Studio
 */
export const STORAGE_PREFIX = 'frontx:studio:' as const;

/**
 * LocalStorage keys (composable with shared prefix)
 */
export const STORAGE_KEYS = {
  POSITION: `${STORAGE_PREFIX}position`,
  SIZE: `${STORAGE_PREFIX}size`,
  COLLAPSED: `${STORAGE_PREFIX}collapsed`,
  BUTTON_POSITION: `${STORAGE_PREFIX}buttonPosition`,
  THEME: `${STORAGE_PREFIX}theme`,
  LANGUAGE: `${STORAGE_PREFIX}language`,
  MOCK_ENABLED: `${STORAGE_PREFIX}mockEnabled`,
} as const;
