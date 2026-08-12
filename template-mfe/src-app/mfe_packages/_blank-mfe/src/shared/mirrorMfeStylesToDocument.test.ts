// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { afterEach, describe, expect, it } from 'vitest';
import { mirrorMfeStylesToDocument } from './mirrorMfeStylesToDocument';

/** Selector for the mirrors this module creates. */
const MIRRORS = 'link[data-frontx-mfe-style-mirror]';

/**
 * Build a shadow root carrying the stylesheet links `MfeHandlerMF` would have
 * injected, plus anything else passed as a foreign link.
 */
function shadowRootWithLinks(options: {
  readonly runtime?: readonly string[];
  readonly foreign?: readonly string[];
}): ShadowRoot {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  (options.runtime ?? []).forEach((href, index) => {
    const link = document.createElement('link');
    link.id = `__frontx-mfe-runtime-style-${index}`;
    link.rel = 'stylesheet';
    link.href = href;
    root.appendChild(link);
  });
  (options.foreign ?? []).forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    root.appendChild(link);
  });
  return root;
}

afterEach(() => {
  document.head.querySelectorAll(MIRRORS).forEach((mirror) => mirror.remove());
});

describe('mirrorMfeStylesToDocument', () => {
  it('mirrors the runtime stylesheet into the document head, where portalled overlays live', () => {
    const root = shadowRootWithLinks({ runtime: ['https://mfe.test/assets/blank.css'] });

    mirrorMfeStylesToDocument(root);

    const mirrors = document.head.querySelectorAll<HTMLLinkElement>(MIRRORS);
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0]?.href).toBe('https://mfe.test/assets/blank.css');
    expect(mirrors[0]?.rel).toBe('stylesheet');
  });

  /*
   * A second mount of the same MFE hands over the same URLs. Stacking copies
   * would grow the head on every navigation back to the screen.
   */
  it('reuses an existing mirror instead of stacking copies across mounts', () => {
    const first = shadowRootWithLinks({ runtime: ['https://mfe.test/assets/blank.css'] });
    const second = shadowRootWithLinks({ runtime: ['https://mfe.test/assets/blank.css'] });

    mirrorMfeStylesToDocument(first);
    mirrorMfeStylesToDocument(second);

    expect(document.head.querySelectorAll(MIRRORS)).toHaveLength(1);
  });

  it('mirrors each distinct stylesheet', () => {
    const root = shadowRootWithLinks({
      runtime: ['https://mfe.test/assets/a.css', 'https://mfe.test/assets/b.css'],
    });

    mirrorMfeStylesToDocument(root);

    expect(document.head.querySelectorAll(MIRRORS)).toHaveLength(2);
  });

  /*
   * Only the handler's own links are the MFE's compiled stylesheet. Anything else
   * in the shadow root was put there by someone whose scoping decision this
   * function must not undo.
   */
  it('ignores links the handler did not inject', () => {
    const root = shadowRootWithLinks({ foreign: ['https://cdn.test/other.css'] });

    mirrorMfeStylesToDocument(root);

    expect(document.head.querySelectorAll(MIRRORS)).toHaveLength(0);
  });

  it('does nothing for a container holding no runtime stylesheet', () => {
    mirrorMfeStylesToDocument(document.createElement('div'));

    expect(document.head.querySelectorAll(MIRRORS)).toHaveLength(0);
  });
});
