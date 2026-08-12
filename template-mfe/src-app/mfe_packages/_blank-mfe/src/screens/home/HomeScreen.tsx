import React, { useEffect, useRef, useState } from 'react';
import type { ChildMfeBridge } from '@gears-frontx/react';
import {
  FRONTX_SHARED_PROPERTY_THEME,
  FRONTX_SHARED_PROPERTY_LANGUAGE,
  useApiQuery,
  apiRegistry,
} from '@gears-frontx/react';
import { AcvButton } from '@constructor/react-kit/button';
import { AcvInput } from '@constructor/react-kit/input';
import { AcvStatusTag } from '@constructor/react-kit/status-tag';
import { AcvTooltip } from '@constructor/react-kit/tooltip';
import { useColorScheme } from '@constructor/react-kit/color-scheme';
import { useScreenTranslations } from '../../shared/useScreenTranslations';
import { _BlankApiService } from '../../api/_BlankApiService';
import styles from './HomeScreen.module.css';

// Stable reference for translation modules (hoisted to module level to prevent re-render loops)
const languageModules = import.meta.glob('./i18n/*.json') as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>;

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

function readBridgeProperty(bridge: ChildMfeBridge, property: string, fallback: string): string {
  const current = bridge.getProperty(property);
  return current && typeof current.value === 'string' ? current.value : fallback;
}

/**
 * Props for the HomeScreen component.
 */
interface HomeScreenProps {
  bridge: ChildMfeBridge;
}

