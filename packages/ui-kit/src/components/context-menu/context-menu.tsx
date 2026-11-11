// Load-bearing: ContextMenuContent calls useContext directly, so this
// can't be dropped. Coupled to CLIENT_COMPONENTS in
// scripts/verify-consumer.sh — keep both in sync if this ever changes.
'use client';

import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { cva, cx, type VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { type ComponentProps, createContext, useContext } from 'react';

import {
  CONTEXT_MENU_FAMILY,
  PortalScope,
  useMenuContainerInheritance,
  useResolvedPortalContainer,
} from '../portal-container/portal-container';
import styles from './context-menu.module.css';

/*
 * Carries ContextMenuContent's effective portal container down to nested
 * submenus, so a theme scoped to a subtree holds one level deep without the
 * consumer repeating `container` on every ContextMenuSubContent. An explicit
 * `container` on the submenu still wins. Same idiom as dropdown-menu's
 * MenuContainerContext — this primitive reuses the identical Menu submenu
 * parts under the hood.
 */
const MenuContainerContext = createContext<ContextMenuPrimitive.Portal.Props['container']>(
  undefined,
);

export const ContextMenu = ContextMenuPrimitive.Root;
/**
 * Base UI pass-through; props type re-exported (see dialog.tsx).
 */
export type ContextMenuProps = ContextMenuPrimitive.Root.Props;

export interface ContextMenuTriggerProps
  extends Omit<ContextMenuPrimitive.Trigger.Props, 'className'> {
  className?: string;
}

/**
 * The right-click / long-press activation area. Renders a `<div>` — wrap
 * whatever content the menu should apply to (a table row, a canvas, a
 * whole page section).
 */
export function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps) {
  return <ContextMenuPrimitive.Trigger className={cx(styles.trigger, className)} {...props} />;
}

export interface ContextMenuContentProps
  extends Omit<ContextMenuPrimitive.Popup.Props, 'className'>,
    Pick<
      ContextMenuPrimitive.Positioner.Props,
      // positionMethod/collision*: the escape hatch for popups anchored
      // inside a transform/filter container, where the default absolute
      // positioning resolves against the wrong containing block — see
      // dropdown-menu.tsx for the same reasoning.
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
   * Where to portal the popup. Without a `container`, the popup portals
   * where the kit overlay order puts it (see useResolvedPortalContainer):
   * any ContextMenuContent rendered inside another ContextMenuContent of
   * the same family (a submenu, or a menu opened directly inside one)
   * first inherits the container that enclosing content resolved, and that
   * inheritance outranks a nearer PortalContainerProvider and the popup
   * step. The inheritance crosses menu popups only: any kit popup that arms the popup scope, other
   * than a menu of the same family between the two menu contents ends it,
   * so a menu inside one of those follows the kit overlay order from that
   * popup on - its portal node, unless a nearer PortalContainerProvider
   * sits in between - which keeps the menu out of the subtree a dialog hides when the intervening
   * popup is a modal dialog, since the dialog marks everything outside its
   * own popup aria-hidden while it is open. Outside kit popups that arm the
   * popup scope, that is the nearest PortalContainerProvider's value, or
   * <body> when there is none. Pass a themed container when the theme is
   * scoped to a subtree (data-theme on a container that isn't at document
   * root) so the popup inherits its tokens and font. Inherited by nested
   * ContextMenuSubContent unless it passes its own.
   */
  container?: ContextMenuPrimitive.Portal.Props['container'];
}

