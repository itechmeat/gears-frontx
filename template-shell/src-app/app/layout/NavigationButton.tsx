/**
 * Navigation Button Component
 *
 * The icon-first control the navigation aside is built from: the burger, the
 * collapse toggle, and anything a project adds beside them.
 *
 * Hand-written rather than taken from `@constructor/react-kit`, for the same
 * reason Constructor Cloud hand-writes its own: a nav control is painted from
 * the `--acv-color-nav-*` family, which no kit button variant reads. The kit
 * covers the controls *inside* a page; the chrome around it is the shell's.
 */

import React from 'react';
import { cn } from '@/app/lib/utils';
import styles from './layout.module.css';

export interface NavigationButtonProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Glyph shown in the fixed-width icon slot. */
  icon: React.ReactNode;
  /** Text beside the icon; hidden while the aside is collapsed. */
  label?: React.ReactNode;
  /** Paints the button in its selected state. */
  active?: boolean;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon,
  label,
  active = false,
  className,
  ...props
}) => (
  <button
    type="button"
    className={cn(styles.navButton, active && styles.navButtonActive, className)}
    {...props}
  >
    <span className={styles.navButtonIcon}>{icon}</span>
    {label !== undefined && <span className={styles.navButtonLabel}>{label}</span>}
  </button>
);

NavigationButton.displayName = 'NavigationButton';
