// @cpt-dod:cpt-frontx-dod-ui-libraries-choice-theme-propagation:p1
// @cpt-algo:cpt-frontx-algo-ui-libraries-choice-theme-propagation:p1
/**
 * The shell's theme set: the `constructor` brand theme in its two colour
 * schemes.
 *
 * The brand theme itself is not registered here - it is linked as a stylesheet
 * by `index.html` and owns every `--acv-*` token. What a `ThemeConfig`
 * contributes is the scheme choice plus the shadcn/Tailwind variable bridge;
 * see `light.ts` for why the bridge exists.
 */

import type { ThemeConfig } from '@gears-frontx/react';
import { lightTheme, LIGHT_THEME_ID } from './light';
import { darkTheme, DARK_THEME_ID } from './dark';

export { LIGHT_THEME_ID, DARK_THEME_ID };

/** Theme applied on a fresh load. */
export const DEFAULT_THEME_ID = LIGHT_THEME_ID;

/**
 * Every theme the shell registers, in the order the Studio theme dropdown
 * shows them. `main.tsx` registers from this array, so the two lists cannot
 * drift apart.
 */
export const frontxThemes: ThemeConfig[] = [lightTheme, darkTheme];

/**
 * Colour scheme a theme id selects.
 *
 * `ThemeConfig` carries no light/dark field, so the mapping has to be written
 * down. Here it is one comparison rather than the enumerated sets the MFEs
 * keep, because the shell's own two ids *are* the scheme names - a project
 * that adds a third theme adds a case here and in the MFE sets alike.
 *
 * An unknown id resolves to light rather than to nothing: with neither class
 * on `<html>` the design system falls back to `prefers-color-scheme`, which is
 * how a light shell ends up painting dark surfaces on a machine set to dark
 * mode.
 *
 * @param themeId - Id of the applied theme
 */
export function colorSchemeFor(themeId: string | undefined): 'light' | 'dark' {
  return themeId === DARK_THEME_ID ? 'dark' : 'light';
}
