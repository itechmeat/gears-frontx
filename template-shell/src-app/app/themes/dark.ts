/**
 * Constructor Dark - the dark colour scheme of the `constructor` brand theme.
 *
 * The counterpart of `light.ts`; read that file's header for why a scheme is
 * modelled as a theme here and why the colours are converted triples rather
 * than `var(--acv-*)` references.
 *
 * The id matters beyond this file: an MFE receives the theme *id* over the
 * bridge and collapses it to a kit colour scheme through its own local set of
 * dark ids (`_blank-mfe/src/shared/acvColorScheme.ts`,
 * `demo-mfe/src/shared/kitThemeScope.ts`), both of which already list `dark`.
 * Renaming this theme would silently leave every MFE rendering light surfaces
 * inside dark chrome.
 */
// @cpt-algo:cpt-frontx-algo-ui-libraries-choice-theme-propagation:p1

import type { ThemeConfig } from '@gears-frontx/react';
import { ACV_METRICS } from './tokens';

/** Theme id of the dark colour scheme. */
export const DARK_THEME_ID = 'dark' as const;

export const darkTheme: ThemeConfig = {
  id: DARK_THEME_ID,
  name: 'Constructor Dark',
  variables: {
    ...ACV_METRICS,

    '--background': '0 0% 9%', // --acv-color-surface-primary #171717
    '--foreground': '0 0% 100%', // --acv-color-glyph-primary #fff
    '--card': '0 0% 9%', // --acv-color-surface-primary
    '--card-foreground': '0 0% 100%', // --acv-color-glyph-primary
    '--popover': '0 0% 12.9%', // --acv-color-surface-secondary #212121
    '--popover-foreground': '0 0% 100%', // --acv-color-glyph-primary
    '--primary': '0 0% 100%', // --acv-color-state-action-primary #fff
    '--primary-foreground': '218.6 68.3% 16.1%', // --acv-color-state-action-inverted #0d2145
    '--secondary': '225 22.6% 24.3%', // --acv-color-state-action-secondary #30374c
    '--secondary-foreground': '0 0% 100%', // --acv-color-glyph-primary
    '--muted': '0 0% 12.9%', // --acv-color-surface-secondary
    '--muted-foreground': '0 0% 73.3%', // --acv-color-glyph-secondary #bbb
    '--accent': '0 0% 17.6%', // --acv-color-surface-tertiary #2d2d2d
    '--accent-foreground': '0 0% 100%', // --acv-color-glyph-primary
    '--destructive': '4.3 100% 69.8%', // --acv-color-status-danger-strong #ff7065
    '--destructive-foreground': '0 0% 9%', // --acv-color-surface-primary
    '--border': '0 0% 29.4%', // --acv-color-border-primary #4b4b4b
    '--input': '0 0% 29.4%', // --acv-color-border-primary
    '--ring': '211.7 70.2% 48.6%', // --acv-color-state-focus-primary #2577d3

    '--error': '4.3 100% 69.8%', // --acv-color-status-danger-strong
    '--warning': '40 100% 42.4%', // --acv-color-status-warning-strong #d89000
    '--success': '160 85.3% 40%', // --acv-color-status-success-strong #0fbd83
    '--info': '223.6 90.4% 71.4%', // --acv-color-status-info-strong #7498f8

    '--chart-1': '6.8 68.7% 54.9%', // --acv-color-state-action-brand #db4f3d
    '--chart-2': '223.6 90.4% 71.4%', // --acv-color-status-info-strong
    '--chart-3': '160 85.3% 40%', // --acv-color-status-success-strong
    '--chart-4': '40 100% 42.4%', // --acv-color-status-warning-strong
    '--chart-5': '0 0% 73.3%', // --acv-color-glyph-secondary
  },
};
