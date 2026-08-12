// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import { describe, expect, it } from 'vitest';
import { demoteUnlayeredShadowStyles } from './demoteUnlayeredShadowStyles';

/** Build a shadow root carrying the given inline stylesheets, in order. */
function shadowRootWithStyles(...sheets: readonly string[]): ShadowRoot {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  sheets.forEach((css) => {
    const style = document.createElement('style');
    style.textContent = css;
    root.appendChild(style);
  });
  return root;
}

describe('demoteUnlayeredShadowStyles', () => {
  it('wraps an unlayered block in the host layer so layered kit rules can outrank it', () => {
    const root = shadowRootWithStyles('* { margin: 0; padding: 0 }');

    demoteUnlayeredShadowStyles(root);

    expect(root.querySelector('style')?.textContent).toBe(
      '@layer frontx-host {\n* { margin: 0; padding: 0 }\n}'
    );
  });

  it('demotes every block, not only the first', () => {
    const root = shadowRootWithStyles('button { background-color: transparent }', ':host { color: red }');

    demoteUnlayeredShadowStyles(root);

    root.querySelectorAll('style').forEach((style) => {
      expect(style.textContent).toContain('@layer frontx-host {');
    });
  });

  it('leaves an already demoted block alone, so a remount does not nest layers', () => {
    const root = shadowRootWithStyles('* { margin: 0 }');

    demoteUnlayeredShadowStyles(root);
    demoteUnlayeredShadowStyles(root);

    const css = root.querySelector('style')?.textContent ?? '';
    expect(css.match(/@layer frontx-host/g)).toHaveLength(1);
  });

  it('leaves an empty block alone rather than emitting an empty layer', () => {
    const root = shadowRootWithStyles('   ');

    demoteUnlayeredShadowStyles(root);

    expect(root.querySelector('style')?.textContent).toBe('   ');
  });

  /*
   * A non-shadow container had nothing cloned into it, so there is no host block
   * to demote and any style it holds belongs to whoever put it there.
   */
  it('ignores a plain element container', () => {
    const container = document.createElement('div');
    const style = document.createElement('style');
    style.textContent = '* { margin: 0 }';
    container.appendChild(style);

    demoteUnlayeredShadowStyles(container);

    expect(style.textContent).toBe('* { margin: 0 }');
  });
});
