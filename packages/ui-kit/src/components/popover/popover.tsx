// Load-bearing: PopoverContent calls useContext (through
// useResolvedPortalContainer) directly in its own render body, same shape as
// DropdownMenuContent's useContext(MenuContainerContext) - see that file's
// own banner comment. Coupled to CLIENT_COMPONENTS in
// scripts/verify-consumer.sh - keep both in sync if this ever changes.
'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cx } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { useResolvedPortalContainer } from '../portal-container/portal-container';
import styles from './popover.module.css';

export const Popover = PopoverPrimitive.Root;
/**
 * Base UI pass-through; props type re-exported (see dialog.tsx).
 */
export type PopoverProps = PopoverPrimitive.Root.Props;

export interface PopoverTriggerProps extends Omit<PopoverPrimitive.Trigger.Props, 'className'> {
  className?: string;
}

export function PopoverTrigger({ className, ...props }: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger className={className} {...props} />;
}

export interface PopoverContentProps
  extends Omit<PopoverPrimitive.Popup.Props, 'className'>,
    Pick<
      PopoverPrimitive.Positioner.Props,
      // positionMethod/collision*: see dropdown-menu.tsx — the escape hatch
      // for anchors inside a transform/filter container.
      | 'align'
      | 'alignOffset'
      | 'side'
      | 'sideOffset'
      | 'positionMethod'
      | 'collisionBoundary'
      | 'collisionPadding'
      // The element the popup positions against, when that is not the
      // trigger: a cell in a grid the trigger sits above, a virtual
      // element at a pointer position, a rect the caller computes.
      | 'anchor'
    > {
  className?: string;
  /**
   * Where to portal the popup. Defaults to the nearest
   * PortalContainerProvider's value, or <body> when there is none. Pass a
   * themed container when the theme is scoped to a subtree (data-theme on a
   * container that isn't at document root) so the popup inherits its tokens
   * and font.
   */
  container?: PopoverPrimitive.Portal.Props['container'];
}

export function PopoverContent({
  className,
  children,
  container,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  anchor,
  positionMethod,
  collisionBoundary,
  collisionPadding,
  ...props
}: PopoverContentProps) {
  const resolvedContainer = useResolvedPortalContainer(container);
  return (
    <PopoverPrimitive.Portal container={resolvedContainer}>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        positionMethod={positionMethod}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        className={styles.positioner}
      >
        <PopoverPrimitive.Popup className={cx(styles.popup, className)} {...props}>
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export type PopoverHeaderProps = ComponentProps<'div'>;

export function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
  return <div className={cx(styles.header, className)} {...props} />;
}

export interface PopoverTitleProps extends Omit<PopoverPrimitive.Title.Props, 'className'> {
  className?: string;
}

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return <PopoverPrimitive.Title className={cx(styles.title, className)} {...props} />;
}

export interface PopoverDescriptionProps
  extends Omit<PopoverPrimitive.Description.Props, 'className'> {
  className?: string;
}

export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <PopoverPrimitive.Description className={cx(styles.description, className)} {...props} />
  );
}
