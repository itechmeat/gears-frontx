/**
 * Footer Component
 *
 * A status bar under the page panel, on the same gutter the panels float in.
 *
 * It renders only when it has something to say. The slice defaults `visible` to
 * true, and in the Constructor arrangement the footer sits on the navigation
 * field rather than against a page edge - an empty bar there is a 40px stripe
 * of chrome carrying nothing, which is why emptiness is treated as absence.
 * Setting `visible: false` still hides a footer that does have content.
 */

import React from 'react';
import { useAppSelector, type FooterState } from '@gears-frontx/react';
import styles from './layout.module.css';

export interface FooterProps {
  children?: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({ children }) => {
  const footerState = useAppSelector((state) => state['layout/footer'] as FooterState | undefined);
  const visible = footerState?.visible ?? true;

  if (!visible || !children) {
    return null;
  }

  return <footer className={styles.footer}>{children}</footer>;
};

Footer.displayName = 'Footer';
