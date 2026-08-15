/**
 * Layout Component
 *
 * Main layout orchestrator for the application, arranged the way the
 * Constructor Cloud shell is: a navigation aside on the `--acv-color-nav-*`
 * field, and the page as a rounded surface panel floating on it.
 *
 * The composition is deliberately flat - every region is a sibling here rather
 * than nested inside the previous one - because the arrangement is decided by
 * one CSS grid in `layout.module.css`, not by the tree. That is what lets the
 * same components read as a sidebar above 720px and as a top bar plus overlay
 * below it.
 *
 * `Header` is passed to `Menu` as its actions slot: in the Constructor shell
 * the user block sits at the bottom of the aside on desktop and in the top bar
 * on mobile, which is one grid area moving, not two components.
 */

import React, { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/app/actions/bootstrapActions';
import { cn } from '@/app/lib/utils';
import { Header } from './Header';
import { NotificationsAction } from './NotificationsAction';
import { Footer } from './Footer';
import { Menu } from './Menu';
import { Sidebar } from './Sidebar';
import { Screen } from './Screen';
import { Popup } from './Popup';
import { Overlay } from './Overlay';
import styles from './layout.module.css';

export interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  /*
   * The narrow-viewport screen list is revealed by sliding the page panel down
   * over the row the list occupies, so the flag has to sit above both the aside
   * and the page. It is view state with no life beyond the viewport, which is
   * why it is not in the `layout/menu` slice next to `collapsed`.
   */
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    // Bootstrap application on mount - fetch current user
    fetchCurrentUser();
  }, []);

  return (
    <div className={cn(styles.shell, navOpen && styles.shellNavOpen)}>
      <Menu navOpen={navOpen} onNavOpenChange={setNavOpen}>
        {/*
          The foot of the aside: the user block, and beside it the seat the
          design reserves for a project's own control - Cloud puts its
          communications hub there.

          `count` is the one piece of make-believe in this layout, and it is
          here rather than inside the control so it is a single line to delete.
          Nothing is behind the button yet; wire it to a real service, or drop
          both the prop and the element, and the footer re-proportions itself
          (the user pill is `flex-grow`).
        */}
        <Header>
          <NotificationsAction count={1} />
        </Header>
      </Menu>

      <main className={styles.content}>
        <div className={styles.panels}>
          <Screen>{children}</Screen>
          <Sidebar />
        </div>
        <Footer />
      </main>

      <Popup />
      <Overlay />
    </div>
  );
};

Layout.displayName = 'Layout';
