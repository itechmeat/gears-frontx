// Load-bearing: usePortalContainer and useResolvedPortalContainer call
// useContext, so every component that calls them renders on the client.
// Coupled to CLIENT_COMPONENTS in scripts/verify-consumer.sh - keep both in
// sync if this ever changes.
'use client';

import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react';

/**
 * The portal target every kit overlay accepts: the `container` prop type of
 * Base UI's portal, shared here as one alias so the provider, the overlays
 * and consumer code that bridges them all name the same union. Read off one
 * primitive's Portal (every kit portal forwards the same prop); the
 * type-only import keeps this module from linking the Dialog chunk.
 */
export type PortalContainer = DialogPrimitive.Portal.Props['container'];

/*
 * The default portal target for every kit overlay below the provider.
 * Defaults to undefined: without a provider, each overlay falls through to
 * Base UI's own default, the document body.
 */
const PortalContainerContext = createContext<PortalContainer>(undefined);

/*
 * True inside a kit popup's portal. useResolvedPortalContainer reads it to
 * hand a nested overlay to Base UI's own parent-portal fallback (step two
 * of the resolution order documented on that hook) instead of answering the
 * provider's container, which would pull the nested overlay out of the
 * popup that opened it. Only the overlays whose Base UI portal gives Base
 * UI a parent portal node arm it - Dialog, AlertDialog, Sheet, Drawer,
 * Popover, Select, Combobox and the menus. The NavigationMenu wraps its
 * viewport in PortalScope, but no consumer content renders under it, so it
 * arms nothing for consumer overlays (see useResolvedPortalContainer).
 * Tooltip, HoverCard and Toast portal through FloatingPortalLite, which
 * provides no PortalContext, so arming it there would answer undefined with
 * no portal node to fall back to and send the nested overlay to <body>:
 * they neither arm nor reset the scope, and an overlay nested in one of
 * them follows whatever encloses that Tooltip, HoverCard or Toast.
 * PortalContainerProvider arms the context to false around its children,
 * so a provider placed inside a popup - nearer than that popup - wins
 * again for the overlays below it, menu content excepted: an inherited
 * menu container outranks it (see useResolvedPortalContainer).
 */
const InsidePortalContext = createContext(false);

/**
 * Marks everything a kit popup renders inside its Base UI Portal as "inside
 * a kit popup" for useResolvedPortalContainer. Internal building block: the
 * content part of every overlay whose Base UI portal gives Base UI a parent
 * portal node - Dialog, AlertDialog, Sheet, Drawer, Popover, Select,
 * Combobox and the menus - wraps its popup children with it, and the
 * drawer's DrawerPortal, the one Portal part the kit publishes, wraps the
 * children composed directly into it the same way so overlays beside the
 * panel stay in the drawer's portal node. It is
 * deliberately absent from public.ts and src/index.ts so consumer code can
 * neither fake nor accidentally trip the popup scope. Tooltip, HoverCard
 * and Toast neither arm it nor reset it: their portals are
 * FloatingPortalLite, which provides no PortalContext, so armed there, step
 * two would answer undefined with nothing to fall back to and a nested
 * overlay would land on <body> instead of following the provider - an
 * overlay nested in one of them follows whatever encloses that Tooltip,
 * HoverCard or Toast (see useResolvedPortalContainer). Renders no DOM of
 * its own.
 */
export function PortalScope({ children }: { children?: ReactNode }) {
  return <InsidePortalContext.Provider value={true}>{children}</InsidePortalContext.Provider>;
}

export interface PortalContainerProviderProps {
  /**
   * The default portal target for every kit overlay below this provider.
   * It is step three of the resolution order documented on
   * useResolvedPortalContainer: an overlay's own `container` prop wins, a
   * nested overlay inside another kit popup that arms the popup scope
   * follows that popup's portal unless a provider sits between them, and
   * with neither set the overlay portals to this value - or to <body>
   * when there is no provider either.
   */
  value: PortalContainer;
  children?: ReactNode;
}

/**
 * Provides the default portal container for every kit overlay below it, so
 * an application sets the popup target once per subtree instead of passing
 * `container` to each overlay. The value type is the same one the overlays'
 * `container` props take (PortalContainer), which includes a ShadowRoot: a
 * micro-frontend screen rendered inside a shadow root wraps its subtree in
 * this provider with a node inside that shadow root, and every popup lands
 * inside the tree the kit's styles are delivered to.
 *
 * An overlay resolves its target as: its own `container` prop, then the
 * portal of the kit popup it renders inside, then this value, then <body>.
 * The popup step holds inside the popups that arm the scope (Dialog,
 * AlertDialog, Sheet, Drawer, Popover, Select, Combobox and the menus);
 * Tooltip, HoverCard and Toast neither arm nor reset the scope, so a
 * nested overlay inside one of them follows whatever encloses that
 * Tooltip, HoverCard or Toast - see useResolvedPortalContainer for why.
 * The provider also resets the popup scope around its children, so a
 * provider nested inside a popup is nearer than that popup and wins again
 * for the overlays below it - menu content excepted, since an inherited
 * menu container outranks it (see useResolvedPortalContainer).
 */
export function PortalContainerProvider({ value, children }: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={value}>
      <InsidePortalContext.Provider value={false}>{children}</InsidePortalContext.Provider>
    </PortalContainerContext.Provider>
  );
}

