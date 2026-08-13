# Login Form Reference (template-mfe)

**When a task asks for a login, sign-in or authorization form, reproduce THIS
implementation rather than designing one from scratch; deviate only where the task
explicitly asks for something else.**

The sources below are copied verbatim from a realized `login-mfe` screen in a scaffolded
project - the canonical form of this screen in this template. Everything a login form
needs is already decided here: which kit components, which state, which tokens, which
i18n keys, and how the test drives it. Re-deciding any of it produces a screen that is
different without being better.

The general rules these sources obey - subpath imports, the kit ships no card, tokens are
inherited from the host document, no Tailwind in an MFE - are in the
`ecosystem-api-quick-reference` artifact in this same bundle and are not restated here.

## Composition contract

- **Two `AcvInput`s, one per credential.** Login is the kit's default text input; password
  is `type="password"`. Both `size="l"`, both controlled (`value` + `onValueChange`), each
  with its own `<label htmlFor>` in a `.field` wrapper and its own `data-testid`.
- **`autoComplete` is not set in the canonical form.** When a task asks for browser
  credential autofill, add `autoComplete="username"` and `autoComplete="current-password"`
  on the two inputs - unknown props forward to the rendered `<input>`, so they land on the
  element the browser reads. Adding them changes nothing else here.
- **One `AcvButton`**: `type="submit"`, `variant="primary"`, `size="l"`,
  `loading={isPending}`, `disabled={!canSubmit}`, stretched by the CSS module
  (`.submit { width: 100% }`) rather than by a kit prop.
- **The submit gate is `login.trim().length > 0 && password.length > 0`.** Trim the login,
  never the password - trailing space is a legal character in a password.
- **State is plain `useState`, four pieces: `login`, `password`, `outcome`,
  `errorMessage`.** No slice, no action, no effect, no event file. Nothing outside this
  component reads any of it and none of it outlives the component, which is exactly the
  case the skill's Boundaries leave in component-local state; the credential exchange
  itself is a mutation, not client state. A flux layer added here is the layer being used
  as decoration.
- **The server call is `useApiMutation` with one endpoint** -
  `mutation<LoginResponse, LoginRequest>('POST', '/sign-in')` - awaited in the submit
  handler, with `success`/`error` outcome set from its resolution. No `onMutate`/
  `onSettled` cache work: there is no query for this screen to keep consistent.
- **Layout is the screen's own CSS module against `--acv-*` tokens only**: a centred
  `.screen`, and a `.panel` that is the card the kit does not ship (surface, radius,
  spacing tokens). Status colours come from `--acv-color-status-{success,danger}-strong`.
- **Translations load through `useScreenTranslations(languageModules, bridge)`** over
  `import.meta.glob('./i18n/*.json')`, and the `loading` branch renders a token-styled
  placeholder block, not a spinner or `null`. That branch returns BEFORE the first `t()`
  call, which is what keeps raw keys and missing-key warnings off the screen; a screen with
  translated collections derives them with `useMemo(..., [t])` and never in a `useState`
  initializer (quick reference, translation section).
- **Nine i18n keys, named for their role**: `title`, `description`, `login_label`,
  `login_placeholder`, `password_label`, `password_placeholder`, `submit`, `success`,
  `error_generic`. Author them in the locale the product speaks, then propagate that one
  file over every other locale exactly as `add-mfe-package-workflow` step 5 prescribes.
- **`data-testid` on everything the test drives**: `screen-root`, `screen-loading`,
  `screen-title`, `screen-login-input`, `screen-password-input`, `screen-submit`,
  `screen-status-success`, `screen-status-login`, `screen-status-error`. The browser check
  in workflow step 7 reads these same ids from inside the shadow root.

## `src/screens/login/LoginScreen.tsx`