/**
 * Home Screen for the Blank MFE template.
 *
 * This is a template component that demonstrates:
 * - Shadow DOM isolation
 * - Bridge communication with the host
 * - Theme property subscription
 * - Language property subscription
 * - MFE-local i18n with dynamic translation loading
 * - Components from `@constructor/react-kit`, styled from `@constructor/globals`
 *   tokens
 *
 * The kit's context is installed once by `lifecycle.tsx` (see
 * `shared/KitProviders.tsx`), so a screen imports kit components and needs no
 * provider of its own.
 *
 * To use this template:
 * 1. Copy the entire _blank-mfe directory to a new name
 * 2. Update all placeholder IDs in mfe.json
 * 3. Update package.json name and port
 * 4. Update vite.config.ts name
 * 5. Customize this component for your use case
 * 6. Add/modify translation files as needed
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ bridge }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Initial value read directly from the bridge's lazy useState initializer (runs once,
  // synchronously, during the first render) instead of via setState in a mount effect -
  // this avoids an extra render and the set-state-in-effect anti-pattern. The effect
  // below only subscribes for subsequent property changes.
  const [theme, setTheme] = useState<string>(() =>
    readBridgeProperty(bridge, FRONTX_SHARED_PROPERTY_THEME, 'default')
  );
  const [language, setLanguage] = useState<string>(() =>
    readBridgeProperty(bridge, FRONTX_SHARED_PROPERTY_LANGUAGE, 'en')
  );
  // The lazy initializers above run only on mount; if the host swaps the bridge
  // instance, re-read its current properties during render ("adjusting state
  // during render") - the subscription effect only delivers future changes.
  const [prevBridge, setPrevBridge] = useState(bridge);
  if (prevBridge !== bridge) {
    setPrevBridge(bridge);
    setTheme(readBridgeProperty(bridge, FRONTX_SHARED_PROPERTY_THEME, 'default'));
    setLanguage(readBridgeProperty(bridge, FRONTX_SHARED_PROPERTY_LANGUAGE, 'en'));
  }
  const [filter, setFilter] = useState('');

  /*
   * Read-only here. The colour scheme is DRIVEN by KitProviders from the host's
   * theme property; this screen only reports which of the two the host's theme
   * resolved to, so that a scaffolded app shows the theme bridge working.
   */
  const { colorScheme } = useColorScheme();

  // @cpt-begin:implement-endpoint-descriptors:p4:inst-blank-home-query
  const service = apiRegistry.getService(_BlankApiService);
  const { t, loading } = useScreenTranslations(languageModules, bridge);
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useApiQuery(service.getStatus);
  // @cpt-end:implement-endpoint-descriptors:p4:inst-blank-home-query

  useEffect(() => {
    // Subscribe to theme domain property
    const themeUnsubscribe = bridge.subscribeToProperty(
      FRONTX_SHARED_PROPERTY_THEME,
      (property) => {
        if (typeof property.value === 'string') {
          setTheme(property.value);
        }
      }
    );

    // Subscribe to language domain property
    const languageUnsubscribe = bridge.subscribeToProperty(
      FRONTX_SHARED_PROPERTY_LANGUAGE,
      (property) => {
        if (typeof property.value === 'string') {
          setLanguage(property.value);
        }
      }
    );

    return () => {
      themeUnsubscribe();
      languageUnsubscribe();
    };
  }, [bridge]);

  // Keep the Shadow DOM host's text direction in sync with the active language.
  // An effect keyed by `language` (rather than logic inside the subscription
  // callback) also covers the initial language, which never fires a callback.
  useEffect(() => {
    const rootNode = containerRef.current?.getRootNode();
    if (rootNode && 'host' in rootNode) {
      (rootNode.host as HTMLElement).dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
    }
  }, [language]);

  /*
   * The `data-testid` attributes below are verification API, not decoration.
   * A screen renders inside a shadow root, so selectors issued from outside it
   * cannot reach these nodes; browser verification runs an eval inside the root
   * and addresses controls by testid. Accessibility-snapshot refs are ephemeral
   * and have to be re-learned after every navigation, which these ids replace.
   * Every screen copied from this scaffold inherits the contract: keep a
   * `screen-<control>` testid on each interactive control and on the status
   * region, and rename the id with the control rather than dropping it.
   */

  // Show placeholders while translations are loading
  if (loading) {
    return (
      // A placeholder carries no loading semantics of its own; the region announces them.
      <div
        ref={containerRef}
        className={styles.screen}
        data-testid="screen-root"
        role="status"
        aria-busy="true"
      >
        <div className={styles.placeholders} data-testid="screen-loading">
          <div className={styles.placeholderTitle} />
          <div className={styles.placeholderLine} />
        </div>
        <section className={styles.panel}>
          <div className={styles.placeholders}>
            <div className={styles.placeholderLine} />
            <div className={styles.placeholderLine} />
            <div className={styles.placeholderLineShort} />
          </div>
        </section>
      </div>
    );
  }

  let statusBody: React.ReactNode;
  if (isStatusLoading) {
    statusBody = (
      <div
        role="status"
        aria-busy="true"
        className={styles.placeholders}
        data-testid="screen-status-loading"
      >
        <div className={styles.placeholderLine} />
        <div className={styles.placeholderLineShort} />
        <div className={styles.placeholderBlock} />
      </div>
    );
  } else if (isStatusError) {
    statusBody = (
      <p className={styles.error} data-testid="screen-status-error">
        {statusError?.message}
      </p>
    );
  } else {
    statusBody = (
      <pre className={styles.payload} data-testid="screen-status-payload">
        {JSON.stringify(statusData, null, 2)}
      </pre>
    );
  }

  return (
    <div ref={containerRef} className={styles.screen} data-testid="screen-root">
      <div className={styles.intro}>
        <h1 className={styles.title} data-testid="screen-title">
          {t('title')}
        </h1>
        <p className={styles.description}>{t('description')}</p>
      </div>

      {/*
        A plain <section> rather than a kit container component: the kit ships no
        card, and a panel is three declarations of surface, radius and padding
        against `@constructor/globals` tokens (see HomeScreen.module.css). Reach
        for `@constructor/react-kit` for CONTROLS, and for the tokens for layout.
      */}
      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>{t('bridge_info')}</h2>
        <dl className={styles.definitions}>
          <div>
            <dt className={styles.term}>{t('domain_id')}</dt>
            <dd className={styles.value} data-testid="screen-domain-id">
              {bridge.domainId}
            </dd>
          </div>
          <div>
            <dt className={styles.term}>{t('instance_id')}</dt>
            <dd className={styles.value} data-testid="screen-instance-id">
              {bridge.instanceId}
            </dd>
          </div>
          <div>
            <dt className={styles.term}>{t('current_theme')}</dt>
            <dd className={styles.value}>
              <span data-testid="screen-theme">{theme}</span>
              {/*
                The kit resolves every colour through one of two schemes, so this
                tag is the visible proof that the host's theme reached it.
              */}
              <AcvStatusTag
                variant={colorScheme === 'dark' ? 'info' : 'success'}
                size="s"
                data-testid="screen-color-scheme"
              >
                {colorScheme}
              </AcvStatusTag>
            </dd>
          </div>
          <div>
            <dt className={styles.term}>{t('current_language')}</dt>
            <dd className={styles.value} data-testid="screen-language">
              {language}
            </dd>
          </div>
        </dl>
      </section>

      {/*
        Kit controls, kept in the scaffold as a live check of the wiring: if the
        two style bridges in lifecycle.tsx or the providers in KitProviders are
        broken, these render half-styled or throw, in the first screen of a fresh
        project rather than three screens later. AcvTooltip earns its place
        specifically - it portals its popup into `document.body`, which is what
        `mirrorMfeStylesToDocument` exists for.
      */}
      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>{t('kit_controls')}</h2>
        <div className={styles.controls}>
          {/*
            `type="text"`, not `"search"`: a search input renders the browser's own
            ::-webkit-search-cancel-button, which sits right beside the kit's
            `clearable` control and shows the user two clear buttons.
          */}
          <AcvInput
            type="text"
            size="m"
            clearable
            value={filter}
            placeholder={t('filter_placeholder')}
            onValueChange={setFilter}
            className={styles.filter}
            data-testid="screen-filter"
          />
          <AcvTooltip
            trigger={
              <AcvButton
                variant="secondary"
                size="m"
                disabled={filter.length === 0}
                onClick={() => setFilter('')}
                data-testid="screen-filter-clear"
              >
                {t('clear')}
              </AcvButton>
            }
          >
            <span data-testid="screen-filter-clear-tooltip">{t('clear_hint')}</span>
          </AcvTooltip>
        </div>
        <p className={styles.value} data-testid="screen-filter-echo">
          {filter}
        </p>
      </section>

      <section className={styles.panel} data-testid="screen-status">
        {statusBody}
      </section>
    </div>
  );
};

HomeScreen.displayName = 'HomeScreen';
