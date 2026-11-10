import {
  act,
  cleanup,
  fireEvent,
  getByRole,
  getByText,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';

import { AlertDialog, AlertDialogContent } from '../alert-dialog/alert-dialog';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxList } from '../combobox/combobox';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu/context-menu';
import { Dialog, DialogContent, DialogTitle } from '../dialog/dialog';
import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from '../drawer/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu/dropdown-menu';
import { HoverCard, HoverCardContent } from '../hover-card/hover-card';
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from '../menubar/menubar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../navigation-menu/navigation-menu';
import { Popover, PopoverContent } from '../popover/popover';
import { PortalContainerProvider, usePortalContainer, type PortalContainer } from './portal-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select';
import { Sheet, SheetContent } from '../sheet/sheet';
import { Toaster, createToastManager } from '../toast/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';

/*
 * Host elements appended to <body> live outside the React tree, so RTL's
 * cleanup never sees them: every test takes its hosts from createHost and
 * afterEach drops the lot.
 */
const createdHosts: HTMLDivElement[] = [];

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  createdHosts.push(host);
  return host;
}

afterEach(() => {
  cleanup();
  for (const host of createdHosts.splice(0)) {
    host.remove();
  }
});

const PROBE_ID = 'portal-container-probe';

function Probe() {
  return <span data-testid={PROBE_ID}>popup content</span>;
}

/*
 * One row per kit component that renders a Base UI Portal. `render` builds
 * the component's own test tree with the probe inside its popup, and passes
 * `container` to the prop that names the portal target (the content part,
 * or the root for NavigationMenu and Toaster). `open` covers the overlays
 * whose own tests open them by interaction instead of `defaultOpen`.
 * `locate` overrides the probe lookup for Toaster, whose portalled element
 * is the notification region itself - its children render beside the
 * viewport, not inside it.
 */
interface OverlayCase {
  name: string;
  render: (probe: ReactElement, container?: HTMLDivElement) => ReactElement;
  open?: () => void;
  locate?: (root: ParentNode) => Element | null;
}

const byProbe = (root: ParentNode) => root.querySelector(`[data-testid="${PROBE_ID}"]`);

