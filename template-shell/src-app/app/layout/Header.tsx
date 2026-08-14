/**
 * Header Component
 *
 * The application's identity block: who is signed in, plus whatever actions a
 * project adds beside them.
 *
 * In the Constructor shell this is not a bar across the top of the page - it is
 * the aside's `actions` area, which the grid places at the bottom of the
 * sidebar on desktop and in the top bar on mobile. `Layout` therefore passes it
 * to `Menu` rather than rendering it above the content.
 *
 * The avatar is `AcvAvatar` from the kit, which derives both the initials and a
 * deterministic colour from the name, so nothing here has to reimplement
 * either.
 */

import React from 'react';
import { useAppSelector, type HeaderState } from '@gears-frontx/react';
import { AcvAvatar } from '@constructor/react-kit/avatar';
import styles from './layout.module.css';

export interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => {
  const headerState = useAppSelector((state) => state['layout/header'] as HeaderState | undefined);

  const user = headerState?.user;
  const loading = headerState?.loading ?? false;
  const displayName = user?.displayName || user?.email || 'User';

  return (
    <div className={styles.actions}>
      {children}
      {loading ? (
        // Placeholders shaped like the block they stand in for, so the row does
        // not change height when the user arrives.
        <div className={styles.user} aria-busy="true">
          <span className={styles.userSkeleton} />
          <span className={styles.userSkeletonText} />
        </div>
      ) : (
        <div className={styles.user} title={displayName}>
          {/*
            `children` replaces the initials; `background="inherit"` then stops
            the kit painting its generated colour behind a photo that already
            fills the circle.
          */}
          <AcvAvatar
            size="s"
            name={displayName}
            background={user?.avatarUrl ? 'inherit' : 'auto'}
          >
            {user?.avatarUrl ? (
              <img className={styles.userAvatarImage} src={user.avatarUrl} alt="" />
            ) : undefined}
          </AcvAvatar>
          <span className={styles.userName}>{displayName}</span>
        </div>
      )}
    </div>
  );
};

Header.displayName = 'Header';
