// Load-bearing: TooltipContent calls useContext (through
// useResolvedPortalContainer) directly in its own render body, same shape as
// DropdownMenuContent's useContext(MenuContainerContext) - see that file's
// own banner comment. Coupled to CLIENT_COMPONENTS in
// scripts/verify-consumer.sh - keep both in sync if this ever changes.
'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cx } from 'class-variance-authority';

import { PortalScope, useResolvedPortalContainer } from '../portal-container/portal-container';
import styles from './tooltip.module.css';

export const Tooltip = TooltipPrimitive.Root;
/**
 * Base UI pass-through; props type re-exported (see dialog.tsx).
 */
export type TooltipProps = TooltipPrimitive.Root.Props;

/**
 * Optional. Mount once near the app root to share open/close delay and
 * grouping across many tooltips (hover one, and adjacent ones within
 * `timeout` reopen instantly — see Base UI Tooltip.Provider). Without it,
 * each `Tooltip` behaves standalone with Base UI's own per-trigger default
 * (600ms open delay, no grouping).
 *
 * `delay` defaults to the drawn `0`: inside a provider, a tooltip opens on
 * hover with no wait. That is a real behaviour difference from a tooltip
 * outside one, which is what mounting the provider is FOR; pass `delay`
 * explicitly here or per `TooltipTrigger` to slow it back down.
 */
export function TooltipProvider({ delay = 0, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

export type TooltipProviderProps = TooltipPrimitive.Provider.Props;

export interface TooltipTriggerProps extends Omit<TooltipPrimitive.Trigger.Props, 'className'> {
  className?: string;
}

export function TooltipTrigger({ className, ...props }: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger className={className} {...props} />;
}

export interface TooltipContentProps
  extends Omit<TooltipPrimitive.Popup.Props, 'className'>,
    Pick<
      TooltipPrimitive.Positioner.Props,
      // positionMethod/collision*: see dropdown-menu.tsx — the escape hatch
      // for anchors inside a transform/filter container.
      | 'align'
      | 'alignOffset'
      | 'side'
      | 'sideOffset'
      | 'positionMethod'
      | 'collisionBoundary'
      | 'collisionPadding'
    > {
  className?: string;
  /**
   * Where to portal the popup. Defaults to the nearest
   * PortalContainerProvider's value, or <body> when there is none. Pass a
   * themed container when the theme is scoped to a subtree (data-theme on a
   * container that isn't at document root) so the popup inherits its tokens
   * and font.
   */
  container?: TooltipPrimitive.Portal.Props['container'];
}

export function TooltipContent({
  className,
  children,
  container,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  positionMethod,
  collisionBoundary,
  collisionPadding,
  ...props
}: TooltipContentProps) {
  const resolvedContainer = useResolvedPortalContainer(container);
  return (
    <TooltipPrimitive.Portal container={resolvedContainer}>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        positionMethod={positionMethod}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        className={styles.positioner}
      >
        <TooltipPrimitive.Popup className={cx(styles.popup, className)} {...props}>
          {/* PortalScope marks the popup's subtree so a nested kit overlay
            * follows this popup's portal instead of the provider's container
            * (gears-frontx#763). Context only: no DOM. */}
          <PortalScope>{children}</PortalScope>
          <TooltipPrimitive.Arrow className={styles.arrow} />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}