export function ContextMenuContent({
  className,
  children,
  container,
  side = 'right',
  sideOffset = 0,
  align = 'start',
  alignOffset = 4,
  positionMethod,
  collisionBoundary,
  collisionPadding,
  ...props
}: ContextMenuContentProps) {
  const inheritedContainer = useContext(MenuContainerContext);
  // The menu tree's own inheritance stays nearest, and it crosses menu
  // popups only: a container an enclosing ContextMenuContent resolved
  // (its own prop, or the provider it saw) outranks the provider around
  // this submenu, or a themed first-level popup would lose its subtree to
  // a farther provider - but another kit popup between the two menu
  // contents ends it. PortalScope arms useMenuContainerInheritance with
  // the popup's family token around a menu popup's children and with no
  // family around every other arming popup's children, and the inheritance stands
  // only when the armed token is this family's own (CONTEXT_MENU_FAMILY):
  // this popup's own PortalScope use passes that token, so submenus and
  // menus nested directly in menu content keep it, while a Dialog or
  // Popover between the menus ends it and a dropdown or menubar popup's
  // PortalScope arms the dropdown token instead. Without that boundary a
  // menu inside a modal Dialog that sits in a menu content keeps the outer
  // menu's container, and the dialog marks that container's subtree
  // aria-hidden while it is open - the inner menu would disappear from
  // assistive tech. Ended, the menu follows the kit overlay order from the
  // intervening popup on: its portal node, unless a nearer
  // PortalContainerProvider sits in between. `container === undefined`
  // rather than ??, so an explicit `container={null}` survives inheritance
  // and still makes Base UI wait for a target instead of silently becoming
  // the inherited value. Before 0.6.0 this was
  // `container ?? inheritedContainer`, so an explicit null fell through to
  // the container an enclosing menu content resolved, or to <body>, and
  // did not hold the popup back.
  const inheritsMenuContainer = useMenuContainerInheritance() === CONTEXT_MENU_FAMILY;
  const effectiveContainer = useResolvedPortalContainer(
    inheritsMenuContainer && container === undefined ? inheritedContainer : container,
  );
  return (
    <MenuContainerContext.Provider value={effectiveContainer}>
      <ContextMenuPrimitive.Portal container={effectiveContainer}>
        <ContextMenuPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          positionMethod={positionMethod}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
          className={styles.positioner}
        >
          <ContextMenuPrimitive.Popup className={cx(styles.popup, className)} {...props}>
            {/* CONTEXT_MENU_FAMILY: a menu popup is the one popup boundary
                menu container inheritance crosses for its own family, so
                this content's own submenus and the menus nested directly
                in its content keep it - every other arming popup's PortalScope
                ends it, and a dropdown or menubar popup's PortalScope arms
                the dropdown token instead. */}
            <PortalScope inheritsMenuContainer={CONTEXT_MENU_FAMILY}>{children}</PortalScope>
          </ContextMenuPrimitive.Popup>
        </ContextMenuPrimitive.Positioner>
      </ContextMenuPrimitive.Portal>
    </MenuContainerContext.Provider>
  );
}

export interface ContextMenuGroupProps
  extends Omit<ContextMenuPrimitive.Group.Props, 'className'> {
  className?: string;
}

export function ContextMenuGroup({ className, ...props }: ContextMenuGroupProps) {
  return <ContextMenuPrimitive.Group className={className} {...props} />;
}

export interface ContextMenuLabelProps
  extends Omit<ContextMenuPrimitive.GroupLabel.Props, 'className'> {
  className?: string;
  /** Indents the label to align with an inset item's text, past its icon column. */
  inset?: boolean;
}

export function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps) {
  return (
    <ContextMenuPrimitive.GroupLabel
      data-inset={inset}
      className={cx(styles.label, className)}
      {...props}
    />
  );
}

