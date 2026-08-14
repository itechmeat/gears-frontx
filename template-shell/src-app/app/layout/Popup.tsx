/**
 * Popup Component
 *
 * Modal dialog container, drawn on the same surface and radius tokens as the
 * page panel so a dialog reads as a lifted piece of the page.
 */

import React from 'react';
import { useAppSelector, type PopupSliceState } from '@gears-frontx/react';
import styles from './layout.module.css';

export interface PopupProps {
  children?: React.ReactNode;
}

export const Popup: React.FC<PopupProps> = ({ children }) => {
  const popupState = useAppSelector((state) => state['layout/popup'] as PopupSliceState | undefined);
  const stack = popupState?.stack ?? [];

  if (stack.length === 0) {
    return null;
  }

  // Render the top popup from the stack
  const topPopup = stack[stack.length - 1];

  return (
    <div className={styles.popup}>
      <div className={styles.popupBackdrop} />
      <div className={styles.popupDialog} role="dialog" aria-modal="true">
        {topPopup.title && <h2 className={styles.popupTitle}>{topPopup.title}</h2>}
        {children}
      </div>
    </div>
  );
};

Popup.displayName = 'Popup';
