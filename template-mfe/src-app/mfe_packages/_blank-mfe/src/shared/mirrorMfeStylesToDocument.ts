/**
 * Makes the MFE's compiled stylesheet reachable from the host document, for the
 * kit components that render outside this MFE's shadow root.
 *
 * `@constructor/react-kit` builds its overlays on Base UI, and every overlay
 * primitive it uses — `Tooltip.Portal`, `Menu.Portal`, `Select.Portal`,
 * `Popover.Portal`, `Dialog.Portal` — is rendered without a `container`
 * override, so React portals the popup into `document.body`. `MfeHandlerMF`
 * injects the MFE's stylesheet into the shadow root and nowhere else, which
 * leaves those popups in a tree the stylesheet does not reach: measured on
 * AcvTooltip, the popup lands under `BODY` carrying `_popup_1e87a_14` and
 * computes `background-color: rgba(0, 0, 0, 0)`, `border-radius: 0px`,
 * `padding: 0px`, `box-shadow: none` — the class is there, the rules are not.
 * The design tokens do resolve there, because `@constructor/globals` is linked
 * at document level; it is only the component CSS that is missing.
 *
 * Mirroring the same URL into `document.head` is safe rather than a leak: every
 * rule in that stylesheet is a hashed CSS-module class, so it can only match
 * elements this MFE rendered. The stylesheet is also already in the browser
 * cache from the shadow-root link, so the mirror costs no second download.
 *
 * The URLs are read off the links the handler injected rather than imported,
 * because the MFE's own build has no way to name its emitted CSS asset; the
 * handler resolves it from `exposeAssets.css` in the Module Federation manifest
 * and appends `link[id^="__frontx-mfe-runtime-style-"]` before calling mount.
 */

/** Prefix `MfeHandlerMF` gives the stylesheet links it injects. */
const RUNTIME_STYLE_ID_PREFIX = '__frontx-mfe-runtime-style-';

/** Marks the mirrors so repeated mounts reuse them instead of stacking copies. */
const MIRROR_ATTRIBUTE = 'data-frontx-mfe-style-mirror';

/**
 * Copy the MFE's runtime stylesheet links into `document.head`.
 *
 * Call from `initializeStyles()`: the handler has appended its links by then,
 * and this is the only hook that runs after them.
 *
 * Deliberately not undone on unmount. A second mount of the same MFE reuses the
 * same URLs, and removing a mirror while another instance is still mounted would
 * unstyle its overlays.
 *
 * @param container - Mount container handed to the lifecycle
 */
export function mirrorMfeStylesToDocument(container: Element | ShadowRoot): void {
  const links = container.querySelectorAll<HTMLLinkElement>(
    `link[id^="${RUNTIME_STYLE_ID_PREFIX}"]`
  );

  links.forEach((link) => {
    const { href } = link;
    if (href.length === 0) {
      return;
    }
    /*
     * Existing mirrors are compared by their resolved `href` property rather than
     * matched with an attribute selector: a URL is not a valid CSS identifier, so
     * a selector would need CSS.escape, which the test environment's DOM does not
     * implement. Comparing the property is also the more exact test — it compares
     * resolved URLs, where the attribute could hold either form.
     */
    const alreadyMirrored = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>(`link[${MIRROR_ATTRIBUTE}]`)
    ).some((mirror) => mirror.href === href);
    if (alreadyMirrored) {
      return;
    }

    const mirror = document.createElement('link');
    mirror.rel = 'stylesheet';
    mirror.href = href;
    mirror.setAttribute(MIRROR_ATTRIBUTE, '');
    document.head.appendChild(mirror);
  });
}