const itemVariants = cva(styles.item, {
  variants: {
    variant: {
      default: styles.variantDefault,
      destructive: styles.variantDestructive,
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ContextMenuItemProps
  extends Omit<ContextMenuPrimitive.Item.Props, 'className'>, VariantProps<typeof itemVariants> {
  className?: string;
  /** Indents the item's text past a leading-icon column other items in the same menu use. */
  inset?: boolean;
}

export function ContextMenuItem({ className, variant, inset, ...props }: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      data-inset={inset}
      className={itemVariants({ variant, className })}
      {...props}
    />
  );
}

export interface ContextMenuCheckboxItemProps
  extends Omit<ContextMenuPrimitive.CheckboxItem.Props, 'className'> {
  className?: string;
  /** Indents the item's text past a leading-icon column other items in the same menu use. */
  inset?: boolean;
}

export function ContextMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-inset={inset}
      className={cx(styles.checkboxItem, className)}
      {...props}
    >
      {/* Indicator before the label, as upstream orders these parts. It is
          absolutely positioned, and the static position of an out-of-flow
          child of a flex container comes from the container's own alignment
          rather than its siblings — so the order carries no layout meaning
          and only has to match the registry it was ported from. */}
      <ContextMenuPrimitive.CheckboxItemIndicator className={styles.itemIndicator}>
        <CheckIcon className={styles.svgIcon} />
      </ContextMenuPrimitive.CheckboxItemIndicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

export interface ContextMenuRadioGroupProps
  extends Omit<ContextMenuPrimitive.RadioGroup.Props, 'className'> {
  className?: string;
}

export function ContextMenuRadioGroup({ className, ...props }: ContextMenuRadioGroupProps) {
  return <ContextMenuPrimitive.RadioGroup className={className} {...props} />;
}

export interface ContextMenuRadioItemProps
  extends Omit<ContextMenuPrimitive.RadioItem.Props, 'className'> {
  className?: string;
  /** Indents the item's text past a leading-icon column other items in the same menu use. */
  inset?: boolean;
}

export function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuRadioItemProps) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-inset={inset}
      className={cx(styles.radioItem, className)}
      {...props}
    >
      {/* Indicator first — see ContextMenuCheckboxItem above. The registry
          marks a selected radio row with the same check glyph as a checkbox
          row, not a dot; the group's roving selection is what distinguishes
          them, so the glyph is deliberately shared. */}
      <ContextMenuPrimitive.RadioItemIndicator className={styles.itemIndicator}>
        <CheckIcon className={styles.svgIcon} />
      </ContextMenuPrimitive.RadioItemIndicator>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

export interface ContextMenuSeparatorProps
  extends Omit<ContextMenuPrimitive.Separator.Props, 'className'> {
  className?: string;
}

export function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps) {
  return <ContextMenuPrimitive.Separator className={cx(styles.separator, className)} {...props} />;
}

export type ContextMenuShortcutProps = ComponentProps<'span'>;

export function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps) {
  return <span className={cx(styles.shortcut, className)} {...props} />;
}

export const ContextMenuSub = ContextMenuPrimitive.SubmenuRoot;
/** Pass-through props type — see ContextMenuProps. */
export type ContextMenuSubProps = ContextMenuPrimitive.SubmenuRoot.Props;

export interface ContextMenuSubTriggerProps
  extends Omit<ContextMenuPrimitive.SubmenuTrigger.Props, 'className'> {
  className?: string;
  /** Indents the trigger's text past a leading-icon column other items in the same menu use. */
  inset?: boolean;
}

export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuSubTriggerProps) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-inset={inset}
      className={cx(styles.subTrigger, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className={cx(styles.svgIcon, styles.subTriggerIcon)} />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

export type ContextMenuSubContentProps = ContextMenuContentProps;

export function ContextMenuSubContent({
  className,
  side = 'right',
  align = 'start',
  sideOffset = 0,
  // Upstream's ContextMenuSubContent passes only `side="right"` through to
  // ContextMenuContent and leaves alignOffset at its inherited default (4) —
  // unlike dropdown-menu.tsx's SubContent, which sets its own -3. A context
  // menu's root popup is pointer-anchored rather than trigger-anchored, so
  // upstream did not give its submenu a different offset from the root.
  alignOffset = 4,
  ...props
}: ContextMenuSubContentProps) {
  return (
    <ContextMenuContent
      className={cx(styles.subPopup, className)}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      {...props}
    />
  );
}
