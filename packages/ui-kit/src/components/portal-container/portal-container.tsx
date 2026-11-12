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
 * Popover, Select, Combobox and the menus. The NavigationMenu arms
 * nothing (see useResolvedPortalContainer).
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
 * The menu family tokens a menu popup arms PortalScope with. DropdownMenu
 * and Menubar share DROPDOWN_MENU_FAMILY, since MenubarContent renders
 * through DropdownMenuContent. ContextMenu carries CONTEXT_MENU_FAMILY.
 * The family rule is on useMenuContainerInheritance. Internal, like
 * PortalScope: absent from public.ts and src/index.ts.
 */
export const DROPDOWN_MENU_FAMILY = Symbol('dropdown-menu');
export const CONTEXT_MENU_FAMILY = Symbol('context-menu');

/*
 * The family token the nearest PortalScope above the caller armed, or
 * undefined outside any popup and inside a popup that is not a menu.
 * PortalContainerProvider provides no value here, so a provider between
 * two menus does not end the inheritance. The family rule is on
 * useMenuContainerInheritance.
 */
const InheritsMenuContainerContext = createContext<symbol | undefined>(undefined);

/**
 * Marks everything a kit popup renders inside its Base UI Portal as inside
 * that popup, for step two of useResolvedPortalContainer. It also arms the
 * menu family token read by useMenuContainerInheritance, which holds the
 * family rule. Renders no DOM of its own.
 *
 * Every overlay whose Base UI portal gives Base UI a parent portal node
 * wraps its popup children with it: Dialog, AlertDialog, Sheet, Drawer,
 * Popover, Select, Combobox and the menus. DrawerPortal wraps the children
 * composed directly into it the same way. Tooltip, HoverCard and Toast do
 * not use it (see useResolvedPortalContainer). Internal: absent from
 * public.ts and src/index.ts, so consumer code cannot fake or trip the
 * popup scope. Reasoning in portal-container.md.
 */
export function PortalScope({
  children,
  inheritsMenuContainer,
}: {
  children?: ReactNode;
  /**
   * The menu family token allowed to cross this popup boundary. Unset, the
   * default, ends menu container inheritance here. Only the menus pass a
   * token, their own family's.
   */
  inheritsMenuContainer?: symbol;
}) {
  return (
    <InsidePortalContext.Provider value={true}>
      <InheritsMenuContainerContext.Provider value={inheritsMenuContainer}>
        {children}
      </InheritsMenuContainerContext.Provider>
    </InsidePortalContext.Provider>
  );
}

export interface PortalContainerProviderProps {
  /**
   * The default portal target for every kit overlay below this provider.
   * It is step three of the order on useResolvedPortalContainer, after the
   * overlay's own `container` and the portal of an enclosing kit popup.
   */
  value: PortalContainer;
  children?: ReactNode;
}

/**
 * Provides the default portal container for every kit overlay below it, so
 * an application sets the popup target once per subtree. The value is a
 * PortalContainer, the type the overlays' `container` props take, and a
 * ShadowRoot is one. A micro-frontend screen in a shadow root passes a node
 * inside it, so its popups land where the kit's styles are delivered.
 *
 * The provider resets the popup scope around its children, so a provider
 * nested inside a popup wins again for the overlays below it. An inherited
 * menu container still outranks it. The full order is on
 * useResolvedPortalContainer, the reasoning in portal-container.md.
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
 * The two unset shapes stay distinct there, as they do for the kit's own
 * overlays: undefined (no provider value) leaves the caller its own
 * fallback, the document body - the same default the overlays fall back
 * to - while an explicit null is a set value whose target is not there
 * yet, so the caller renders no popup until the target exists instead of
 * substituting <body> for it (the overlays hold the popup back the same
 * way).
 */
export function usePortalContainer(): PortalContainer | undefined {
  return useContext(PortalContainerContext);
}

/**
 * The family token the nearest PortalScope above the caller armed, or
 * undefined. DropdownMenuContent and ContextMenuContent compare it with
 * their own token to decide whether the inherited container stands in for
 * an unset `container`. Internal menu building block.
 *
 * The family rule: a menu content inherits the container its enclosing
 * menu content resolved only when both belong to the same family. Any kit
 * popup between them that arms the popup scope, other than a menu of that
 * family, ends the inheritance. Tooltip, HoverCard and Toast neither arm
 * nor end it. A PortalContainerProvider between them does not end it, and
 * the inherited container outranks that provider. Reasoning in
 * portal-container.md.
 */
export function useMenuContainerInheritance(): symbol | undefined {
  return useContext(InheritsMenuContainerContext);
}

/**
 * One overlay's resolved portal target, in order:
 *
 * 1. the given `container`, an explicit null included: Base UI then waits
 *    for a target instead of falling through;
 * 2. undefined inside a kit popup that arms the popup scope, unless a
 *    PortalContainerProvider sits in between: Base UI then portals into
 *    that popup's own portal node (FloatingPortal's parentPortalNode);
 * 3. the nearest PortalContainerProvider's value;
 * 4. undefined, which leaves Base UI's default, the document body.
 *
 * Dialog, AlertDialog, Sheet, Drawer, Popover, Select, Combobox and the
 * menus arm the scope through PortalScope. Every PortalContainerProvider
 * resets it, so a provider inside a popup wins again. Tooltip, HoverCard
 * and Toast neither arm nor reset it: their FloatingPortalLite provides no
 * PortalContext, so step two there would send the overlay to <body>.
 *
 * Menu content puts one step in front: it passes the container inherited
 * from its enclosing menu content as `container`, under the family rule
 * on useMenuContainerInheritance. That step outranks the popup step and
 * the provider.
 *
 * The NavigationMenu arms nothing: NavigationMenuContent arrives through a
 * raw createPortal into the viewport, outside the popup's React subtree,
 * so no scope placed there would reach consumer content. usePortalContainer ignores the scope and always answers the
 * provider value. Every kit component that renders a Base UI Portal
 * resolves through this hook: by calling it, which makes it a client
 * module, or through ResolvedPortal. Reasoning in portal-container.md.
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
