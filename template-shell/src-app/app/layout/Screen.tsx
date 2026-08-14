/**
 * Screen Component
 *
 * The page panel: the rounded `--acv-color-surface-primary` card the active
 * screen is drawn on. Mirrors Constructor Cloud's `ThePageLayout` - top corners
 * rounded and flush to the bottom edge on mobile, a floating card with a 4px
 * gutter from the sidebar breakpoint up.
 *
 * The panel clips rather than scrolls: the MFE screen container inside it owns
 * its own scroll region, so a second one here would produce nested scrollbars.
 */

import React from 'react';
import styles from './layout.module.css';

export interface ScreenProps {
  children?: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({ children }) => {
  return <section className={styles.page}>{children}</section>;
};

Screen.displayName = 'Screen';
