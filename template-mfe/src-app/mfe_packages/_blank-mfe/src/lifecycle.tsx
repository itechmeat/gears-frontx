import React from 'react';
import type { ChildMfeBridge } from '@gears-frontx/react';
import { ThemeAwareReactLifecycle } from '@gears-frontx/react';
import { mfeApp } from './init';
import { demoteUnlayeredShadowStyles } from './shared/demoteUnlayeredShadowStyles';
import { mirrorMfeStylesToDocument } from './shared/mirrorMfeStylesToDocument';
import { KitProviders } from './shared/KitProviders';
import { HomeScreen } from './screens/home/HomeScreen';

class BlankMfeLifecycle extends ThemeAwareReactLifecycle {
  constructor() {
    // ThemeAwareReactLifecycle consumes the host handoff and passes the
    // shared server-state runtime into FrontXProvider for this mounted root.
    super(mfeApp);
  }

  /**
   * Reconciles the FrontX shadow-root style pipeline with
   * `@constructor/react-kit`'s stylesheets. Two bridges, each documented at its
   * own definition, and both needed for a kit component to render fully styled:
   *
   * 1. {@link demoteUnlayeredShadowStyles} moves the unlayered blocks the base
   *    class put in the shadow root into a cascade layer, so the kit's
   *    `@layer ui` rules can win the ordinary specificity contest instead of
   *    losing to them unconditionally;
   * 2. {@link mirrorMfeStylesToDocument} copies this MFE's compiled stylesheet
   *    into `document.head`, where the kit's portalled overlays live.
   *
   * The kit's design TOKENS are not installed here and must not be: they arrive
   * from `@constructor/globals`, linked by the host document's `index.html` at
   * document level, and inherit through the shadow boundary as custom properties.
   * Injecting a second copy on `:host` would shadow the host's and freeze this
   * MFE on whichever scheme was current when it mounted.
   *
   * @param container - Mount container handed to the lifecycle
   */
  protected override initializeStyles(container: Element | ShadowRoot): void {
    demoteUnlayeredShadowStyles(container);
    mirrorMfeStylesToDocument(container);
  }

  protected renderContent(bridge: ChildMfeBridge): React.ReactNode {
    /*
     * Every screen renders inside KitProviders, so a screen added to this package
     * can import kit components and nothing else. See shared/KitProviders.tsx for
     * why the context is mandatory rather than convenient.
     */
    return (
      <KitProviders bridge={bridge}>
        <HomeScreen bridge={bridge} />
      </KitProviders>
    );
  }
}

/**
 * Export a singleton instance of the lifecycle class.
 * Module Federation expects a default export; the handler calls
 * moduleFactory() which returns this module, then validates it
 * has mount/unmount methods.
 */
export default new BlankMfeLifecycle();
