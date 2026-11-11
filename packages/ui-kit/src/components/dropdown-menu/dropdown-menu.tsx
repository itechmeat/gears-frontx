// Load-bearing: DropdownMenuContent calls useContext directly, so this
// can't be dropped. Coupled to CLIENT_COMPONENTS in
// scripts/verify-consumer.sh — keep both in sync if this ever changes.
'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cva, cx, type VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { type ComponentProps, createContext, useContext } from 'react';

import {
  PortalScope,
  useMenuContainerInheritance,
  useResolvedPortalContainer,
} from '../portal-container/portal-container';
import styles from './dropdown-menu.module.css';

/*
 * Carries DropdownMenuContent's effective portal container down to nested
 * submenus, so a theme scoped to a subtree holds one level deep without the
 * consumer repeating `container` on every DropdownMenuSubContent. An
 * explicit `container` on the submenu still wins.
 */
const MenuContainerContext = createContext<MenuPrimitive.Portal.Props['container']>(undefined);

export const DropdownMenu = MenuPrimitive.Root;
/**
 * Base UI pass-through; props type re-exported (see dialog.tsx).
 */
export type DropdownMenuProps = MenuPrimitive.Root.Props;

export interface DropdownMenuTriggerProps extends Omit<MenuPrimitive.Trigger.Props, 'className'> {
  className?: string;
}

export function DropdownMenuTrigger({ className, ...props }: DropdownMenuTriggerProps) {
  return <MenuPrimitive.Trigger className={className} {...props} />;
}

export interface DropdownMenuContentProps
  extends Omit<MenuPrimitive.Popup.Props, 'className'>,
    Pick<
      MenuPrimitive.Positioner.Props,
      // positionMethod/collision*: the escape hatch for popups anchored
      // inside a transform/filter container (an animated panel is the usual
      // case), where the default absolute positioning resolves against the
      // wrong containing block — positionMethod="fixed" is the standard
      // fix, and it must be reachable without bypassing the kit.
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
   * any DropdownMenuContent rendered inside another DropdownMenuContent of
   * the same family (a submenu, or a menu opened directly inside one)
   * first inherits the container that enclosing content resolved, and that
   * inheritance outranks a nearer PortalContainerProvider and the popup
   * step. The inheritance crosses menu popups only: another kit popup that
   * arms the popup scope between the two menu contents (Dialog,
   * AlertDialog, Sheet, Drawer, Popover, Select, Combobox, DrawerPortal)
   * ends it, so a menu inside one of those takes the popup step and
   * portals into that popup's own portal node - which keeps the menu
   * reachable when the intervening popup is a modal dialog, since the
   * dialog marks everything outside its own popup aria-hidden while it is
   * open. Outside kit popups that arm the popup scope, that is the
   * nearest PortalContainerProvider's value, or <body> when there is none.
   * Pass a themed container when the theme is scoped to a subtree
   * (data-theme on a container that isn't at document root) so the popup
   * inherits its tokens and font. Inherited by nested
   * DropdownMenuSubContent unless it passes its own.
   */
  container?: MenuPrimitive.Portal.Props['container'];
}

export function DropdownMenuContent({
  className,
  children,
  container,
  side = 'bottom',
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  positionMethod,
  collisionBoundary,
  collisionPadding,
  ...props
}: DropdownMenuContentProps) {
  const inheritedContainer = useContext(MenuContainerContext);
  // The menu tree's own inheritance stays nearest, and it crosses menu
  // popups only: a container an enclosing DropdownMenuContent resolved
  // (its own prop, or the provider it saw) outranks the provider around
  // this submenu, or a themed first-level popup would lose its subtree to
  // a farther provider - but another kit popup between the two menu
  // contents ends it, because PortalScope arms
  // useMenuContainerInheritance to false around a non-menu popup's
  // children (this popup's own PortalScope use passes
  // inheritsMenuContainer, so submenus and menus nested directly in menu
  // content keep it). Without that boundary a menu inside a modal Dialog
  // that sits in a menu content keeps the outer menu's container, and the
  // dialog marks that container's subtree aria-hidden while it is open -
  // the inner menu would disappear from assistive tech. Ended, the menu
  // takes the popup step and lands in the intervening popup's own portal
  // node. `container === undefined` rather than ??, so an explicit
  // `container={null}` survives inheritance and still makes Base UI wait
  // for a target instead of silently becoming the inherited value. Before
  // 0.6.0 this was `container ?? inheritedContainer`, so an explicit null
  // fell through to the container an enclosing menu content resolved, or
  // to <body>, and did not hold the popup back.
  const inheritsMenuContainer = useMenuContainerInheritance();
  const effectiveContainer = useResolvedPortalContainer(
    inheritsMenuContainer && container === undefined ? inheritedContainer : container,
  );
  return (
    <MenuContainerContext.Provider value={effectiveContainer}>
      <MenuPrimitive.Portal container={effectiveContainer}>
        <MenuPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          positionMethod={positionMethod}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
          className={styles.positioner}
        >
          <MenuPrimitive.Popup className={cx(styles.popup, className)} {...props}>
            {/* inheritsMenuContainer: a menu popup is the one popup boundary
                menu container inheritance crosses, so this content's own
                submenus and the menus nested directly in its content keep
                it - every other popup's PortalScope ends it. */}
            <PortalScope inheritsMenuContainer>{children}</PortalScope>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuContainerContext.Provider>
  );
}

