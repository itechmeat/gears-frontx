/**
 * Menu Component
 *
 * The Constructor navigation aside: brand mark, collapse toggle, the list of
 * MFE screens, and whatever actions the layout passes as children (the user
 * block, by default).
 *
 * Its markup is one tree serving two arrangements. Below 720px the aside is
 * `display: contents`, so its children land directly in the shell grid as a
 * 64px top bar (burger, logo, actions) with the screen list hidden behind the
 * burger; at and above 720px the aside becomes the 240px sidebar itself. See
 * `layout.module.css` - the grid areas are what move, never the components.
 *
 * A click mounts the screen and pushes its `presentation.route`, so the URL
 * tracks the mounted screen and the resulting link is shareable;
 * `mfe/MfeScreenContainer.tsx` reads that URL back on load and on back/forward.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  useAppSelector,
  useFrontX,
  useMountedExtensions,
  eventBus,
  FRONTX_SCREEN_DOMAIN,
  type MenuState,
  type ScreenExtension,
} from '@gears-frontx/react';
import {
  AcvMainNavigation,
  AcvMainNavigationItem,
  AcvMainNavigationItems,
} from '@constructor/react-kit/main-navigation';
import { IconBars } from '@constructor/react-icons/bars';
import { IconXmark } from '@constructor/react-icons/xmark';
import { IconLayoutSideContentLeft } from '@constructor/react-icons/layout';
import { Icon } from '@iconify/react';
import { IconLogoConstructorFullColorWhite } from '@constructor/react-icons/logo';
import { mountScreenExtension } from '@/app/mfe/screenRouting';
import { cn } from '@/app/lib/utils';
import { NavigationButton } from './NavigationButton';
import styles from './layout.module.css';

export interface MenuProps {
  /**
   * Whether the narrow-viewport screen list is revealed.
   *
   * Owned by `Layout` rather than by this component: the reveal is the page
   * panel sliding down, and that panel is Layout's child, not the aside's.
   */
  navOpen?: boolean;
  /** Called with the state the burger is asking for. */
  onNavOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

/**
 * How long registration discovery may stay empty before the menu is allowed to
 * say there are no screens. Spans several poll cycles, so it covers the gap
 * between the menu's first render and the MFEs finishing registration.
 */
export const EMPTY_STATE_GRACE_MS = 2000;

/**
 * Test id of the menu item that mounts `extensionId`.
 *
 * This is a verification API, not a styling hook: an unattended browser run
 * clicks screens through it, so the value is part of what the host promises
 * and may not be renamed to suit a stylesheet. Nothing in the app selects on
 * it. Without a stable handle a run addresses menu items through
 * accessibility references, which are re-issued on every navigation and every
 * theme switch, so each click costs a snapshot taken only to learn the
 * reference again.
 *
 * The extension id goes in verbatim, and it is the extension id rather than
 * `presentation.route` for two reasons. It is the identity the registry keys
 * on - the same value this component already uses as the React key and as the
 * mount subject - so two menu items cannot carry one id. The route is
 * presentation metadata beside it: nothing stops two extensions declaring the
 * same route, and an extension may declare none at all, which the click
 * handler below already allows for. A route-derived id could therefore either
 * collide or collapse to the bare prefix. Verbatim also means no slug step,
 * which is its own collision risk - `a.b` and `a-b` slug to one string, and
 * extension ids are built from punctuation a slug would flatten.
 */
export const menuItemTestId = (extensionId: string): string => `menu-item-${extensionId}`;

/** Test id of the burger that opens the screen list on narrow viewports. */
export const MENU_BURGER_TESTID = 'menu-burger';

/** Test id of the control that collapses the aside to icons. */
export const MENU_COLLAPSE_TESTID = 'menu-collapse';

