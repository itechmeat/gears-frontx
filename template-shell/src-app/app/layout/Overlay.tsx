/**
 * Overlay Component
 *
 * Full-screen overlay for modals and loading states, painted with the design
 * system's own scrim token so it dims the same way in both colour schemes.
 */

import React from 'react';
import { useAppSelector, type OverlayState } from '@gears-frontx/react';
import styles from './layout.module.css';

export interface OverlayProps {
  children?: React.ReactNode;
}

export const Overlay: React.FC<OverlayProps> = ({ children }) => {
  const overlayState = useAppSelector((state) => state['layout/overlay'] as OverlayState | undefined);
  const visible = overlayState?.visible ?? false;

  if (!visible) {
    return null;
  }

  return <div className={styles.overlay}>{children}</div>;
};

Overlay.displayName = 'Overlay';