const cases: OverlayCase[] = [
  {
    name: 'alert-dialog',
    render: (probe, container) => (
      <AlertDialog defaultOpen>
        <AlertDialogContent container={container}>{probe}</AlertDialogContent>
      </AlertDialog>
    ),
  },
  {
    name: 'combobox',
    render: (probe, container) => (
      <Combobox items={[{ value: 'eu', label: 'Europe' }]} defaultOpen>
        <ComboboxInput aria-label="Region" />
        <ComboboxContent container={container}>
          <ComboboxList>{probe}</ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
  },
  {
    name: 'context-menu',
    render: (probe, container) => (
      <ContextMenu>
        <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
        <ContextMenuContent container={container}>{probe}</ContextMenuContent>
      </ContextMenu>
    ),
    open: () => fireEvent.contextMenu(getByText(document.body, 'Right-click area')),
  },
  {
    name: 'dialog',
    render: (probe, container) => (
      <Dialog defaultOpen>
        <DialogContent container={container}>{probe}</DialogContent>
      </Dialog>
    ),
  },
  {
    name: 'drawer-content',
    render: (probe, container) => (
      <Drawer defaultOpen>
        <DrawerContent container={container}>
          <DrawerTitle>Panel</DrawerTitle>
          {probe}
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    name: 'drawer-portal',
    render: (probe, container) => (
      <Drawer defaultOpen>
        <DrawerPortal container={container}>{probe}</DrawerPortal>
        <DrawerContent>
          <DrawerTitle>Panel</DrawerTitle>
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    name: 'dropdown-menu',
    render: (probe, container) => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={container}>{probe}</DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: 'dropdown-menu-sub-content',
    render: (probe, container) => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={container}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{probe}</DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    open: () => fireEvent.click(getByRole(document.body, 'menuitem', { name: 'More tools' })),
  },
  {
    name: 'hover-card',
    render: (probe, container) => (
      <HoverCard defaultOpen>
        <HoverCardContent container={container}>{probe}</HoverCardContent>
      </HoverCard>
    ),
  },
  {
    name: 'menubar',
    render: (probe, container) => (
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent container={container}>{probe}</MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  },
  {
    name: 'navigation-menu',
    render: (probe, container) => (
      <NavigationMenu container={container}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>{probe}</NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    ),
    open: () => fireEvent.click(getByRole(document.body, 'button', { name: 'Products' })),
  },
  {
    name: 'popover',
    render: (probe, container) => (
      <Popover defaultOpen>
        <PopoverContent container={container}>{probe}</PopoverContent>
      </Popover>
    ),
  },
  {
    name: 'select',
    render: (probe, container) => (
      <Select items={[{ value: 'eu', label: 'Europe' }]} defaultOpen>
        <SelectTrigger aria-label="Region">
          <SelectValue placeholder="Pick a region" />
        </SelectTrigger>
        <SelectContent container={container}>
          <SelectItem value="eu">Europe</SelectItem>
          {probe}
        </SelectContent>
      </Select>
    ),
  },
  {
    name: 'sheet',
    render: (probe, container) => (
      <Sheet defaultOpen>
        <SheetContent container={container}>{probe}</SheetContent>
      </Sheet>
    ),
  },
  {
    name: 'toast',
    render: (probe, container) => (
      <Toaster toastManager={createToastManager()} container={container}>
        {probe}
      </Toaster>
    ),
    locate: (root) => root.querySelector('[role="region"]'),
  },
  {
    name: 'tooltip',
    render: (probe, container) => (
      <Tooltip defaultOpen>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent container={container}>{probe}</TooltipContent>
      </Tooltip>
    ),
  },
];

function locateFor(caseToRun: OverlayCase) {
  return caseToRun.locate ?? byProbe;
}

function mountWithProvider(caseToRun: OverlayCase, portalHost: HTMLDivElement, container?: HTMLDivElement) {
  render(
    <PortalContainerProvider value={portalHost}>
      {caseToRun.render(<Probe />, container)}
    </PortalContainerProvider>,
  );
  caseToRun.open?.();
}

/*
 * A dialog with a Select opened inside it: the fixture for the nested
 * overlay cases, where the interesting question is where the SELECT's
 * popup lands, not where the dialog's does. `dialogContainer` is the
 * dialog's own `container` prop; left undefined the dialog falls through
 * to the provider.
 */
function DialogWithSelect({ dialogContainer }: { dialogContainer?: PortalContainer }) {
  return (
    <Dialog defaultOpen>
      <DialogContent container={dialogContainer}>
        <DialogTitle>Settings</DialogTitle>
        <Select items={[{ value: 'eu', label: 'Europe' }]} defaultOpen>
          <SelectTrigger aria-label="Region">
            <SelectValue placeholder="Pick a region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eu">Europe</SelectItem>
            <span data-testid={PROBE_ID}>select popup content</span>
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  );
}

/*
 * The popup's Base UI portal node: the div FloatingPortal creates inside
 * the resolved container, which holds the positioner/popup and any nested
 * overlay's portal beside them.
 */
function portalNodeOf(popup: Element): Element | null {
  return popup.closest('[data-base-ui-portal]');
}

describe('PortalContainerProvider', () => {
  it.each(cases)('$name portals its popup into the provider container', async (caseToRun) => {
    const portalHost = createHost();
    mountWithProvider(caseToRun, portalHost);
    await waitFor(() => expect(locateFor(caseToRun)(portalHost)).not.toBeNull());
  });

  it.each(cases)('$name portals to <body> with no provider and no container prop', async (caseToRun) => {
    const portalHost = createHost();
    render(caseToRun.render(<Probe />));
    caseToRun.open?.();
    await waitFor(() => expect(locateFor(caseToRun)(document.body)).not.toBeNull());
    expect(locateFor(caseToRun)(portalHost)).toBeNull();
  });

  it.each(cases)('$name lets the container prop win over the provider', async (caseToRun) => {
    const portalHost = createHost();
    const propHost = createHost();
    mountWithProvider(caseToRun, portalHost, propHost);
    await waitFor(() => expect(locateFor(caseToRun)(propHost)).not.toBeNull());
    expect(locateFor(caseToRun)(portalHost)).toBeNull();
  });

  // The menu tree's own inheritance stays nearest: a first-level popup's
  // container outranks a provider around the submenu, or a themed
  // first-level popup would lose its subtree to a farther provider.
  it('keeps the first-level menu container nearest over a provider for a submenu', async () => {
    const portalHost = createHost();
    const menuHost = createHost();
    render(
      <PortalContainerProvider value={portalHost}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={menuHost}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <span data-testid={PROBE_ID}>submenu content</span>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalContainerProvider>,
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'More tools' }));
    await waitFor(() => expect(byProbe(menuHost)).not.toBeNull());
    expect(byProbe(portalHost)).toBeNull();
  });

  it('usePortalContainer returns the provided value under the provider', () => {
    const portalHost = createHost();
    function HookProbe({ expected }: { expected: ParentNode }) {
      const value = usePortalContainer();
      return (
        <span data-testid="hook-probe" data-value={value === expected ? 'host' : 'other'}>
          probe
        </span>
      );
    }
    render(
      <PortalContainerProvider value={portalHost}>
        <HookProbe expected={portalHost} />
      </PortalContainerProvider>,
    );
    expect(document.querySelector('[data-testid="hook-probe"]')?.getAttribute('data-value')).toBe('host');
  });

  it('usePortalContainer returns undefined with no provider above the caller', () => {
    function HookProbe() {
      const value = usePortalContainer();
      return (
        <span data-testid="hook-probe" data-value={value === undefined ? 'unset' : 'set'}>
          probe
        </span>
      );
    }
    render(<HookProbe />);
    expect(document.querySelector('[data-testid="hook-probe"]')?.getAttribute('data-value')).toBe('unset');
  });

  // gears-frontx#763's own scenario: the kit's styles are delivered into a
  // shadow root, so the popup must land inside it (getRootNode proves the
  // root the popup actually lives in), and pressing a field inside the popup
  // must not dismiss it as an outside press.
  it('keeps a dialog popup inside the shadow root and open on a field press', async () => {
    const host = createHost();
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    const portalHost = document.createElement('div');
    shadowRoot.appendChild(portalHost);

    render(
      <PortalContainerProvider value={portalHost}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
            <input aria-label="Name" />
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
      { container: mountPoint },
    );

    const popup = await waitFor(() => {
      const el = portalHost.querySelector('[role="dialog"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(popup.getRootNode()).toBe(shadowRoot);

    const field = portalHost.querySelector('input');
    expect(field).not.toBeNull();
    fireEvent.click(field as HTMLElement);
    expect(portalHost.querySelector('[role="dialog"]')).not.toBeNull();
  });

  // gears-frontx#763: Base UI resolves
  // `container ?? parentPortalNode ?? <body>`, so an overlay that renders
  // inside another kit popup must not be answered the provider's container
  // - it follows that popup's portal.
  it('keeps a select inside a dialog popup that has its own container', async () => {
    const providerHost = createHost();
    const dialogHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <DialogWithSelect dialogContainer={dialogHost} />
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(providerHost)).toBeNull();
    const dialogPortalNode = portalNodeOf(getByRole(dialogHost, 'dialog'));
    expect(dialogPortalNode).not.toBeNull();
    expect(dialogPortalNode?.contains(probe)).toBe(true);
  });

  it('keeps a select inside a dialog popup that portals to the provider', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <DialogWithSelect />
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(providerHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    // In the dialog's own portal node - which the provider holds - not
    // loose in the provider container.
    const dialogPortalNode = portalNodeOf(getByRole(providerHost, 'dialog'));
    expect(dialogPortalNode).not.toBeNull();
    expect(dialogPortalNode?.contains(probe)).toBe(true);
  });

  // A provider inside a popup is nearer than that popup: it resets the
  // popup scope, so overlays below it answer its value again.
  it('lets a provider nested inside a dialog popup win for overlays below it', async () => {
    const providerHost = createHost();
    const innerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
            <PortalContainerProvider value={innerHost}>
              <Select items={[{ value: 'eu', label: 'Europe' }]} defaultOpen>
                <SelectTrigger aria-label="Region">
                  <SelectValue placeholder="Pick a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Europe</SelectItem>
                  <span data-testid={PROBE_ID}>select popup content</span>
                </SelectContent>
              </Select>
            </PortalContainerProvider>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );

    await waitFor(() => expect(byProbe(innerHost)).not.toBeNull());
    expect(byProbe(providerHost)).toBeNull();
  });

  // An explicit null is a set value, not an unset one: Base UI holds the
  // popup back until a real container arrives, and neither the provider nor
  // <body> may catch it meanwhile.
  it('lets an explicit container={null} hold a dialog popup back under a provider', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent container={null}>
            <DialogTitle>Settings</DialogTitle>
            <span data-testid={PROBE_ID}>dialog content</span>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );

    await act(async () => {});
    expect(byProbe(providerHost)).toBeNull();
    expect(byProbe(document.body)).toBeNull();
  });

  // Same hold for a menu, whose `container ?? inheritedContainer` shorthand
  // used to swallow the explicit null into the inherited (here: unset)
  // value and so handed the popup to the provider.
  it('lets an explicit container={null} hold a dropdown menu popup back under a provider', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={null}>
            <span data-testid={PROBE_ID}>menu content</span>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalContainerProvider>,
    );

    await act(async () => {});
    expect(byProbe(providerHost)).toBeNull();
    expect(byProbe(document.body)).toBeNull();
  });

  it('portals to a ref container under a provider', async () => {
    const providerHost = createHost();
    const refHost = createHost();
    const containerRef: PortalContainer = { current: refHost };
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent container={containerRef}>
            <DialogTitle>Settings</DialogTitle>
            <span data-testid={PROBE_ID}>dialog content</span>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );

    await waitFor(() => expect(byProbe(refHost)).not.toBeNull());
    expect(byProbe(providerHost)).toBeNull();
  });

  // Menu inheritance still holds together with the popup scope: with no
  // explicit container anywhere, a submenu inherits the first-level menu's
  // unset value, and the popup scope then hands it to the enclosing kit
  // popup's portal - the dialog's, which also holds the first-level menu -
  // not to the provider around the whole tree.
  it('lets a submenu with no container fall to the enclosing dialog popup portal', async () => {
    const providerHost = createHost();
    const dialogHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent container={dialogHost}>
            <DialogTitle>Settings</DialogTitle>
            <DropdownMenu defaultOpen>
              <DropdownMenuTrigger>Open</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <span data-testid={PROBE_ID}>submenu content</span>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'More tools' }));

    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(providerHost)).toBeNull();
    const dialogPortalNode = portalNodeOf(getByRole(dialogHost, 'dialog'));
    expect(dialogPortalNode?.contains(probe)).toBe(true);
  });
});
