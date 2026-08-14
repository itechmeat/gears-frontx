/**
 * Scheme-independent values shared by the shell's two themes.
 *
 * Everything here is a plain `var(--acv-*)` reference rather than a literal,
 * because nothing in the Tailwind config wraps these variables in a colour
 * function - `borderRadius.md` is `var(--radius-md)`, so `--radius-md:
 * var(--acv-radius-regular)` resolves through both hops. The colour variables
 * cannot do the same: `tailwind.config.ts` spells them `hsl(var(--background))`
 * and `packages/react/src/mfe/ThemeAwareReactLifecycle.tsx` writes the same
 * grammar into every MFE shadow root, so a colour has to arrive as a bare
 * `H S% L%` triple. That is why `light.ts` and `dark.ts` carry converted
 * triples while the metrics below stay references.
 */
// @cpt-algo:cpt-frontx-algo-ui-libraries-choice-theme-propagation:p1

/**
 * Spacing, radius, shadow and transition variables, pointed at the
 * `@constructor/globals` scale.
 *
 * The shadcn variable names are kept because the Tailwind config and the
 * shadcn components under `components/ui/` are written against them; only the
 * values move to the design system.
 */
export const ACV_METRICS: Record<string, string> = {
  // Spacing: the acv scale is 2/4/8/12/16/20/24 px, so the shadcn xs..3xl ramp
  // maps onto it up to `xl` and then continues past the scale's top step.
  '--spacing-xs': 'var(--acv-spacing-x-small)',
  '--spacing-sm': 'var(--acv-spacing-small)',
  '--spacing-md': 'var(--acv-spacing-medium)',
  '--spacing-lg': 'var(--acv-spacing-large)',
  '--spacing-xl': 'var(--acv-spacing-x-large)',
  '--spacing-2xl': 'calc(var(--acv-spacing-x-large) * 2)',
  '--spacing-3xl': 'calc(var(--acv-spacing-x-large) * 3)',

  // Radius: acv ships zero/4/8/12/16/24 and a circle keyword.
  '--radius-none': 'var(--acv-radius-zero)',
  '--radius-sm': 'var(--acv-radius-small)',
  '--radius-md': 'var(--acv-radius-regular)',
  '--radius-lg': 'var(--acv-radius-medium)',
  '--radius-xl': 'var(--acv-radius-large)',
  '--radius-full': '9999px',

  // Shadows: acv exposes one overlay shadow colour rather than a ramp, so the
  // ramp is built from it and only the geometry is authored here.
  '--shadow-sm': '0 1px 2px 0 var(--acv-color-shadows-overlay)',
  '--shadow-md': '0 4px 6px -1px var(--acv-color-shadows-overlay)',
  '--shadow-lg': '0 10px 15px -3px var(--acv-color-shadows-overlay)',
  '--shadow-xl': '0 20px 25px -5px var(--acv-color-shadows-overlay)',

  '--transition-fast': 'var(--acv-transition-duration-shortest)',
  '--transition-base': 'var(--acv-transition-duration-shorter)',
  '--transition-slow': 'var(--acv-transition-duration-short)',
  '--transition-slower': 'var(--acv-transition-duration-standard)',
};
