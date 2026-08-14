/**
 * Sidebar Component
 *
 * Right-side panel for contextual content, drawn as a second surface card
 * beside the page panel so the two read as one Constructor page split in two
 * rather than as a page with a rail bolted on.
 */

import React from 'react';
import { useAppSelector, type SidebarState } from '@gears-frontx/react';
import { cn } from '@/app/lib/utils';
import styles from './layout.module.css';

export interface SidebarProps {
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const sidebarState = useAppSelector((state) => state['layout/sidebar'] as SidebarState | undefined);

  const visible = sidebarState?.visible ?? false;
  const collapsed = sidebarState?.collapsed ?? true;

  if (!visible) {
    return null;
  }

  return (
    <aside className={cn(styles.aside, collapsed && styles.asideCollapsed)}>
      <div className={styles.asideBody}>{children}</div>
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';
