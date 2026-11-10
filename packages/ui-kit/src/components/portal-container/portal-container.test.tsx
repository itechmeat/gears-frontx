import { cleanup, fireEvent, getByRole, getByText, render, screen, waitFor } from '@testing-library/react';
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
import { PortalContainerProvider, usePortalContainer } from './portal-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select';
import { Sheet, SheetContent } from '../sheet/sheet';
import { Toaster, createToastManager } from '../toast/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';

afterEach(cleanup);

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

describe('PortalContainerProvider', () => {
  it.each(cases)('$name portals its popup into the provider container', async (caseToRun) => {
    const portalHost = document.createElement('div');
    document.body.appendChild(portalHost);
    mountWithProvider(caseToRun, portalHost);
    await waitFor(() => expect(locateFor(caseToRun)(portalHost)).not.toBeNull());
    portalHost.remove();
  });

  it.each(cases)('$name portals to <body> with no provider and no container prop', async (caseToRun) => {
    const portalHost = document.createElement('div');
    document.body.appendChild(portalHost);
    render(caseToRun.render(<Probe />));
    caseToRun.open?.();
    await waitFor(() => expect(locateFor(caseToRun)(document.body)).not.toBeNull());
    expect(locateFor(caseToRun)(portalHost)).toBeNull();
    portalHost.remove();
  });

  it.each(cases)('$name lets the container prop win over the provider', async (caseToRun) => {
    const portalHost = document.createElement('div');
    document.body.appendChild(portalHost);
    const propHost = document.createElement('div');
    document.body.appendChild(propHost);
    mountWithProvider(caseToRun, portalHost, propHost);
    await waitFor(() => expect(locateFor(caseToRun)(propHost)).not.toBeNull());
    expect(locateFor(caseToRun)(portalHost)).toBeNull();
    portalHost.remove();
    propHost.remove();
  });

  // The menu tree's own inheritance stays nearest: a first-level popup's
  // container outranks a provider around the submenu, or a themed
  // first-level popup would lose its subtree to a farther provider.
  it('keeps the first-level menu container nearest over a provider for a submenu', async () => {
    const portalHost = document.createElement('div');
    document.body.appendChild(portalHost);
    const menuHost = document.createElement('div');
    document.body.appendChild(menuHost);
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
    portalHost.remove();
    menuHost.remove();
  });

  it('usePortalContainer returns the provided value under the provider', () => {
    const portalHost = document.createElement('div');
    document.body.appendChild(portalHost);
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
    portalHost.remove();
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
    const host = document.createElement('div');
    document.body.appendChild(host);
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

    portalHost.remove();
    host.remove();
  });
});
