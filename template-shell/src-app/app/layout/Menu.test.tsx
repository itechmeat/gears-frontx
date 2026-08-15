import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScreenExtension } from '@gears-frontx/react';

const mockUseFrontX = vi.fn();
const mockUseMountedExtensions = vi.fn();
// Stands in for the whole `layout/*` slice family. Only `layout/menu` is read
// by this component, so the tooltip cases drive `collapsed` through it.
const mockUseAppSelector = vi.fn();

vi.mock('@gears-frontx/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, never>>()),
  useAppSelector: () => mockUseAppSelector(),
  useFrontX: () => mockUseFrontX(),
  useMountedExtensions: () => mockUseMountedExtensions(),
}));

const screenExtension = (
  id: string,
  route: string,
  order: number,
  label: string = id
): ScreenExtension => ({
  id,
  domain: 'screen-domain',
  entry: `${id}.entry`,
  presentation: { label, route, order },
});

// Shaped like a real registry id - dots, tildes and all - so the test id
// assertion below stands as evidence that the id goes in verbatim rather than
// through a slug step that would flatten exactly this punctuation.
const tasks = screenExtension(
  'gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.demo.screens.tasks.v1',
  '/tasks',
  20,
  'Tasks'
);

describe('Menu', () => {
  let app: {
    mfeRegistry: {
      getExtensionsForDomain: ReturnType<typeof vi.fn>;
      executeActionsChain: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    app = {
      mfeRegistry: {
        getExtensionsForDomain: vi.fn().mockReturnValue([tasks]),
        executeActionsChain: vi.fn().mockResolvedValue(undefined),
      },
    };
    mockUseFrontX.mockReturnValue(app);
    mockUseMountedExtensions.mockReturnValue([]);
    mockUseAppSelector.mockReturnValue(undefined);
    window.history.pushState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const emptyState = () => screen.queryByText(/No screens yet/);

  it('pushes the screen route and mounts the screen when its menu item is clicked', async () => {
    const { Menu } = await import('./Menu');
    render(<Menu />);

    // Driven through the test id an unattended browser run addresses this item
    // by, spelled out rather than built with `menuItemTestId`: the point is to
    // hold the published derivation - the `menu-item-` prefix and the
    // extension id verbatim after it - which a shared helper on both sides
    // would let drift unnoticed.
    await userEvent.click(await screen.findByTestId(`menu-item-${tasks.id}`));

    expect(window.location.pathname).toBe(tasks.presentation.route);
    await waitFor(() => {
      expect(app.mfeRegistry.executeActionsChain).toHaveBeenCalledTimes(1);
    });
    const chain = app.mfeRegistry.executeActionsChain.mock.calls[0][0] as {
      action: { payload: { subject: string } };
    };
    expect(chain.action.payload.subject).toBe(tasks.id);
  });

  it('mounts without touching the URL when the extension declares no route', async () => {
    const routeless = screenExtension('ext.routeless', '', 10);
    app.mfeRegistry.getExtensionsForDomain.mockReturnValue([routeless]);
    const { Menu } = await import('./Menu');
    render(<Menu />);

    await userEvent.click(await screen.findByText(routeless.presentation.label));

    expect(window.location.pathname).toBe('/');
    await waitFor(() => {
      expect(app.mfeRegistry.executeActionsChain).toHaveBeenCalledTimes(1);
    });
  });

  it('stays blank instead of claiming there are no screens while the MFEs are still registering', async () => {
    const { Menu, EMPTY_STATE_GRACE_MS } = await import('./Menu');
    // The registry is empty on the first poll and populated on the next one -
    // exactly what a hard page load looks like from the menu's side.
    app.mfeRegistry.getExtensionsForDomain.mockReturnValueOnce([]).mockReturnValue([tasks]);
    vi.useFakeTimers();
    render(<Menu />);

    expect(emptyState()).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(EMPTY_STATE_GRACE_MS);
    });

    expect(emptyState()).toBeNull();
    expect(screen.getByText(tasks.presentation.label)).toBeTruthy();
  });

  // The narrow-viewport screen list is revealed by sliding the page panel away,
  // so the flag lives in Layout and the aside only asks for it. These two cases
  // pin the asking - a burger that toggled its own state would leave the page
  // covering the list it just opened.
  it('asks to open the screen list from the burger and to close it on navigation', async () => {
    const { Menu, MENU_BURGER_TESTID } = await import('./Menu');
    const onNavOpenChange = vi.fn();
    render(<Menu navOpen={false} onNavOpenChange={onNavOpenChange} />);

    await userEvent.click(screen.getByTestId(MENU_BURGER_TESTID));
    expect(onNavOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(await screen.findByTestId(`menu-item-${tasks.id}`));
    expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
  });

  // Collapsed, the row is a glyph and the label beside it has faded out, so the
  // tooltip is the only thing left naming the screen. Expanded, the name is
  // already on the row, and a tooltip repeating it would be noise. Both halves
  // are asserted because the interesting part is the condition, not the popup.
  describe('collapsed-rail tooltips', () => {
    const hoverFirstItem = async () => {
      await userEvent.hover(await screen.findByTestId(`menu-item-${tasks.id}`));
    };

    it('names the screen on hover while the aside is collapsed', async () => {
      mockUseAppSelector.mockReturnValue({ collapsed: true });
      const { Menu } = await import('./Menu');
      render(<Menu />);

      await hoverFirstItem();

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip.textContent).toContain(tasks.presentation.label);
    });

    it('stays silent on hover while the aside is expanded', async () => {
      mockUseAppSelector.mockReturnValue({ collapsed: false });
      const { Menu } = await import('./Menu');
      render(<Menu />);

      await hoverFirstItem();

      await expect
        .poll(() => screen.queryByRole('tooltip'), { timeout: 1000 })
        .toBeNull();
    });
  });

  // Headings are what give the rail its groups, and collapsed they are the only
  // thing the kit turns into the dividers between them - so a screen landing in
  // the wrong group is a visible defect in both states.
  describe('sections', () => {
    const sectioned = (id: string, order: number, section?: string): ScreenExtension => ({
      ...screenExtension(id, `/${id}`, order),
      presentation: {
        label: id,
        route: `/${id}`,
        order,
        ...(section === undefined ? {} : { section }),
      },
    });

    it('leads with the screens that name no section, then groups the rest in first-appearance order', async () => {
      const { groupScreens } = await import('./Menu');

      const groups = groupScreens([
        sectioned('dashboard', 10),
        sectioned('catalog', 20, 'Learning'),
        sectioned('settings', 30, 'Administration'),
        // Out of order on purpose: a screen rejoins the group its section already
        // opened rather than starting a second group with the same heading.
        sectioned('my-learning', 40, 'Learning'),
      ]);

      expect(
        groups.map((g) => [g.title, g.screens.map((s) => s.id)])
      ).toEqual([
        [undefined, ['dashboard']],
        ['Learning', ['catalog', 'my-learning']],
        ['Administration', ['settings']],
      ]);
    });

    it('omits the lead group entirely when every screen names a section', async () => {
      const { groupScreens } = await import('./Menu');

      const groups = groupScreens([sectioned('catalog', 10, 'Learning')]);

      expect(groups.map((g) => g.title)).toEqual(['Learning']);
    });

    // `section` is not in `ExtensionPresentation` yet, so it arrives untyped and
    // a manifest can put anything there. Anything that is not a usable heading
    // has to fall back to the lead group rather than reach the DOM.
    it('treats a blank or non-string section as no section at all', async () => {
      const { groupScreens } = await import('./Menu');
      const bogus = sectioned('a', 10);
      Object.assign(bogus.presentation, { section: '   ' });
      const numeric = sectioned('b', 20);
      Object.assign(numeric.presentation, { section: 7 });

      const groups = groupScreens([bogus, numeric]);

      expect(groups).toEqual([{ screens: [bogus, numeric] }]);
    });

    it('draws the heading above its screens', async () => {
      app.mfeRegistry.getExtensionsForDomain.mockReturnValue([
        sectioned('dashboard', 10),
        sectioned('catalog', 20, 'Learning'),
      ]);
      const { Menu } = await import('./Menu');
      render(<Menu />);

      // Uppercasing is left to CSS, so the accessible name stays as written -
      // asserting the raw spelling is what pins that decision.
      const heading = await screen.findByText('Learning');
      const list = heading.closest('li')?.querySelector('ul');
      expect(list?.textContent).toContain('catalog');
      expect(list?.textContent).not.toContain('dashboard');
    });
  });

  it('shows the empty state once the grace window passes with nothing registered', async () => {
    const { Menu, EMPTY_STATE_GRACE_MS } = await import('./Menu');
    app.mfeRegistry.getExtensionsForDomain.mockReturnValue([]);
    vi.useFakeTimers();
    render(<Menu />);

    expect(emptyState()).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(EMPTY_STATE_GRACE_MS);
    });

    expect(emptyState()).not.toBeNull();
  });
});
