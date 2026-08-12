import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  FRONTX_SHARED_PROPERTY_LANGUAGE,
  FRONTX_SHARED_PROPERTY_THEME,
} from '@gears-frontx/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMfeBridgeFixture } from '../../../__test-utils__/createMfeBridgeFixture';

type BridgeFixture = ReturnType<typeof createMfeBridgeFixture>;
type TestBridge = BridgeFixture['bridge'];
type TestApp = { id: string };

const superMountSpy = vi.fn();
const {
  getServiceMock,
  useApiQueryMock,
  useScreenTranslationsMock,
} = vi.hoisted(() => ({
  getServiceMock: vi.fn(),
  useApiQueryMock: vi.fn(),
  useScreenTranslationsMock: vi.fn(),
}));

vi.mock('@gears-frontx/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gears-frontx/react')>();
  return {
    ...actual,
    ThemeAwareReactLifecycle: class ThemeAwareReactLifecycle {
      constructor(public readonly app: TestApp) {}

      mount(container: Element | ShadowRoot, bridge: TestBridge): void {
        superMountSpy(container, bridge);
      }
    },
    apiRegistry: {
      getService: getServiceMock,
    },
    useApiQuery: useApiQueryMock,
  };
});

vi.mock('./init', () => ({
  mfeApp: { id: 'blank-mfe-app' },
}));

vi.mock('./api/_BlankApiService', () => ({
  _BlankApiService: class MockBlankApiService {
    static {
      void 0;
    }
  },
}));

vi.mock('./shared/useScreenTranslations', () => ({
  useScreenTranslations: useScreenTranslationsMock,
}));

describe('blank-mfe lifecycle', () => {
  beforeEach(() => {
    getServiceMock.mockReturnValue({ getStatus: { type: 'status' } });
    useScreenTranslationsMock.mockReturnValue({ t: (key: string) => key, loading: false });
    useApiQueryMock.mockReturnValue({
      data: {
        message: 'Blank MFE query example is active.',
        generatedAt: '2026-03-23T12:00:00.000Z',
        capabilities: ['query-key-factory'],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('binds the shared MFE app to the lifecycle instance', async () => {
    const module = await import('./lifecycle');
    const lifecycle = module.default;

    expect(Reflect.get(lifecycle, 'app')).toEqual({ id: 'blank-mfe-app' } satisfies TestApp);
  });

  it('renders the real home screen with the provided bridge', async () => {
    const module = await import('./lifecycle');
    const lifecycle = module.default;
    const renderContent = Reflect.get(lifecycle, 'renderContent');
    const { bridge } = createMfeBridgeFixture({
      domainId: 'blank-domain',
      instanceId: 'blank-instance',
      initialProperties: {
        [FRONTX_SHARED_PROPERTY_THEME]: 'blank-theme',
        [FRONTX_SHARED_PROPERTY_LANGUAGE]: 'en',
      },
    });

    expect(typeof renderContent).toBe('function');
    render(<>{renderContent(bridge) as React.ReactNode}</>);

    expect(await screen.findByText('blank-domain')).toBeTruthy();
    expect(screen.getByText('blank-instance')).toBeTruthy();
    expect(screen.getByText('blank-theme')).toBeTruthy();
    expect(
      screen.getByText((content) => content.includes('Blank MFE query example is active.'))
    ).toBeTruthy();
  });

  /*
   * The two style bridges are covered on their own in shared/. What this asserts
   * is that `initializeStyles` still RUNS both: each is invisible when it is
   * missing (components render half-styled, overlays render unstyled) rather than
   * failing, so the wiring is the part worth pinning here. It also asserts what
   * the hook must NOT do - inject a token stylesheet of its own.
   */
  it('installs both cascade bridges into the shadow root it renders into', async () => {
    const module = await import('./lifecycle');
    const initializeStyles = Reflect.get(module.default, 'initializeStyles') as (
      container: ShadowRoot
    ) => void;
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });
    const hostClone = document.createElement('style');
    hostClone.textContent = 'button { background-color: transparent }';
    shadowRoot.appendChild(hostClone);
    const runtimeStyle = document.createElement('link');
    runtimeStyle.id = '__frontx-mfe-runtime-style-blank';
    runtimeStyle.rel = 'stylesheet';
    runtimeStyle.href = 'https://mfe.test/assets/blank.css';
    shadowRoot.appendChild(runtimeStyle);

    initializeStyles.call(module.default, shadowRoot);

    expect(hostClone.textContent).toContain('@layer frontx-host {');
    expect(
      document.head.querySelector(
        'link[data-frontx-mfe-style-mirror][href="https://mfe.test/assets/blank.css"]'
      )
    ).toBeTruthy();
    // The design tokens come from the host document, never from a second copy here.
    expect(shadowRoot.querySelectorAll('style')).toHaveLength(1);
  });

  it('inherits base mount behavior from ThemeAwareReactLifecycle', async () => {
    const module = await import('./lifecycle');
    const lifecycle = module.default as {
      mount: (container: Element, bridge: TestBridge) => void;
    };
    const container = document.createElement('div');
    const { bridge } = createMfeBridgeFixture({
      domainId: 'blank-domain',
      instanceId: 'blank-instance',
    });

    lifecycle.mount(container, bridge);

    expect(superMountSpy).toHaveBeenCalledWith(container, bridge);
  });
});
