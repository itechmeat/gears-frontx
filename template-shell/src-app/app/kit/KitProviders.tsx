/**
 * The React context `@constructor/react-kit` requires, installed once for the
 * whole shell.
 *
 * The shell chrome is built from kit components against `@constructor/globals`
 * tokens, and neither provider is optional:
 *
 * - `AcvColorScheme` owns the light/dark switch. It writes
 *   `acv-color-scheme-light` / `acv-color-scheme-dark` onto
 *   `document.documentElement`, and the brand stylesheet linked by
 *   `index.html` scopes every `--acv-*` token on those classes. Without it the
 *   whole document falls back to `prefers-color-scheme` and the shell ignores
 *   the theme the user picked.
 * - `LocaleProvider` is mandatory for kit components that translate their own
 *   strings; `useInternalTranslations()` throws "useTranslation must be used
 *   within a LocaleProvider" when the context is missing.
 *
 * Because the classes land on `<html>`, the same switch reaches every MFE
 * shadow root by inheritance - an MFE's own `AcvColorScheme` (see
 * `_blank-mfe/src/shared/KitProviders.tsx`) then writes the same two classes
 * from the theme id it receives over the bridge, so the two agree rather than
 * fight.
 */

import React, { useEffect } from 'react';
import { AcvColorScheme, useColorScheme } from '@constructor/react-kit/color-scheme';
import { LocaleProvider } from '@constructor/react-kit/translation';
import type { TranslationService } from '@constructor/react-kit/translation';
import kitStrings from '@constructor/react-kit/translations/en.json';
import { useTheme } from '@gears-frontx/react';
import { colorSchemeFor } from '@/app/themes';

/**
 * Translations for the kit's own built-in strings (a clear button's label, a
 * loader's announcement, a table's empty state).
 *
 * Reads the kit's shipped English bundle and interpolates it. The kit's
 * vocabulary is deliberately separate from the shell's own i18n: shell copy is
 * authored in this project, kit copy ships with the kit, and merging the two
 * would put the kit's keys into every shell translation file. A project that
 * ships more than English swaps the bundle here for the matching
 * `@constructor/react-kit/translations/<lang>.json`.
 */
const kitLocale: TranslationService = {
  t: (key, options) => {
    const raw = (kitStrings as Record<string, string>)[key];
    if (raw === undefined) {
      return key;
    }
    return raw.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? ''));
  },
  dir: 'ltr',
  language: 'en',
  locale: 'en',
  onChange: () => () => undefined,
  interpolation: { prefix: '{{', suffix: '}}' },
};

/**
 * Drives the kit's colour scheme from the applied FrontX theme.
 *
 * Renders nothing: it exists to be a child of `AcvColorScheme`, since
 * `useColorScheme` reads the context that component provides. The MFE-side
 * twin reads the theme off the bridge; here the registry is in the same
 * process, so `useTheme` is the direct source.
 */
const AppliedColorScheme: React.FC = () => {
  const { setColorScheme } = useColorScheme();
  const { currentTheme } = useTheme();

  useEffect(() => {
    setColorScheme(colorSchemeFor(currentTheme));
  }, [currentTheme, setColorScheme]);

  return null;
};

AppliedColorScheme.displayName = 'AppliedColorScheme';

export interface KitProvidersProps {
  children?: React.ReactNode;
}

/**
 * Wrap the shell in the kit's required context.
 *
 * Must sit inside `FrontXProvider`: {@link AppliedColorScheme} reads the theme
 * registry through `useTheme`.
 */
export const KitProviders: React.FC<KitProvidersProps> = ({ children }) => (
  <AcvColorScheme>
    <LocaleProvider value={kitLocale}>
      <AppliedColorScheme />
      {children}
    </LocaleProvider>
  </AcvColorScheme>
);

KitProviders.displayName = 'KitProviders';