/**
 * The default portal container provided by the nearest
 * PortalContainerProvider, or undefined when no provider encloses the
 * caller. App code portals its own overlays with it: pass the result as the
 * `container` of a non-kit portal so it lands where the kit's overlays do.
 */
export function usePortalContainer(): PortalContainer | undefined {
  return useContext(PortalContainerContext);
}

/**
 * One overlay's resolved portal target, in order:
 *
 * 1. the given `container` when the caller passed one - including an
 *    explicit null, which the caller set on purpose and which makes Base UI
 *    wait for a target instead of falling through;
 * 2. undefined when the overlay renders, at any depth, inside a kit popup
 *    that arms the popup scope with no PortalContainerProvider in between:
 *    Base UI then portals the overlay into that popup's own portal node
 *    (FloatingPortal's parentPortalNode), so a nested overlay stays in the
 *    popup that opened it - only the popups that arm the scope take this
 *    step (see below);
 * 3. the nearest PortalContainerProvider's value;
 * 4. undefined, which leaves Base UI's own default (the document body) in
 *    force.
 *
 * The popup scope read in step two is armed by the overlays whose Base UI
 * portal gives Base UI a parent portal node - Dialog, AlertDialog, Sheet,
 * Drawer, Popover, Select, Combobox and the menus (DropdownMenu,
 * ContextMenu, Menubar) - and reset by every PortalContainerProvider, so a
 * provider placed inside a popup is nearer than that popup and wins again.
 * Tooltip, HoverCard and Toast portal through FloatingPortalLite, which
 * provides no PortalContext: armed there, step two would answer undefined
 * with no portal node to fall back to and the nested overlay would land on
 * <body> instead of the provider, so those three neither arm nor reset the
 * scope - an overlay nested in one of them follows whatever encloses that
 * Tooltip, HoverCard or Toast: step two when a popup that arms the scope
 * encloses it, steps three and four when none does.
 *
 * Menu content adds one step in front of this order, and it outranks the
 * provider and the popup step: a menu content rendered inside another
 * menu content of the same family (a submenu, or a menu opened inside a
 * popup or provider that sits in such a menu) first inherits the container
 * that enclosing menu content resolved, and the menu contents pass that
 * inheritance to this hook as `container`. The two families keep separate
 * contexts (MenuContainerContext in dropdown-menu.tsx, which Menubar
 * shares, and in context-menu.tsx), so a ContextMenu content inside a
 * DropdownMenu or Menubar content, or the other way round, inherits
 * nothing. PortalContainerProvider does not reset it, so the inherited
 * container outranks a provider between them too.
 *
 * The NavigationMenu wraps its viewport in PortalScope, but no consumer
 * content renders under it: NavigationMenuContent arrives through a raw
 * createPortal into the viewport, outside the popup's React subtree, so
 * the NavigationMenu arms nothing for consumer overlays - overlays inside
 * NavigationMenuContent see the scope only from popups enclosing the whole
 * NavigationMenu.
 * usePortalContainer stays scope-blind: it always answers the provider
 * value, so app code portalling its own content keeps working inside popups
 * too. Every kit component that renders a Base UI Portal resolves its
 * target through this hook - either by calling it in its own render body
 * (which makes that module a client module) or, for the overlays below that
 * stay server modules, through ResolvedPortal.
 */
export function useResolvedPortalContainer(container: PortalContainer): PortalContainer {
  const provided = useContext(PortalContainerContext);
  const insideKitPopup = useContext(InsidePortalContext);
  if (container !== undefined) {
    return container;
  }
  if (insideKitPopup) {
    return undefined;
  }
  return provided;
}

/**
 * Renders a Base UI Portal pointed at the target useResolvedPortalContainer
 * resolves for the calling overlay: pass the Portal component to render as
 * `portal` and that Portal's own props (`container`, `children`, the rest)
 * as the remaining props, and this resolves `container` through the
 * resolution order documented on useResolvedPortalContainer and renders
 * that Portal with it. Typing `portal` against the same props keeps every
 * call site on the full prop types of the primitive it renders.
 *
 * Internal building block: deliberately absent from public.ts and
 * src/index.ts, exactly like PortalScope, so consumer code cannot render a
 * kit portal that bypasses the resolution order.
 *
 * Why the overlay parts render this instead of calling the hook in their
 * own render body: the hook reads context, which makes the component that
 * calls it a client module. Rendering ResolvedPortal instead keeps those
 * overlay modules directive-free and server-renderable - the context read
 * happens here, inside this client module, in the shared portal-container
 * chunk their portal already links against.
 */
export function ResolvedPortal<Props extends { container?: PortalContainer }>({
  portal: Portal,
  container,
  ...rest
}: { portal: ComponentType<Props> } & Props) {
  const resolvedContainer = useResolvedPortalContainer(container);
  /*
   * Sound, and still fully checked: the call site's JSX was already checked
   * against Props in full, so `rest` (the same props minus `portal` and
   * `container`) plus the resolved `container` are Props values again.
   * TypeScript cannot prove that for a generic rest type - it would have to
   * subtract two keys from an uninstantiated Props - so the conversion goes
   * through unknown, the way tsc itself prescribes for this shape. The cast
   * moves values, not types out of scope: the rendered Portal still checks
   * every prop against Props, so no `any` and nothing to suppress.
   */
  return <Portal {...(rest as unknown as Props)} container={resolvedContainer} />;
}
