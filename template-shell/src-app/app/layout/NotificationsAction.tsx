/**
 * Notifications Action
 *
 * The 40x40 control the design places beside the user block at the foot of the
 * aside - where Constructor Cloud mounts its communications hub.
 *
 * The shell has no notifications service, so this renders the control and
 * nothing behind it: it is the seat a project fills, kept in the tree because
 * the footer's proportions depend on it (the user pill is `flex-grow`, so
 * whether this is here decides how wide the pill is, and the collapse
 * choreography slides this back under the pill to close the rail to one 40px
 * column).
 *
 * `count` is undefined by default, and with no count there is no badge. The
 * demo value is passed in from `Layout`, which is the one line a project
 * deletes when it wires a real service in.
 */

import React from 'react';
import { IconComments } from '@constructor/react-icons/comments';
import { cn } from '@/app/lib/utils';
import styles from './layout.module.css';

export interface NotificationsActionProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Unread count shown on the badge; no badge when absent or zero. */
  count?: number;
}

/** Test id of the action beside the user block. */
export const NOTIFICATIONS_ACTION_TESTID = 'notifications-action';

export const NotificationsAction: React.FC<NotificationsActionProps> = ({
  count,
  className,
  ...props
}) => {
  const showBadge = count !== undefined && count > 0;

  return (
    <button
      type="button"
      className={cn(styles.action, className)}
      data-testid={NOTIFICATIONS_ACTION_TESTID}
      aria-label={showBadge ? `Notifications, ${count} unread` : 'Notifications'}
      {...props}
    >
      <IconComments />
      {/*
        `aria-hidden`, because the count is already in the button's own label -
        left exposed it would be read out a second time as a bare number.
      */}
      {showBadge && (
        <span className={styles.actionBadge} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
};

NotificationsAction.displayName = 'NotificationsAction';