```tsx
import React, { useState } from 'react';
import type { ChildMfeBridge } from '@gears-frontx/react';
import { apiRegistry, useApiMutation } from '@gears-frontx/react';
import { AcvButton } from '@constructor/react-kit/button';
import { AcvInput } from '@constructor/react-kit/input';
import { useScreenTranslations } from '../../shared/useScreenTranslations';
import { LoginApiService } from '../../api/LoginApiService';
import styles from './LoginScreen.module.css';

const languageModules = import.meta.glob('./i18n/*.json') as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>;

interface LoginScreenProps {
  bridge: ChildMfeBridge;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ bridge }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  // Submit outcome is shown only by this component and owned by nothing else - useState, not a slice.
  const [outcome, setOutcome] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const service = apiRegistry.getService(LoginApiService);
  const { t, loading } = useScreenTranslations(languageModules, bridge);

  const { mutateAsync, isPending } = useApiMutation({
    endpoint: service.signIn,
  });

  if (loading) {
    return (
      <div className={styles.screen} data-testid="screen-root" role="status" aria-busy="true">
        <div className={styles.placeholders} data-testid="screen-loading">
          <div className={styles.placeholderTitle} />
          <div className={styles.placeholderLine} />
        </div>
      </div>
    );
  }

  const canSubmit = login.trim().length > 0 && password.length > 0;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    try {
      await mutateAsync({ login, password });
      setOutcome('success');
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : t('error_generic'));
      setOutcome('error');
    }
  };

  return (
    <div className={styles.screen} data-testid="screen-root">
      <section className={styles.panel}>
        <h1 className={styles.title} data-testid="screen-title">
          {t('title')}
        </h1>
        <p className={styles.description}>{t('description')}</p>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login">
              {t('login_label')}
            </label>
            <AcvInput
              id="login"
              size="l"
              value={login}
              onValueChange={setLogin}
              placeholder={t('login_placeholder')}
              data-testid="screen-login-input"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              {t('password_label')}
            </label>
            <AcvInput
              id="password"
              type="password"
              size="l"
              value={password}
              onValueChange={setPassword}
              placeholder={t('password_placeholder')}
              data-testid="screen-password-input"
            />
          </div>

          <AcvButton
            type="submit"
            variant="primary"
            size="l"
            loading={isPending}
            disabled={!canSubmit}
            className={styles.submit}
            data-testid="screen-submit"
          >
            {t('submit')}
          </AcvButton>

          {outcome === 'success' && (
            <p className={styles.success} data-testid="screen-status-success">
              {t('success')} <span data-testid="screen-status-login">{login}</span>
            </p>
          )}
          {outcome === 'error' && (
            <p className={styles.error} data-testid="screen-status-error">
              {errorMessage}
            </p>
          )}
        </form>
      </section>
    </div>
  );
};

LoginScreen.displayName = 'LoginScreen';
```

## `src/screens/login/LoginScreen.module.css`

```css
/*
 * Screen-local layout for the login screen.
 *
 * Every value resolves through a `@constructor/globals` token, declared at
 * document level and inherited across the shadow boundary - see
 * lifecycle.tsx for why this package injects no copy of its own.
 */

.screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--acv-spacing-x-large);
  color: var(--acv-color-glyph-primary);
  font-family: var(--acv-font-family-default);
}

/*
 * The panel the kit does not ship. Three declarations against the design
 * system's surface, radius and spacing tokens, which is the whole of what a
 * card component would have contributed here.
 */
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--acv-spacing-regular);
  width: 100%;
  max-width: 24rem;
  padding: var(--acv-spacing-x-large);
  border-radius: var(--acv-radius-medium);
  background-color: var(--acv-color-surface-secondary);
}

.title {
  margin: 0;
  font-size: var(--acv-font-size-heading-2-text);
  font-weight: var(--acv-font-weight-strong);
  line-height: var(--acv-line-height-heading-2-text);
}

.description {
  margin: 0;
  color: var(--acv-color-glyph-secondary);
  font-size: var(--acv-font-size-body-1-text);
  line-height: var(--acv-line-height-body-1-text);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--acv-spacing-regular);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--acv-spacing-xx-small);
}

.label {
  font-size: var(--acv-font-size-caption-1-text);
  font-weight: var(--acv-font-weight-medium);
  line-height: var(--acv-line-height-caption-1-text);
}

.submit {
  width: 100%;
}

.success {
  margin: 0;
  color: var(--acv-color-status-success-strong);
  font-size: var(--acv-font-size-body-2-text);
  line-height: var(--acv-line-height-body-2-text);
}

.error {
  margin: 0;
  color: var(--acv-color-status-danger-strong);
  font-size: var(--acv-font-size-body-2-text);
  line-height: var(--acv-line-height-body-2-text);
}

.placeholders {
  display: flex;
  flex-direction: column;
  gap: var(--acv-spacing-x-small);
  width: 100%;
  max-width: 24rem;
}

.placeholderTitle,
.placeholderLine {
  border-radius: var(--acv-radius-small);
  background-color: var(--acv-color-surface-tertiary);
}

.placeholderTitle {
  height: var(--acv-height-large);
  width: 16rem;
}

.placeholderLine {
  height: var(--acv-spacing-regular);
}
```

## `src/screens/login/i18n/en.json`

```json
{
  "title": "Sign in",
  "description": "Enter your credentials to access the console.",
  "login_label": "Login",
  "login_placeholder": "Enter your login",
  "password_label": "Password",
  "password_placeholder": "Enter your password",
  "submit": "Sign in",
  "success": "Signed in as",
  "error_generic": "Sign in failed. Please try again."
}
```

## API service, types and mock

One mutation is the whole surface. The mock signs in any non-empty pair, which is what
lets the browser check in workflow step 7 exercise the success path with no backend.

