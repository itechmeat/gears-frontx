/**
 * Bridge between the host's theme identifier and the light/dark colour scheme
 * `@constructor/react-kit` understands.
 *
 * Every screen in this package renders under the same providers, so this mapping
 * is applied once in {@link ./KitProviders} rather than per screen; it lives here
 * because the set below is the thing a project edits when it registers a theme.
 */

import type { AcvColorSchemeValue } from '@constructor/react-kit/color-scheme';

/**
 * Host theme identifiers whose palette is dark.
 *
 * Written down rather than derived, because there is nothing to derive it
 * from: `ThemeConfig` (@gears-frontx/framework) carries `id`, `name`,
 * `variables` and `default` and no light/dark flag, and the bridge hands a
 * screen the identifier alone — not the theme definition, and not the registry
 * that holds it. The set therefore has to gain an entry whenever the host
 * registers another dark theme, or that theme's screens paint dark host chrome
 * around a light kit surface.
 */
const DARK_HOST_THEMES: ReadonlySet<string> = new Set(['dark', 'dracula', 'dracula-large']);

/**
 * Map a host theme identifier onto a `@constructor/react-kit` colour scheme.
 *
 * The kit resolves its tokens through one of two classes on
 * `document.documentElement` — `acv-color-scheme-light` or
 * `acv-color-scheme-dark`, written there by `AcvColorScheme` — so a host palette
 * is matched to whichever of the two it is closer to. See
 * {@link DARK_HOST_THEMES} for why the dark side is an enumeration.
 *
 * An unrecognised identifier resolves to the light scheme rather than to none at
 * all: with neither class present the kit falls back to `prefers-color-scheme`,
 * which is how a screen ends up dark inside a light shell on a developer machine
 * set to dark mode.
 *
 * Two schemes is the whole resolution this bridge can offer. A host theme is a
 * full palette, not a light/dark bit — `dracula` maps to the kit's dark scheme
 * and then renders in the kit's greys rather than Dracula's purples. Closing
 * that gap means unifying the two token grammars, a decision above this
 * template.
 *
 * @param hostTheme - Value of the host's shared theme property
 */
export function acvColorSchemeFor(hostTheme: string): AcvColorSchemeValue {
  return DARK_HOST_THEMES.has(hostTheme) ? 'dark' : 'light';
}