export interface DropdownMenuGroupProps extends Omit<MenuPrimitive.Group.Props, 'className'> {
  className?: string;
}

export function DropdownMenuGroup({ className, ...props }: DropdownMenuGroupProps) {
  return <MenuPrimitive.Group className={className} {...props} />;
}

export interface DropdownMenuLabelProps extends Omit<MenuPrimitive.GroupLabel.Props, 'className'> {
  className?: string;
}

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return <MenuPrimitive.GroupLabel className={cx(styles.label, className)} {...props} />;
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

export interface DropdownMenuItemProps
  extends Omit<MenuPrimitive.Item.Props, 'className'>, VariantProps<typeof itemVariants> {
  className?: string;
}

export function DropdownMenuItem({ className, variant, ...props }: DropdownMenuItemProps) {
  return <MenuPrimitive.Item className={itemVariants({ variant, className })} {...props} />;
}

export interface DropdownMenuCheckboxItemProps
  extends Omit<MenuPrimitive.CheckboxItem.Props, 'className'> {
  className?: string;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem className={cx(styles.checkboxItem, className)} {...props}>
      {children}
      <MenuPrimitive.CheckboxItemIndicator className={styles.itemIndicator}>
        <CheckIcon className={styles.svgIcon} />
      </MenuPrimitive.CheckboxItemIndicator>
    </MenuPrimitive.CheckboxItem>
  );
}

export interface DropdownMenuRadioGroupProps
  extends Omit<MenuPrimitive.RadioGroup.Props, 'className'> {
  className?: string;
}

export function DropdownMenuRadioGroup({ className, ...props }: DropdownMenuRadioGroupProps) {
  return <MenuPrimitive.RadioGroup className={className} {...props} />;
}

export interface DropdownMenuRadioItemProps
  extends Omit<MenuPrimitive.RadioItem.Props, 'className'> {
  className?: string;
  /**
   * Which edge of the row holds the check. `'end'` is the trailing slot
   * this menu has always drawn; `'start'` is the drawn leading placement,
   * which reserves a 32px slot on the leading edge and fills a checked row
   * from the secondary role.
   * @default 'end'
   */
  indicatorSide?: 'end' | 'start';
}

export function DropdownMenuRadioItem({
  className,
  children,
  indicatorSide = 'end',
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem
      className={cx(
        styles.radioItem,
        indicatorSide === 'start' && styles.indicatorSideStart,
        className,
      )}
      {...props}
    >
      {children}
      <MenuPrimitive.RadioItemIndicator className={styles.itemIndicator}>
        <CheckIcon className={styles.svgIcon} />
      </MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

export interface DropdownMenuSeparatorProps
  extends Omit<MenuPrimitive.Separator.Props, 'className'> {
  className?: string;
}

export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return <MenuPrimitive.Separator className={cx(styles.separator, className)} {...props} />;
}

export type DropdownMenuShortcutProps = ComponentProps<'span'>;

export function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
  return <span className={cx(styles.shortcut, className)} {...props} />;
}

export const DropdownMenuSub = MenuPrimitive.SubmenuRoot;
/** Pass-through props type — see DropdownMenuProps. */
export type DropdownMenuSubProps = MenuPrimitive.SubmenuRoot.Props;

export interface DropdownMenuSubTriggerProps
  extends Omit<MenuPrimitive.SubmenuTrigger.Props, 'className'> {
  className?: string;
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger className={cx(styles.subTrigger, className)} {...props}>
      {children}
      <ChevronRightIcon className={cx(styles.svgIcon, styles.subTriggerIcon)} />
    </MenuPrimitive.SubmenuTrigger>
  );
}

export type DropdownMenuSubContentProps = DropdownMenuContentProps;

export function DropdownMenuSubContent({
  className,
  side = 'right',
  align = 'start',
  sideOffset = 0,
  alignOffset = -3,
  ...props
}: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuContent
      className={cx(styles.subPopup, className)}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      {...props}
    />
  );
}
