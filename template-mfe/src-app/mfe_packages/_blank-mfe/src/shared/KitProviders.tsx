/**
 * The React context `@constructor/react-kit` requires, installed once for the
 * whole MFE.
 *
 * Mounted by `lifecycle.tsx` around every screen this package renders, so a new
 * screen imports kit components and works. Nothing here is optional:
 *
 * - `LocaleProvider` is mandatory. Every kit component runs
 *   `useInternalTranslations()`, which throws
 *   "useTranslation must be used within a LocaleProvider" when the context is
 *   missing - including `AcvButton`, which needs it through `AcvLoader`. A screen
 *   that renders one kit component therefore cannot render without this.
 * - `AcvColorScheme` owns the light/dark switch. It writes
 *   `acv-color-scheme-light` / `acv-color-scheme-dark` onto
 *   `document.documentElement`, which is also why it works from inside a shadow
 *   root: the theme stylesheet linked by the host document scopes its tokens on
 *   those classes, and custom properties inherit through the shadow boundary.
 */

import React, { useEffect, useState } from 'react';
import type { ChildMfeBridge } from '@gears-frontx/react';
import { FRONTX_SHARED_PROPERTY_THEME } from '@gears-frontx/react';
import { AcvColorScheme, useColorScheme } from '@constructor/react-kit/color-scheme';
import { LocaleProvider } from '@constructor/react-kit/translation';
import type { TranslationService } from '@constructor/react-kit/translation';
import kitStrings from '@constructor/react-kit/translations/en.json';
import { acvColorSchemeFor } from './acvColorScheme';

/**
 * Translations for the kit's own built-in strings (a clear button's label, a
 * loader's announcement, a table's empty state).
 *
 * Reads the kit's shipped English bundle directly and interpolates it. This is
 * the smallest thing that satisfies the contract, and it is deliberately NOT
 * wired to the screens' own i18n (`useScreenTranslations`): those two vocabularies
 * are separate - screen copy is authored in this package under
 * `screens/<name>/i18n/`, kit copy ships with the kit - and merging them would put
 * the kit's keys into every screen's 36 translation files.
 *
 * A project that ships more than English replaces the bundle here with the
 * matching `@constructor/react-kit/translations/<lang>.json` and keys the choice
 * off the host's shared language property, the same way {@link HostColorScheme}
 * keys off its theme property.
 */
const kitLocale: TranslationService = {
  t: (key, options) => {
    const raw = (kitStrings as Record<string, string>)[key];
    if (raw === undefined) {
      return key;
    }
    return raw.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
      String(options?.[name] ?? '')
    );
  },
  dir: 'ltr',
  language: 'en',
  locale: 'en',
  onChange: () => () => undefined,
  interpolation: { prefix: '{{', suffix: '}}' },
};

/**
 * Drives the kit's colour scheme from the host's shared theme property.
 *
 * Renders nothing: it exists to be a child of `AcvColorScheme`, since
 * `useColorScheme` reads the context that component provides.
 *
 * @param bridge - Host bridge handed to the lifecycle
 */
const HostColorScheme: React.FC<{ readonly bridge: ChildMfeBridge }> = ({ bridge }) => {
  const { setColorScheme } = useColorScheme();
  /*
   * The bridge's current value is read in a lazy initializer rather than at the
   * top of the effect below: a setState called synchronously in an effect body
   * re-renders before paint, which `react-hooks/set-state-in-effect` rejects.
   * The effect only has to SUBSCRIBE. Reading during the first render is
   * equivalent, because the lifecycle hands one bridge to the tree for the whole
   * mounted life of the root.
   */
  const [hostTheme, setHostTheme] = useState<string>(() => {
    const initial = bridge.getProperty(FRONTX_SHARED_PROPERTY_THEME);
    return initial && typeof initial.value === 'string' ? initial.value : 'default';
  });

  useEffect(
    () =>
      bridge.subscribeToProperty(FRONTX_SHARED_PROPERTY_THEME, (property) => {
        if (typeof property.value === 'string') {
          setHostTheme(property.value);
        }
      }),
    [bridge]
  );

  useEffect(() => {
    setColorScheme(acvColorSchemeFor(hostTheme));
  }, [hostTheme, setColorScheme]);

  return null;
};

HostColorScheme.displayName = 'HostColorScheme';

/**
 * Props for {@link KitProviders}.
 */
interface KitProvidersProps {
  /** Host bridge handed to the lifecycle. */
  readonly bridge: ChildMfeBridge;
  /** The MFE's screen tree. */
  readonly children: React.ReactNode;
}

/**
 * Wrap a screen tree in the kit's required context.
 *
 * @param props - See {@link KitProvidersProps}
 */
export const KitProviders: React.FC<KitProvidersProps> = ({ bridge, children }) => (
  <AcvColorScheme>
    <LocaleProvider value={kitLocale}>
      <HostColorScheme bridge={bridge} />
      {children}
    </LocaleProvider>
  </AcvColorScheme>
);

KitProviders.displayName = 'KitProviders';
