/**
 * Header Component
 *
 * The aside's footer: who is signed in, plus an optional action beside them.
 *
 * In the Constructor shell this is not a bar across the top of the page - it is
 * the aside's `actions` area, which the grid places at the bottom of the
 * sidebar on desktop and in the top bar on mobile. `Layout` therefore passes it
 * to `Menu` rather than rendering it above the content.
 *
 * The arrangement is Cloud's `AsideNavigationActions`: a user block that grows
 * to fill the rail, and a fixed 40x40 action button after it. The user block is
 * a `NavigationButton` - the same control as the burger and the collapse toggle
 * - so it inherits their hover, their active state and their collapse
 * choreography instead of restating any of it. The avatar takes the button's
 * icon slot and the two text lines take its label slot, which is exactly how
 * Cloud composes `AsideMenu` on top of `MainNavigationButton`.
 *
 * The avatar is `AcvAvatar` from the kit, which derives both the initials and a
 * deterministic colour from the name, so nothing here has to reimplement
 * either.
 */

import React from 'react';
import { useAppSelector, type HeaderState } from '@gears-frontx/react';
import { AcvAvatar } from '@constructor/react-kit/avatar';
import { cn } from '@/app/lib/utils';
import { NavigationButton } from './NavigationButton';
import styles from './layout.module.css';

export interface HeaderProps {
  /**
   * An action rendered beside the user block, as Cloud renders its
   * communications hub there.
   *
   * A slot rather than a built-in control, because Cloud's own bottom action is
   * conditional (`v-if="bottomActionProps"`) and a template has nothing to put
   * in it: a bell wired to nothing is chrome that lies. The rail reserves the
   * 40x40 the design gives it only when a project fills it, and the collapse
   * choreography that slides it back under the user block is in the stylesheet
   * either way.
   */
  children?: React.ReactNode;
}

/** Test id of the button that opens the signed-in user's menu. */
export const HEADER_USER_TESTID = 'header-user';

export const Header: React.FC<HeaderProps> = ({ children }) => {
  const headerState = useAppSelector((state) => state['layout/header'] as HeaderState | undefined);

  const user = headerState?.user;
  const loading = headerState?.loading ?? false;
  const displayName = user?.displayName || user?.email || 'User';
  /*
   * Cloud's second line is the active team, which this shell has no notion of;
   * the email is the one thing it does know about a user that is not already on
   * the line above. Suppressed when it *is* the line above - `displayName`
   * falls back to the email, and a block repeating one string twice reads as a
   * rendering fault.
   */
  const subtitle = user?.email && user.email !== displayName ? user.email : undefined;

  return (
    <div className={styles.actions}>
      {loading ? (
        // A placeholder shaped like the block it stands in for, so the rail does
        // not change width or height when the user arrives.
        <div className={cn(styles.navButton, styles.user)} aria-busy="true">
          <span className={styles.navButtonIcon}>
            <span className={styles.userSkeleton} />
          </span>
          <span className={styles.navButtonLabel}>
            <span className={styles.userSkeletonText} />
          </span>
        </div>
      ) : (
        <NavigationButton
          className={styles.user}
          data-testid={HEADER_USER_TESTID}
          title={displayName}
          icon={
            /*
              `children` replaces the initials; `background="inherit"` then stops
              the kit painting its generated colour behind a photo that already
              fills the circle.
            */
            <AcvAvatar
              size="s"
              name={displayName}
              background={user?.avatarUrl ? 'inherit' : 'auto'}
            >
              {user?.avatarUrl ? (
                <img className={styles.userAvatarImage} src={user.avatarUrl} alt="" />
              ) : undefined}
            </AcvAvatar>
          }
          label={
            <span className={styles.userText}>
              <span className={styles.userName}>{displayName}</span>
              {subtitle && <span className={styles.userSubtitle}>{subtitle}</span>}
            </span>
          }
        />
      )}

      {children}
    </div>
  );
};

Header.displayName = 'Header';