```ts
// src/api/types.ts
export type LoginRequest = { login: string; password: string };
export type LoginResponse = { token: string; login: string };

// src/api/LoginApiService.ts - constructor identical to the scaffold's, baseURL '/api/login'
readonly signIn = this.protocol(RestEndpointProtocol)
  .mutation<LoginResponse, LoginRequest>('POST', '/sign-in');

// src/api/mocks.ts - narrow the body ONCE, annotate the factory's return (see the quick reference)
export const loginMockMap: MockMap = {
  'POST /api/login/sign-in': (requestData): LoginResponse => {
    const body = (requestData ?? {}) as Partial<LoginRequest>;

    return { token: `mock-token-${body.login ?? 'unknown'}`, login: body.login ?? '' };
  },
};
```

## `src/screens/login/LoginScreen.test.tsx`

Three cases cover the form: the submit gate, the success path, and the reported error.
`userEvent` (never `fireEvent`) drives the kit inputs, `KitProviders` wraps the render,
and `apiRegistry`/`useApiMutation` are mocked so no protocol runs.

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  FRONTX_SHARED_PROPERTY_LANGUAGE,
  FRONTX_SHARED_PROPERTY_THEME,
} from '@gears-frontx/react';
import { createMfeBridgeFixture } from '@frontx-test-utils/createMfeBridgeFixture';
import { KitProviders } from '../../shared/KitProviders';
import { LoginScreen } from './LoginScreen';

const { getServiceMock, useApiMutationMock, mutateAsyncMock } = vi.hoisted(() => ({
  getServiceMock: vi.fn(),
  useApiMutationMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
}));

vi.mock('@gears-frontx/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gears-frontx/react')>();
  return {
    ...actual,
    apiRegistry: { getService: getServiceMock },
    useApiMutation: useApiMutationMock,
  };
});

vi.mock('../../api/LoginApiService', () => ({
  LoginApiService: class MockLoginApiService {
    static {
      void 0;
    }
  },
}));

const translationKeys: Record<string, string> = {
  title: 'Sign in',
  description: 'Enter your credentials to access the console.',
  login_label: 'Login',
  login_placeholder: 'Enter your login',
  password_label: 'Password',
  password_placeholder: 'Enter your password',
  submit: 'Sign in',
  success: 'Signed in as',
  error_generic: 'Sign in failed. Please try again.',
};

vi.mock('../../shared/useScreenTranslations', () => ({
  useScreenTranslations: () => ({ t: (key: string) => translationKeys[key] ?? key, loading: false }),
}));

function renderScreen() {
  const { bridge } = createMfeBridgeFixture({
    domainId: 'login-domain',
    instanceId: 'login-instance',
    initialProperties: {
      [FRONTX_SHARED_PROPERTY_THEME]: 'default',
      [FRONTX_SHARED_PROPERTY_LANGUAGE]: 'en',
    },
  });

  return render(
    <KitProviders bridge={bridge}>
      <LoginScreen bridge={bridge} />
    </KitProviders>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    getServiceMock.mockReturnValue({ signIn: { type: 'sign-in' } });
    mutateAsyncMock.mockReset();
    useApiMutationMock.mockReturnValue({ mutateAsync: mutateAsyncMock, isPending: false });
  });

  it('disables submit until both fields carry a value', async () => {
    const user = userEvent.setup();
    renderScreen();

    const submit = screen.getByTestId('screen-submit');
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    await user.type(screen.getByTestId('screen-login-input'), 'grace');
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    await user.type(screen.getByTestId('screen-password-input'), 'secret');
    expect((submit as HTMLButtonElement).disabled).toBe(false);
  });

  it('signs in and shows the success message for the entered login', async () => {
    mutateAsyncMock.mockResolvedValue({ token: 'mock-token-grace', login: 'grace' });
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByTestId('screen-login-input'), 'grace');
    await user.type(screen.getByTestId('screen-password-input'), 'secret');
    await user.click(screen.getByTestId('screen-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('screen-status-success')).toBeTruthy();
    });
    expect(mutateAsyncMock).toHaveBeenCalledWith({ login: 'grace', password: 'secret' });
    expect(screen.getByTestId('screen-status-login').textContent).toBe('grace');
  });

  it('shows the reported error message when sign-in fails', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByTestId('screen-login-input'), 'grace');
    await user.type(screen.getByTestId('screen-password-input'), 'wrong');
    await user.click(screen.getByTestId('screen-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('screen-status-error').textContent).toBe('Invalid credentials');
    });
  });
});
```

Plain Vitest matchers throughout (`toBeTruthy()`, `.disabled`, `.textContent`) - jest-dom
is not installed in this repo, and the quick reference's pitfall 3 explains why adding it
is not a test file's decision.
