// Load-bearing: usePortalContainer and useResolvedPortalContainer call
// useContext, so every component that calls them renders on the client.
// Coupled to CLIENT_COMPONENTS in scripts/verify-consumer.sh - keep both in
// sync if this ever changes.
'use client';

import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { createContext, useContext, type ReactNode } from 'react';

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

export interface PortalContainerProviderProps {
  /**
   * The default portal target for every kit overlay below this provider.
   * An overlay's own `container` prop still wins, and with neither set the
   * overlay portals to <body>.
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
 */
export function PortalContainerProvider({ value, children }: PortalContainerProviderProps) {
  return <PortalContainerContext.Provider value={value}>{children}</PortalContainerContext.Provider>;
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
 * One overlay's resolved portal target: the given `container` when the
 * caller passed one - including an explicit null, which the caller set on
 * purpose - otherwise the nearest PortalContainerProvider's value,
 * otherwise undefined, which leaves Base UI's own default (the document
 * body) in force. Every kit component that renders a Base UI Portal
 * resolves its target through this hook.
 */
export function useResolvedPortalContainer(container: PortalContainer): PortalContainer {
  const provided = useContext(PortalContainerContext);
  return container !== undefined ? container : provided;
}
