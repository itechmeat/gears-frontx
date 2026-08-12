/**
 * Cascade-layer bridge between the FrontX shadow-root style pipeline and
 * `@constructor/react-kit`.
 *
 * The kit ships every component stylesheet wrapped in `@layer ui { ... }`, which
 * is how a design system lets an application override it without a specificity
 * war. Cascade layers are absolute, though: a declaration in ANY layer loses to
 * an unlayered declaration at ANY specificity. `ThemeAwareReactLifecycle` puts
 * unlayered CSS into every MFE shadow root before the MFE renders, from two
 * places:
 *
 *   1. `adoptHostStylesIntoShadowRoot()` clones the host document's stylesheets,
 *      which for the standard shell means the whole compiled Tailwind output
 *      including its preflight (`button { background-color: transparent }`, the
 *      input resets, ...);
 *   2. `injectBaseResets()` adds `* { margin: 0; padding: 0 }` and
 *      `*, *::before, *::after { border-width: 0; border-color: currentColor }`.
 *
 * Both therefore beat `@layer ui`. Measured before this bridge: AcvButton
 * computed `background-color: rgba(0, 0, 0, 0)` and `padding: 0px` while still
 * picking up `border-radius: 8px` and `height: 32px` from rules the resets
 * happen not to touch. Half-styled, which reads as a rendering glitch rather
 * than as the cascade problem it is.
 *
 * Two element kinds carry that CSS, and they need opposite treatment. Which kind
 * the host's own stylesheet arrives as depends on the BUILD, not on the code:
 * Vite's dev server serves it as an inline `<style>`, and `vite build` emits a
 * `<link>` to a hashed asset. A bridge that handles only one of them works in
 * exactly one of the two modes - which is how this was originally shipped, and
 * why the production build is what caught it.
 *
 * - An inline `<style>` is rewritten in place, wrapped in a named layer. That
 *   restores the ordinary contest: specificity decides, and `._button_...` (0,1,0)
 *   beats `*` (0,0,0).
 * - A cloned `<link>` cannot be rewritten, so an unlayered one is dropped
 *   instead. Nothing is lost that this screen wants: it uses none of the shell's
 *   utilities (see HomeScreen.module.css), and the design tokens it does need
 *   arrive by custom-property inheritance from the host document's `:root`, not
 *   from these clones. Layered clones are KEPT, and that distinction matters:
 *   `@constructor/globals`' `base.css` is where the kit's icon sizing lives, and
 *   dropping it collapses every icon in every kit component to 0x0.
 *
 * The base class documents the opposite decision for the adopted block - it
 * rejects layering it, because a layered host utility class would stop
 * overriding an MFE element selector. That reasoning holds for a Tailwind-styled
 * MFE and does not apply here.
 *
 * The MFE's own compiled stylesheet is left alone in both branches: it is
 * injected as a link by `MfeHandlerMF`, it carries the kit's `@layer ui` rules,
 * and it is the thing that has to win.
 */

/** Layer the demoted host styles are moved into. */
const HOST_STYLE_LAYER = 'frontx-host';

/** Prefix `MfeHandlerMF` gives the stylesheet links it injects. */
const RUNTIME_STYLE_ID_PREFIX = '__frontx-mfe-runtime-style-';

/**
 * Whether a stylesheet declares anything outside a cascade layer.
 *
 * Asked of the HOST document's copy rather than of the clone, on purpose: the
 * host's copy has finished loading by the time an MFE mounts, so `cssRules` is
 * readable, whereas a freshly cloned `<link>` usually has a null `sheet` and
 * would report "no unlayered rules" for every stylesheet in the document.
 *
 * A top-level rule that is not an at-rule is what can outrank `@layer ui`;
 * `@media` and `@supports` blocks are ignored rather than descended into, which
 * keeps a media-wrapped reset out of scope. No such reset exists in the shell's
 * output today, and the cost of guessing wrong here is a dropped stylesheet.
 *
 * @param href - Absolute URL of the cloned stylesheet
 */
function hostStylesheetIsUnlayered(href: string): boolean {
  const sheet = Array.from(document.styleSheets).find((candidate) => candidate.href === href);
  if (!sheet) {
    return false;
  }
  try {
    return Array.from(sheet.cssRules).some((rule) => !rule.cssText.trimStart().startsWith('@'));
  } catch {
    /* Cross-origin sheet: unreadable, so it cannot be judged and is left alone. */
    return false;
  }
}

/**
 * Keep everything the host put in an MFE's shadow root from outranking the kit's
 * layered rules.
 *
 * Call from `initializeStyles()`, which the base class invokes after both
 * unlayered sources are in place and after `MfeHandlerMF` has injected the MFE's
 * own stylesheet link.
 *
 * @param container - Mount container handed to the lifecycle; a non-shadow
 *   container is left untouched, since nothing was cloned into it
 */
export function demoteUnlayeredShadowStyles(container: Element | ShadowRoot): void {
  if (!(container instanceof ShadowRoot)) {
    return;
  }

  container.querySelectorAll('style').forEach((element) => {
    const css = element.textContent ?? '';
    if (css.trim().length === 0 || css.startsWith(`@layer ${HOST_STYLE_LAYER}`)) {
      return;
    }
    element.textContent = `@layer ${HOST_STYLE_LAYER} {\n${css}\n}`;
  });

  container.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]').forEach((link) => {
    if (link.id.startsWith(RUNTIME_STYLE_ID_PREFIX)) {
      return;
    }
    if (hostStylesheetIsUnlayered(link.href)) {
      link.remove();
    }
  });
}