export const Menu: React.FC<MenuProps> = ({ navOpen = false, onNavOpenChange, children }) => {
  const menuState = useAppSelector((state) => state['layout/menu'] as MenuState | undefined);
  const app = useFrontX();
  const { mfeRegistry } = app;

  const collapsed = menuState?.collapsed ?? false;

  // Currently-mounted screen extension (subscribes to store changes; no polling).
  // Index 0 is meaningful because the host registers the screen domain with
  // ExclusiveMountStrategy in `bootstrap.ts` (single mount per domain).
  // Reading the mount set rather than tracking clicks is what makes the active
  // item correct for a screen mounted from the URL, which no click announced.
  const mountedScreens = useMountedExtensions(FRONTX_SCREEN_DOMAIN);
  const mountedId = mountedScreens[0]?.id;

  const [extensions, setExtensions] = useState<ScreenExtension[]>([]);
  // An empty registry means "not discovered yet" far more often than it means
  // "nothing to discover": on a hard load the menu renders before the MFEs have
  // registered. Showing the empty-state on that first empty poll would flash a
  // false "no screens" claim through every normal boot, so the claim waits for
  // discovery to settle - it is only trustworthy once polling has run for the
  // whole grace window without ever finding a screen.
  const [discoverySettled, setDiscoverySettled] = useState(false);

  useEffect(() => {
    if (!mfeRegistry) return;

    const refresh = () => {
      const screenExts = mfeRegistry.getExtensionsForDomain(FRONTX_SCREEN_DOMAIN) as ScreenExtension[];
      const sorted = screenExts
        .sort((a, b) => (a.presentation.order ?? 999) - (b.presentation.order ?? 999));
      setExtensions(sorted);
    };

    refresh();
    const interval = setInterval(refresh, 500);
    // The window starts with discovery itself, not with the component, so a
    // registry that arrives late still gets its full share of poll cycles.
    const graceTimer = setTimeout(() => setDiscoverySettled(true), EMPTY_STATE_GRACE_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(graceTimer);
    };
  }, [mfeRegistry]);

  const handleToggleCollapse = () => {
    eventBus.emit('layout/menu/collapsed', { collapsed: !collapsed });
  };

  const handleMenuItemClick = useCallback(
    async (extension: ScreenExtension) => {
      if (!mfeRegistry) return;
      // Closing here rather than in an effect on the mounted screen: the
      // overlay covers the page it is about to reveal, and a user who taps a
      // screen has already decided, whether or not the mount succeeds.
      onNavOpenChange?.(false);
      // The URL is pushed before the mount so a screen that fails to mount still
      // leaves the address bar on the screen the user asked for, and so the entry
      // exists before any code the screen runs can push its own.
      // `presentation.route` is schema-required, so an empty one means a manifest
      // that never should have registered - mount it, just without a URL.
      const { route } = extension.presentation;
      if (route && route !== window.location.pathname) {
        window.history.pushState(null, '', route);
      }
      await mountScreenExtension(mfeRegistry, extension.id);
    },
    [mfeRegistry, onNavOpenChange]
  );

  return (
    <AcvMainNavigation
      className={cn(styles.nav, collapsed && styles.navCollapsed)}
      collapsed={collapsed}
    >
      <NavigationButton
        className={styles.burger}
        data-testid={MENU_BURGER_TESTID}
        icon={navOpen ? <IconXmark /> : <IconBars />}
        aria-expanded={navOpen}
        aria-label={navOpen ? 'Close menu' : 'Open menu'}
        onClick={() => onNavOpenChange?.(!navOpen)}
      />

      {/*
        The Constructor wordmark, the same asset Cloud falls back to when a
        tenant has no logo of its own (`IconLogoConstructorFullColorWhite`, from
        the icon package rather than copied into the app). The white variant is
        the right one in both colour schemes: it sits on
        `--acv-color-nav-primary`, which is dark navy in each, and matches
        `--acv-color-nav-secondary`, which is white in each.

        A plain <span>, not a link: the shell has no home route to send anyone
        to, and a control that navigates nowhere is worse than a mark that never
        claimed to.
      */}
      <span className={styles.logo}>
        <IconLogoConstructorFullColorWhite
          className={styles.logoImage}
          role="img"
          aria-label="Constructor"
        />
      </span>

      <NavigationButton
        className={styles.collapse}
        data-testid={MENU_COLLAPSE_TESTID}
        icon={<IconLayoutSideContentLeft />}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        onClick={handleToggleCollapse}
      />

      <AcvMainNavigationItems className={styles.items}>
        {extensions.map((ext) => {
          const pres = ext.presentation;
          return (
            <AcvMainNavigationItem
              key={ext.id}
              className={styles.item}
              active={ext.id === mountedId}
              icon={pres.icon ? <Icon icon={pres.icon} className={styles.itemIcon} /> : undefined}
              render={
                <button
                  type="button"
                  className={styles.itemButton}
                  data-testid={menuItemTestId(ext.id)}
                  title={collapsed ? pres.label : undefined}
                  onClick={() => handleMenuItemClick(ext)}
                />
              }
            >
              {pres.label}
            </AcvMainNavigationItem>
          );
        })}

        {/* Until discovery settles the menu stays blank rather than guessing. */}
        {extensions.length === 0 && discoverySettled && (
          <li className={styles.emptyState}>
            No screens yet. Add an MFE package by copying the <code>_blank-mfe</code> reference scaffold in <code>mfe_packages/</code>, then delete <code>templateExample</code> from the copy&rsquo;s <code>mfe.json</code> so it reaches this menu.
          </li>
        )}
      </AcvMainNavigationItems>

      {children}
    </AcvMainNavigation>
  );
};

Menu.displayName = 'Menu';
