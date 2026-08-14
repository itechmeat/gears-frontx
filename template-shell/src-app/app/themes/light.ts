/**
 * Constructor Light - the light colour scheme of the `constructor` brand theme.
 *
 * The shell no longer ships palettes of its own. `index.html` links
 * `@constructor/globals`' `constructor` theme at document level, and that
 * stylesheet resolves every `--acv-*` token through one of two classes on
 * `<html>` (`acv-color-scheme-light` / `acv-color-scheme-dark`), written there
 * by the kit's `AcvColorScheme` provider - see `app/kit/KitProviders.tsx`.
 * Selecting this theme therefore selects a scheme, which is why the two theme
 * ids are `light` and `dark` rather than product names.
 *
 * What stays here is the bridge to the shadcn/Tailwind grammar the rest of the
 * shell is written in: `tailwind.config.ts` spells its colours
 * `hsl(var(--background))`, and `ThemeAwareReactLifecycle` writes the same
 * grammar into every MFE shadow root. A colour therefore has to arrive as a
 * bare `H S% L%` triple and cannot be a `var(--acv-*)` reference. Each triple
 * below is the exact `@constructor/globals` value for this scheme, converted;
 * the token it mirrors is named beside it, so a palette change in the design
 * system is a mechanical re-conversion rather than a redesign.
 */
// @cpt-algo:cpt-frontx-algo-ui-libraries-choice-theme-propagation:p1

import type { ThemeConfig } from '@gears-frontx/react';
import { ACV_METRICS } from './tokens';

/** Theme id of the light colour scheme. */
export const LIGHT_THEME_ID = 'light' as const;

export const lightTheme: ThemeConfig = {
  id: LIGHT_THEME_ID,
  name: 'Constructor Light',
  // The scheme a fresh load starts in; `dark.ts` carries no `default` flag.
  default: true,
  variables: {
    ...ACV_METRICS,

    '--background': '0 0% 100%', // --acv-color-surface-primary #fff
    '--foreground': '0 0% 6.7%', // --acv-color-glyph-primary #111
    '--card': '0 0% 100%', // --acv-color-surface-primary
    '--card-foreground': '0 0% 6.7%', // --acv-color-glyph-primary
    '--popover': '0 0% 100%', // --acv-color-surface-primary
    '--popover-foreground': '0 0% 6.7%', // --acv-color-glyph-primary
    '--primary': '218.6 68.3% 16.1%', // --acv-color-state-action-primary #0d2145
    '--primary-foreground': '0 0% 100%', // --acv-color-state-action-inverted #fff
    '--secondary': '192 12.2% 92%', // --acv-color-state-action-secondary #e8eced
    '--secondary-foreground': '0 0% 6.7%', // --acv-color-glyph-primary
    '--muted': '240 6.7% 97.1%', // --acv-color-surface-secondary #f7f7f8
    '--muted-foreground': '0 0% 41.6%', // --acv-color-glyph-secondary #6a6a6a
    '--accent': '220 8.6% 93.1%', // --acv-color-surface-tertiary #ecedef
    '--accent-foreground': '0 0% 6.7%', // --acv-color-glyph-primary
    '--destructive': '347.1 92.7% 43.1%', // --acv-color-status-danger-strong #d40834
    '--destructive-foreground': '0 0% 100%', // --acv-color-surface-primary
    '--border': '225 6.2% 87.5%', // --acv-color-border-primary #dddee1
    '--input': '225 6.2% 87.5%', // --acv-color-border-primary
    '--ring': '203 100% 44.5%', // --acv-color-state-focus-primary #008ce3

    '--error': '347.1 92.7% 43.1%', // --acv-color-status-danger-strong
    '--warning': '31.3 100% 35.7%', // --acv-color-status-warning-strong #b65f00
    '--success': '160.2 59.5% 32.9%', // --acv-color-status-success-strong #228665
    '--info': '219.1 66.5% 54.3%', // --acv-color-status-info-strong #3d73d8

    /*
     * Charts get the design system's own accent and status hues rather than a
     * generic ramp, so a series reads as part of the same product. Written as
     * triples for the same reason the colours above are.
     */
    '--chart-1': '6.9 68.5% 49.8%', // --acv-color-state-action-brand #d63c28
    '--chart-2': '219.1 66.5% 54.3%', // --acv-color-status-info-strong
    '--chart-3': '160.2 59.5% 32.9%', // --acv-color-status-success-strong
    '--chart-4': '31.3 100% 35.7%', // --acv-color-status-warning-strong
    '--chart-5': '218.6 68.3% 16.1%', // --acv-color-state-action-primary
  },
};
