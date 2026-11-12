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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef, useState, type ReactElement, type RefObject } from 'react';

import { AlertDialog, AlertDialogContent } from '../alert-dialog/alert-dialog';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxList } from '../combobox/combobox';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu/context-menu';
import { Dialog, DialogContent, DialogTitle } from '../dialog/dialog';
import dialogStyles from '../dialog/dialog.module.css';
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
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
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

/**
 * A real press on an element: the pointer and mouse run plus the click that
 * Base UI's dismissal logic decides on, dispatched synchronously like a
 * browser would fire them. jsdom has no PointerEvent, so pointer events go
 * through MouseEvent (the kit's vitest setup polyfills a PointerEvent that
 * subclasses it; constructing the base class directly works either way).
 */
function press(target: Element): void {
  const rect = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: 0,
    clientY: 0,
    button: 0,
  };
  fireEvent.pointerDown(target, rect);
  fireEvent.mouseDown(target, rect);
  fireEvent.pointerUp(target, rect);
  fireEvent.mouseUp(target, rect);
  fireEvent.click(target, rect);
}

/** One macrotask: the window dismissal handlers run their bookkeeping in timeouts. */
async function tick(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

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
  // container outranks the provider around the menu AND the popup step for
  // its submenu. The popup step alone would hang the submenu's portal node
  // one level deeper, inside the first-level menu's own portal node (where a
  // cross-family menu lands - see the sibling test below); inheritance puts
  // it directly in the container the first-level content resolved. The
  // parentElement assertion is the load-bearing one.
  it('portals a submenu directly into the first-level menu container, past the popup step and the provider', async () => {
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

    const probe = await waitFor(() => {
      const el = byProbe(menuHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(portalHost)).toBeNull();
    // Not nested inside the first-level menu's own portal node: the
    // submenu's portal node hangs directly under menuHost.
    expect(portalNodeOf(probe)?.parentElement).toBe(menuHost);
  });

  // The provider between the two menus is the trap the inheritance rule
  // exists for: PortalContainerProvider resets the popup scope and offers
  // its own container, so a submenu that skipped the inherited-container
  // step would answer the provider between it and the parent menu instead
  // of the container the parent menu resolved.
  it('keeps the inherited menu container for a submenu under a provider between the menus', async () => {
    const menuHost = createHost();
    const innerProviderHost = createHost();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={menuHost}>
          <PortalContainerProvider value={innerProviderHost}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <span data-testid={PROBE_ID}>submenu content</span>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </PortalContainerProvider>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'More tools' }));
    await waitFor(() => expect(byProbe(menuHost)).not.toBeNull());
    expect(byProbe(innerProviderHost)).toBeNull();
  });

  // Menubar shares the DropdownMenu family context, but the inheritance
  // crosses menu popups only: a menubar menu opened inside a popover that
  // sits in a dropdown menu content ends the inheritance at the popover
  // (PortalScope resets menu container inheritance around every non-menu
  // popup's children), so the menubar menu takes the popup step and lands
  // in the popover's own portal node - not in the container the dropdown
  // content resolved, and not to the provider around the whole tree. The
  // wave-7 version of this test asserted the old rule, where the
  // inheritance outranked the popup step here too; the modal-dialog
  // boundary in #765 changed the rule, because an inherited container
  // across a non-menu popup can hang the inner menu in a subtree the
  // intervening modal marks aria-hidden.
  it('portals a menubar menu opened in a popover inside a dropdown menu content into the popover portal node', async () => {
    const providerHost = createHost();
    const menuHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={menuHost}>
            <Popover defaultOpen>
              <PopoverContent>
                <Menubar>
                  <MenubarMenu defaultOpen>
                    <MenubarTrigger>View</MenubarTrigger>
                    <MenubarContent>
                      <span data-testid={PROBE_ID}>menubar content</span>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </PopoverContent>
            </Popover>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalContainerProvider>,
    );

    // Raw querySelector, not a role or text query: with the menubar menu
    // open, Base UI can mark the enclosing popups aria-hidden, which hides
    // them from those queries.
    const probe = await waitFor(() => {
      const el = document.querySelector(`[data-testid="${PROBE_ID}"]`);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(providerHost)).toBeNull();
    // The menubar's portal node hangs directly under the popover's own
    // portal node - the popup step, not the inherited container. The
    // popover has no container of its own, so its portal node follows the
    // dropdown popup's portal (the kit order), which is why the probe is
    // still a DOM descendant of the dropdown's container: what changed is
    // one level, the one the old rule let the inheritance skip.
    const menubarPortalNode = portalNodeOf(probe);
    expect(menubarPortalNode).not.toBeNull();
    const popoverPortalNode = menubarPortalNode?.parentElement ?? null;
    const dropdownPortalNode = popoverPortalNode?.parentElement ?? null;
    expect(popoverPortalNode?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(dropdownPortalNode?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(dropdownPortalNode?.parentElement).toBe(menuHost);
  });

  // Cross-family menus keep separate contexts: a context menu opened inside
  // a dropdown menu content inherits nothing, so the popup step sends it
  // into the dropdown's own portal node - not into a fresh portal node
  // beside it in the inherited container, and not to the provider.
  it('keeps a context menu opened inside a dropdown menu in the dropdown portal node, not the inherited container', async () => {
    const providerHost = createHost();
    const menuHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={menuHost}>
            <ContextMenu>
              <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
              <ContextMenuContent>
                <span data-testid={PROBE_ID}>context menu content</span>
              </ContextMenuContent>
            </ContextMenu>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalContainerProvider>,
    );
    fireEvent.contextMenu(screen.getByText('Right-click area'));

    const probe = await waitFor(() => {
      const el = byProbe(menuHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    // Raw text query, not a role query: with the nested context menu open,
    // Base UI marks the enclosing dropdown popup aria-hidden, and the context
    // menu's own popup carries no accessible name. The trigger text sits
    // inside the dropdown's popup, so its portal node is the dropdown's.
    const dropdownPortalNode = portalNodeOf(getByText(menuHost, 'Right-click area'));
    expect(dropdownPortalNode).not.toBeNull();
    expect(dropdownPortalNode?.contains(probe)).toBe(true);
    expect(byProbe(providerHost)).toBeNull();
  });

  // #765: an outer menu open, a modal Dialog with its own portal host
  // opened inside it, and a menu inside the dialog. Inheriting the outer
  // menu's container across the dialog hangs the inner menu in that
  // container - and the modal dialog marks everything outside its own
  // popup aria-hidden while it is open, so the inner menu would sit under
  // an aria-hidden subtree and disappear from assistive tech. The
  // inheritance ends at the dialog (PortalScope resets menu container
  // inheritance around every non-menu popup's children), so the inner menu
  // takes the popup step and lands in the dialog's own portal node, whose
  // chain carries no hidden marker.
  it('keeps a dropdown menu opened inside a dialog in the dialog portal node, out of the hidden outer menu subtree', async () => {
    const menuHost = createHost();
    const dialogHost = createHost();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={menuHost}>
          <Dialog defaultOpen>
            <DialogContent container={dialogHost}>
              <DialogTitle>Settings</DialogTitle>
              <DropdownMenu defaultOpen>
                <DropdownMenuTrigger>Inner open</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <span data-testid={PROBE_ID}>inner menu content</span>
                </DropdownMenuContent>
              </DropdownMenu>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    // Raw querySelector, not a role query: the modal dialog marks hosts
    // outside its popup aria-hidden, which hides them from the role
    // queries - the trap the inherited container used to walk into.
    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(menuHost)).toBeNull();
    // In the dialog's own portal node - the popup step - not loose in the
    // dialog container and not in the inherited menu container.
    const dialogPortalNode = dialogHost.querySelector('[data-base-ui-portal]');
    expect(dialogPortalNode).not.toBeNull();
    expect(dialogPortalNode).toContainElement(probe as HTMLElement);
    // The proof the fix is about: no ancestor of the inner menu popup
    // carries the modal dialog's hidden marker, up to and including
    // <body>.
    for (let node: Element | null = probe; node !== null; node = node.parentElement) {
      expect(node.getAttribute('aria-hidden')).not.toBe('true');
      expect(node.hasAttribute('inert')).toBe(false);
    }
    // The modal did its work outside: the outer menu's host is marked
    // aria-hidden while the dialog is open, so the inherited container
    // really was a hidden subtree.
    expect(menuHost.getAttribute('aria-hidden')).toBe('true');
  });

  // Same boundary for the second family: a context menu inside a modal
  // dialog inside a context menu content takes the popup step into the
  // dialog's portal node instead of inheriting the outer menu's container
  // into the dialog's aria-hidden subtree.
  //
  // The walk here stops at the dialog's portal node on purpose. Base UI's
  // context menu hides everything outside its own popup from assistive
  // tech while it is open, so the outer context menu marks the dialog's
  // whole host aria-hidden the moment it opens - recorded in the
  // reproduction for #765: the marker is already on the host before the
  // inner menu exists, with or without this fix, and lifts when the outer
  // menu closes. The dropdown variant above carries the full walk to
  // <body>, where that transient outer-menu marking does not apply.
  it('keeps a context menu opened inside a dialog in the dialog portal node, out of the hidden outer menu subtree', async () => {
    const menuHost = createHost();
    const dialogHost = createHost();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
        <ContextMenuContent container={menuHost}>
          <Dialog defaultOpen>
            <DialogContent container={dialogHost}>
              <DialogTitle>Settings</DialogTitle>
              <ContextMenu>
                <ContextMenuTrigger>Inner right-click area</ContextMenuTrigger>
                <ContextMenuContent>
                  <span data-testid={PROBE_ID}>inner context menu content</span>
                </ContextMenuContent>
              </ContextMenu>
            </DialogContent>
          </Dialog>
        </ContextMenuContent>
      </ContextMenu>,
    );
    // The outer menu first: nothing inside its content exists until it
    // opens. Exact text match, so 'Right-click area' cannot hit the inner
    // trigger's 'Inner right-click area'.
    fireEvent.contextMenu(screen.getByText('Right-click area'));
    fireEvent.contextMenu(screen.getByText('Inner right-click area'));

    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    // Not in the inherited container: the menu followed the dialog, whose
    // own portal node is the parent of the menu's portal node.
    const dialogPortalNode = dialogHost.querySelector('[data-base-ui-portal]');
    expect(dialogPortalNode).not.toBeNull();
    expect(dialogPortalNode).toContainElement(probe as HTMLElement);
    // The chain the fix controls, from the popup up through the dialog's
    // portal node, carries no hidden marker.
    for (
      let node: Element | null = probe;
      node !== null && node !== dialogPortalNode?.parentElement;
      node = node.parentElement
    ) {
      expect(node?.getAttribute('aria-hidden')).not.toBe('true');
      expect(node?.hasAttribute('inert')).toBe(false);
    }
    // The modal dialog did its work outside: the inherited container is
    // marked aria-hidden while the dialog is open, so on the old rule the
    // inner menu landed in a hidden subtree.
    expect(menuHost.getAttribute('aria-hidden')).toBe('true');
  });

  // #765, round two: the inheritance flag used to be one boolean shared by
  // both menu families, while each family keeps its own container context.
  // ContextMenuContent > Dialog > DropdownMenuContent > ContextMenuContent:
  // the dialog ends the inheritance for both families, but the dropdown
  // popup's PortalScope armed the shared flag again for everything below
  // it, and nothing between reset the context menu family's container - so
  // the inner context menu inherited the OUTER context menu's host, the
  // subtree the modal dialog marks aria-hidden. Each family now carries its
  // own token: the dropdown popup arms the dropdown family only, and the
  // context menu inside it follows the dropdown, whose portal node hangs
  // inside the dialog's.
  it('keeps a context menu opened inside a dropdown menu inside a dialog out of the hidden outer menu subtree', async () => {
    const menuHost = createHost();
    const dialogHost = createHost();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
        <ContextMenuContent container={menuHost}>
          <Dialog defaultOpen>
            <DialogContent container={dialogHost}>
              <DialogTitle>Settings</DialogTitle>
              <DropdownMenu defaultOpen>
                <DropdownMenuTrigger>Inner open</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <ContextMenu>
                    <ContextMenuTrigger>Inner right-click area</ContextMenuTrigger>
                    <ContextMenuContent>
                      <span data-testid={PROBE_ID}>innermost context menu content</span>
                    </ContextMenuContent>
                  </ContextMenu>
                </DropdownMenuContent>
              </DropdownMenu>
            </DialogContent>
          </Dialog>
        </ContextMenuContent>
      </ContextMenu>,
    );
    // The outer menu first: nothing inside its content exists until it
    // opens. Exact text matches keep the two triggers apart.
    fireEvent.contextMenu(screen.getByText('Right-click area'));
    const innerTrigger = await waitFor(() => screen.getByText('Inner right-click area'));
    fireEvent.contextMenu(innerTrigger);

    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(byProbe(menuHost)).toBeNull();
    // The inner menu's portal node hangs inside the dialog's own portal
    // node (through the dropdown's), never inside the outer context menu's
    // host.
    const dialogPortalNode = dialogHost.querySelector('[data-base-ui-portal]');
    expect(dialogPortalNode).not.toBeNull();
    const innerPortalNode = portalNodeOf(probe);
    expect(innerPortalNode).not.toBeNull();
    expect(menuHost.contains(innerPortalNode)).toBe(false);
    expect(dialogPortalNode).toContainElement(innerPortalNode as HTMLElement);
    // No hidden marker on the chain from the inner menu up to and including
    // the dialog's portal node. The walk stops there on purpose: the outer
    // context menu marks the dialog's whole host aria-hidden the moment it
    // opens (recorded in the round one reproduction), so nodes above the
    // dialog's portal node are outside this fix's control.
    for (
      let node: Element | null = probe;
      node !== null && node !== dialogPortalNode?.parentElement;
      node = node.parentElement
    ) {
      expect(node?.getAttribute('aria-hidden')).not.toBe('true');
      expect(node?.hasAttribute('inert')).toBe(false);
    }
    // The trap the shared boolean walked into: the outer menu's host is
    // marked aria-hidden while the dialog is open, so the inherited
    // container really was a hidden subtree.
    expect(menuHost.getAttribute('aria-hidden')).toBe('true');
  });

  // The shared-boolean bug without a dialog in between:
  // DropdownMenuContent A > ContextMenuContent B > DropdownMenuContent C.
  // B's popup armed the shared flag, and B provides no dropdown container
  // context, so C read A's resolved container across B's popup boundary and
  // skipped the popup step into B's portal node. With the family tokens, C
  // reads B's context menu token, does not inherit, and lands in B's own
  // portal node.
  it('keeps a dropdown menu opened inside a context menu inside a dropdown menu in the inner context menu portal node', async () => {
    const menuHost = createHost();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={menuHost}>
          <ContextMenu>
            <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
            <ContextMenuContent>
              <DropdownMenu defaultOpen>
                <DropdownMenuTrigger>Inner open</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <span data-testid={PROBE_ID}>inner dropdown content</span>
                </DropdownMenuContent>
              </DropdownMenu>
            </ContextMenuContent>
          </ContextMenu>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.contextMenu(screen.getByText('Right-click area'));

    const probe = await waitFor(() => {
      const el = document.querySelector(`[data-testid="${PROBE_ID}"]`);
      expect(el).not.toBeNull();
      return el as Element;
    });
    const innerPortalNode = portalNodeOf(probe);
    expect(innerPortalNode).not.toBeNull();
    // Raw text query, not a role query: with the inner dropdown open, Base
    // UI can mark the enclosing context menu popup aria-hidden. The trigger
    // text sits inside the context menu's popup, so its portal node is the
    // context menu's own.
    const ctxPortalNode = portalNodeOf(getByText(document.body, 'Inner open'));
    expect(ctxPortalNode).not.toBeNull();
    // The inner dropdown's portal node hangs directly under the context
    // menu's portal node - the popup step into the menu it opened inside -
    // not directly in the container the outer dropdown content resolved.
    // The probe is a DOM descendant of that container either way: what
    // changed is one level, the one the shared boolean let the inheritance
    // skip.
    expect(innerPortalNode?.parentElement).toBe(ctxPortalNode);
    expect(innerPortalNode?.parentElement).not.toBe(menuHost);
    expect(menuHost.contains(innerPortalNode)).toBe(true);
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
  //
  // The press is the full synchronous pointer sequence plus a tick, not a
  // bare click: Base UI's dismissal hook decides on the `click` event and
  // suppresses it when the press began inside the popup (tracked across the
  // pointer/mouse down-up run), and its bookkeeping timers only run between
  // macrotasks - a synchronous fireEvent.click alone can pass through an
  // exit transition that the real sequence survives. The open state is
  // asserted through onOpenChange (never called with false) and the popup's
  // data-open attribute, not through the dialog's mere presence: the popup
  // node outlives a close during its exit transition, which is exactly what
  // made the old synchronous [role="dialog"] check vacuous.
  it('keeps a dialog popup inside the shadow root and open on a field press', async () => {
    const host = createHost();
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    const portalHost = document.createElement('div');
    shadowRoot.appendChild(portalHost);
    const onOpenChange = vi.fn();

    render(
      <PortalContainerProvider value={portalHost}>
        <Dialog defaultOpen onOpenChange={onOpenChange}>
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
    press(field as HTMLElement);
    await tick();

    expect(
      onOpenChange.mock.calls.some(([open]) => open === false),
      'the dialog must not treat a press on its own field as an outside press',
    ).toBe(false);
    expect(popup.getAttribute('data-open')).toBe('');
  });

  // Negative control for the test above: the same press sequence on the
  // modal backdrop - the only surface outside the popup whose press the
  // modal Dialog honors (a press on any other element outside the shadow
  // root is ignored, so there is no closer "outside" to press) - must close
  // it. Without this, the sibling test cannot distinguish "dismissal works
  // and our press survived it" from "this press sequence can never dismiss
  // anything".
  it('closes the dialog when the same press sequence lands on the backdrop', async () => {
    const host = createHost();
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    const portalHost = document.createElement('div');
    shadowRoot.appendChild(portalHost);
    const onOpenChange = vi.fn();

    render(
      <PortalContainerProvider value={portalHost}>
        <Dialog defaultOpen onOpenChange={onOpenChange}>
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

    const backdrop = portalHost.querySelector(`.${dialogStyles.backdrop}`);
    expect(backdrop, 'the dialog must render its modal backdrop').not.toBeNull();
    press(backdrop as HTMLElement);
    await tick();

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(popup.getAttribute('data-open')).toBeNull();
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

  // DrawerPortal is public and takes children of its own, so what a caller
  // composes directly into it rides in the drawer's portal without ever
  // passing through DrawerContent. It is armed like DrawerContent's popup
  // children are: an overlay composed directly into the portal lands in the
  // drawer's own portal node (the popup step), not loose in the provider
  // container the unscoped portal would answer.
  it('keeps a popover composed directly into DrawerPortal in the drawer portal node', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Drawer defaultOpen>
          <DrawerPortal>
            <Popover defaultOpen>
              <PopoverContent>
                <span data-testid={PROBE_ID}>popover content</span>
              </PopoverContent>
            </Popover>
          </DrawerPortal>
          <DrawerContent>
            <DrawerTitle>Panel</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(providerHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    // The popover's portal node hangs one level down, inside the drawer's
    // portal node - its parent is the Base UI portal node DrawerPortal
    // created directly in the provider container, not the provider
    // container itself (which is where an unscoped DrawerPortal sends it).
    const popoverPortalNode = portalNodeOf(probe);
    expect(popoverPortalNode).not.toBeNull();
    expect(popoverPortalNode?.parentElement).not.toBe(providerHost);
    const drawerPortalNode = popoverPortalNode?.parentElement ?? null;
    expect(drawerPortalNode?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(drawerPortalNode?.parentElement).toBe(providerHost);
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
  // <body> may catch it meanwhile. The null assertions run on the initial
  // render, so the positive control below is a fresh mount: the same tree
  // with a real container rendered from scratch still mounts the popup
  // under one empty flush, proving the null assertions describe a
  // held-back popup, not one that has simply not mounted yet.
  it('lets an explicit container={null} hold a dialog popup back under a provider', async () => {
    const providerHost = createHost();
    const lateHost = createHost();
    const tree = (container: PortalContainer) => (
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent container={container}>
            <DialogTitle>Settings</DialogTitle>
            <span data-testid={PROBE_ID}>dialog content</span>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>
    );
    const { rerender, unmount } = render(tree(null));

    await act(async () => {});
    expect(byProbe(providerHost)).toBeNull();
    expect(byProbe(document.body)).toBeNull();
    rerender(tree(lateHost));
    await act(async () => {});
    expect(byProbe(lateHost)).not.toBeNull();

    // Fresh mount, not the rerender above: the initial render is the path
    // the null assertions run on.
    unmount();
    const freshHost = createHost();
    render(tree(freshHost));
    await act(async () => {});
    expect(byProbe(freshHost)).not.toBeNull();
  });

  // Same hold for a menu, whose `container ?? inheritedContainer` shorthand
  // used to swallow the explicit null into the inherited (here: unset)
  // value and so handed the popup to the provider. The fresh-mount control
  // below is the same positive control as the dialog test above: the same
  // tree rendered from scratch with a real container mounts the popup under
  // one empty flush, so the null assertions prove a held-back popup, not an
  // unmounted one.
  it('lets an explicit container={null} hold a dropdown menu popup back under a provider', async () => {
    const providerHost = createHost();
    const lateHost = createHost();
    const tree = (container: PortalContainer) => (
      <PortalContainerProvider value={providerHost}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={container}>
            <span data-testid={PROBE_ID}>menu content</span>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalContainerProvider>
    );
    const { rerender, unmount } = render(tree(null));

    await act(async () => {});
    expect(byProbe(providerHost)).toBeNull();
    expect(byProbe(document.body)).toBeNull();
    rerender(tree(lateHost));
    await act(async () => {});
    expect(byProbe(lateHost)).not.toBeNull();

    // Fresh mount, not the rerender above: the initial render is the path
    // the null assertions run on.
    unmount();
    const freshHost = createHost();
    render(tree(freshHost));
    await act(async () => {});
    expect(byProbe(freshHost)).not.toBeNull();
  });

  // Same hold with no provider anywhere: the menus' old
  // `container ?? inheritedContainer` shorthand swallowed an explicit null
  // into the inherited (here: unset) value and handed the popup to Base UI's
  // <body> default. The fresh-mount positive control below is the same one
  // the null tests above use: the same tree rendered from scratch with a
  // real container mounts the popup under one empty flush, so the null
  // assertion proves a held-back popup, not an unmounted one.
  it('lets an explicit container={null} hold a dropdown menu popup back with no provider at all', async () => {
    const lateHost = createHost();
    const tree = (container: PortalContainer) => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={container}>
          <span data-testid={PROBE_ID}>menu content</span>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const { rerender, unmount } = render(tree(null));

    await act(async () => {});
    expect(byProbe(document.body)).toBeNull();
    rerender(tree(lateHost));
    await act(async () => {});
    expect(byProbe(lateHost)).not.toBeNull();

    // Fresh mount, not the rerender above: the initial render is the path
    // the null assertions run on.
    unmount();
    const freshHost = createHost();
    render(tree(freshHost));
    await act(async () => {});
    expect(byProbe(freshHost)).not.toBeNull();
  });

  // The context menu's own MenuContainerContext had the same shorthand, so
  // the same explicit null held its popup back only from 0.6.0 on.
  it('lets an explicit container={null} hold a context menu popup back with no provider at all', async () => {
    const lateHost = createHost();
    const tree = (container: PortalContainer) => (
      <ContextMenu>
        <ContextMenuTrigger>Right-click area</ContextMenuTrigger>
        <ContextMenuContent container={container}>
          <span data-testid={PROBE_ID}>context menu content</span>
        </ContextMenuContent>
      </ContextMenu>
    );
    const { rerender, unmount } = render(tree(null));
    fireEvent.contextMenu(getByText(document.body, 'Right-click area'));

    await act(async () => {});
    expect(byProbe(document.body)).toBeNull();
    rerender(tree(lateHost));
    await act(async () => {});
    expect(byProbe(lateHost)).not.toBeNull();

    // Fresh mount, not the rerender above: the initial render is the path
    // the null assertions run on.
    unmount();
    const freshHost = createHost();
    render(tree(freshHost));
    fireEvent.contextMenu(getByText(document.body, 'Right-click area'));
    await act(async () => {});
    expect(byProbe(freshHost)).not.toBeNull();
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

  // A provider ref that is still empty when an always-mounted portal first
  // commits: the host div fills hostRef in the same commit that mounts the
  // Toaster inside it, and Base UI reads `ref.current` only when the
  // container identity changes, so a ref handed straight through sends the
  // toast viewport to <body> for good.
  it('portals a toaster into an ancestor ref host that fills in the same commit', async () => {
    const manager = createToastManager();
    function Screen() {
      const hostRef = useRef<HTMLDivElement>(null);
      return (
        <PortalContainerProvider value={hostRef}>
          <div data-testid="ref-host" ref={hostRef}>
            <Toaster toastManager={manager} />
          </div>
        </PortalContainerProvider>
      );
    }
    render(<Screen />);

    act(() => {
      manager.add({ title: 'Export finished' });
    });

    const toast = await waitFor(() => screen.getByText('Export finished'));
    expect(screen.getByTestId('ref-host').contains(toast)).toBe(true);
  });

  // A provider ref whose host the owner mounts only later: an overlay open
  // while the ref is empty follows Base UI's own fallback, <body> with no
  // enclosing popup, and the owner's re-render that mounts the host hands
  // the provider new children, so it re-reads the ref and the open portal
  // moves into the host.
  it('lets a dialog opened while the provider ref is empty fall back to <body>, then moves it into the host the owner mounts', async () => {
    function Screen() {
      const hostRef = useRef<HTMLDivElement>(null);
      const [hostShown, setHostShown] = useState(false);
      return (
        <PortalContainerProvider value={hostRef}>
          <button type="button" onClick={() => setHostShown(true)}>
            Show host
          </button>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <span data-testid={PROBE_ID}>dialog content</span>
            </DialogContent>
          </Dialog>
          {hostShown ? <div data-testid="ref-host" ref={hostRef} /> : null}
        </PortalContainerProvider>
      );
    }
    render(<Screen />);

    await waitFor(() => expect(byProbe(document.body)).not.toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Show host', hidden: true }));

    await waitFor(() => expect(byProbe(screen.getByTestId('ref-host'))).not.toBeNull());
  });

  // A descendant that mounts the host through its own state never re-renders
  // the provider: the overlay's portal reads the provider's forwarding ref
  // itself when it mounts, so a popover opened once the host is there lands
  // in it.
  it('portals a popover opened after a descendant mounts the provider ref host', async () => {
    function Layout({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
      const [loaded, setLoaded] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setLoaded(true)}>
            Load
          </button>
          {loaded ? <div data-testid="ref-host" ref={hostRef} /> : null}
        </>
      );
    }
    function Screen() {
      const hostRef = useRef<HTMLDivElement>(null);
      return (
        <PortalContainerProvider value={hostRef}>
          <Layout hostRef={hostRef} />
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>
              <Probe />
            </PopoverContent>
          </Popover>
        </PortalContainerProvider>
      );
    }
    render(<Screen />);

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(byProbe(screen.getByTestId('ref-host'))).not.toBeNull());
  });

  // A descendant that swaps the host for another leaves any earlier read
  // pointing at a detached node: an overlay opened afterwards follows the
  // current host.
  it('portals a popover opened after a descendant swaps the provider ref host into the new host', async () => {
    function Layout({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
      const [host, setHost] = useState<'first' | 'second'>('first');
      return (
        <>
          <button type="button" onClick={() => setHost('second')}>
            Swap
          </button>
          <div key={host} data-testid={`${host}-host`} ref={hostRef} />
        </>
      );
    }
    function Screen() {
      const hostRef = useRef<HTMLDivElement>(null);
      return (
        <PortalContainerProvider value={hostRef}>
          <Layout hostRef={hostRef} />
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>
              <Probe />
            </PopoverContent>
          </Popover>
        </PortalContainerProvider>
      );
    }
    render(<Screen />);
    const firstHost = screen.getByTestId('first-host');

    fireEvent.click(screen.getByRole('button', { name: 'Swap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(byProbe(screen.getByTestId('second-host'))).not.toBeNull());
    expect(byProbe(firstHost)).toBeNull();
  });

  // Two refs holding the same element are the same target: swapping the
  // provider value from one to the other while a dialog is open keeps the
  // popup mounted, with what the user typed into it.
  it('keeps an open dialog mounted when the provider value changes to another ref holding the same host', async () => {
    const host = createHost();
    const refA: PortalContainer = { current: host };
    const refB: PortalContainer = { current: host };
    function Screen({ value }: { value: PortalContainer }) {
      return (
        <PortalContainerProvider value={value}>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <input aria-label="Name" />
            </DialogContent>
          </Dialog>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen value={refA} />);
    const input = await waitFor(() => getByRole(host, 'textbox', { name: 'Name' }));
    fireEvent.change(input, { target: { value: 'Ada' } });

    rerender(<Screen value={refB} />);
    await act(async () => {});

    expect(Object.is(getByRole(host, 'textbox', { name: 'Name' }), input)).toBe(true);
    expect(input).toHaveProperty('value', 'Ada');
  });

  // An element and a ref holding it are the same target: the first render
  // with the ref already hands down a forwarder that reads it, so the open
  // popup never resolves an empty container and stays mounted.
  it('keeps an open dialog mounted when the provider value changes from an element to a ref holding it', async () => {
    const host = createHost();
    const hostRef: PortalContainer = { current: host };
    function Screen({ value }: { value: PortalContainer }) {
      return (
        <PortalContainerProvider value={value}>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <input aria-label="Name" />
            </DialogContent>
          </Dialog>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen value={host} />);
    const input = await waitFor(() => getByRole(host, 'textbox', { name: 'Name' }));
    fireEvent.change(input, { target: { value: 'Ada' } });

    rerender(<Screen value={hostRef} />);
    await act(async () => {});

    expect(Object.is(getByRole(host, 'textbox', { name: 'Name' }), input)).toBe(true);
    expect(input).toHaveProperty('value', 'Ada');
  });

  // The reverse swap: a ref value replaced by the element it holds keeps the
  // open popup mounted with what the user typed.
  it('keeps an open dialog mounted when the provider value changes from a ref to the element it holds', async () => {
    const host = createHost();
    const hostRef: PortalContainer = { current: host };
    function Screen({ value }: { value: PortalContainer }) {
      return (
        <PortalContainerProvider value={value}>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <input aria-label="Name" />
            </DialogContent>
          </Dialog>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen value={hostRef} />);
    const input = await waitFor(() => getByRole(host, 'textbox', { name: 'Name' }));
    fireEvent.change(input, { target: { value: 'Ada' } });

    rerender(<Screen value={host} />);
    await act(async () => {});

    expect(Object.is(getByRole(host, 'textbox', { name: 'Name' }), input)).toBe(true);
    expect(input).toHaveProperty('value', 'Ada');
  });

  // The host keeps its node but moves to another ref in the same update
  // that mounts a Toaster: React detaches the old ref before the Toaster's
  // portal reads the forwarder, so that first read is empty. The new ref
  // alone has to give the forwarder a new identity, or the toast viewport
  // stays on <body> although its host exists.
  it('portals a toaster mounted while the host moves to another ref into that host', async () => {
    const manager = createToastManager();
    function Screen({ useB, withToaster }: { useB: boolean; withToaster: boolean }) {
      const refA = useRef<HTMLDivElement>(null);
      const refB = useRef<HTMLDivElement>(null);
      const hostRef = useB ? refB : refA;
      return (
        <PortalContainerProvider value={hostRef}>
          <div data-testid="moving-host" ref={hostRef}>
            {withToaster ? <Toaster toastManager={manager} /> : null}
          </div>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen useB={false} withToaster={false} />);
    rerender(<Screen useB withToaster />);

    act(() => {
      manager.add({ title: 'Saved' });
    });

    const toast = await waitFor(() => screen.getByText('Saved'));
    expect(screen.getByTestId('moving-host').contains(toast)).toBe(true);
  });

  // An inline `{ current: el }` is a new ref on every owner render; the open
  // popup stays mounted through those renders.
  it('keeps an open dialog mounted while the owner re-renders an inline ref value', async () => {
    const host = createHost();
    function Screen({ title }: { title: string }) {
      return (
        <PortalContainerProvider value={{ current: host }}>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>{title}</DialogTitle>
              <input aria-label="Name" />
            </DialogContent>
          </Dialog>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen title="Settings" />);
    const input = await waitFor(() => getByRole(host, 'textbox', { name: 'Name' }));
    fireEvent.change(input, { target: { value: 'Ada' } });

    rerender(<Screen title="Profile" />);
    await act(async () => {});

    expect(getByText(host, 'Profile')).not.toBeNull();
    expect(Object.is(getByRole(host, 'textbox', { name: 'Name' }), input)).toBe(true);
    expect(input).toHaveProperty('value', 'Ada');
  });

  // A defaultOpen dialog inside the host its provider ref points to: its
  // portal's first read comes before React attaches the host's ref, the
  // provider's read then moves it into the host, and later owner renders
  // keep it mounted there with what the user typed.
  it('portals a defaultOpen dialog into an ancestor ref host and keeps its state across owner renders', async () => {
    function Screen({ title }: { title: string }) {
      const hostRef = useRef<HTMLDivElement>(null);
      return (
        <PortalContainerProvider value={hostRef}>
          <div data-testid="ref-host" ref={hostRef}>
            <Dialog defaultOpen>
              <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <input aria-label="Name" />
              </DialogContent>
            </Dialog>
          </div>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Screen title="Settings" />);
    const host = screen.getByTestId('ref-host');
    const input = await waitFor(() => getByRole(host, 'textbox', { name: 'Name' }));
    fireEvent.change(input, { target: { value: 'Ada' } });

    rerender(<Screen title="Profile" />);
    await act(async () => {});

    expect(getByText(host, 'Profile')).not.toBeNull();
    expect(Object.is(getByRole(host, 'textbox', { name: 'Name' }), input)).toBe(true);
    expect(input).toHaveProperty('value', 'Ada');
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

  // Step one outranks the popup scope: an explicit `container` on an overlay
  // inside a kit popup is that overlay's own decision, so the scope defers
  // only overlays that carry no container of their own.
  it('lets an explicit select container win inside a dialog popup', async () => {
    const providerHost = createHost();
    const selectHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
            <Select items={[{ value: 'eu', label: 'Europe' }]} defaultOpen>
              <SelectTrigger aria-label="Region">
                <SelectValue placeholder="Pick a region" />
              </SelectTrigger>
              <SelectContent container={selectHost}>
                <SelectItem value="eu">Europe</SelectItem>
                <span data-testid={PROBE_ID}>select popup content</span>
              </SelectContent>
            </Select>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );

    // Raw querySelector, not getByRole: the modal dialog marks hosts outside
    // its popup aria-hidden, which hides them from the role queries.
    await waitFor(() => expect(byProbe(selectHost)).not.toBeNull());
    const dialogPortalNode = portalNodeOf(getByRole(providerHost, 'dialog'));
    expect(dialogPortalNode?.querySelector(`[data-testid="${PROBE_ID}"]`)).toBeNull();
  });

  /*
   * Tooltip, HoverCard and Toast portal through Base UI's FloatingPortalLite,
   * which provides no PortalContext: there is no parent portal node inside
   * them for a nested overlay to fall back to, so they neither arm nor reset
   * the popup scope, and an overlay opened inside one follows whatever
   * encloses it: provider-then-body here, where no arming popup encloses it
   * (armed, the scope would answer undefined and send the nested overlay to
   * <body>, outside a shadow-root provider).
   */
  it('keeps a popover inside a hover card popup in the provider container', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <HoverCard defaultOpen>
          <HoverCardContent>
            <span data-testid="hover-card-body">Hover card body</span>
            <Popover defaultOpen>
              <PopoverContent>
                <span data-testid={PROBE_ID}>popover content</span>
              </PopoverContent>
            </Popover>
          </HoverCardContent>
        </HoverCard>
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(document.body);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(providerHost.querySelector('[data-testid="hover-card-body"]')).not.toBeNull();
    expect(providerHost.contains(probe)).toBe(true);
  });

  it('keeps a popover inside a tooltip popup in the provider container', async () => {
    const providerHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>
            <span data-testid="tooltip-body">Tooltip body</span>
            <Popover defaultOpen>
              <PopoverContent>
                <span data-testid={PROBE_ID}>popover content</span>
              </PopoverContent>
            </Popover>
          </TooltipContent>
        </Tooltip>
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(document.body);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(providerHost.querySelector('[data-testid="tooltip-body"]')).not.toBeNull();
    expect(providerHost.contains(probe)).toBe(true);
  });

  // A toast card is composed imperatively, so the nested overlay rides in
  // through the toast object's actionProps children (title and description
  // would carry it the same way - all three take React nodes).
  it('keeps a popover in a toast action in the provider container', async () => {
    const providerHost = createHost();
    const manager = createToastManager();
    render(
      <PortalContainerProvider value={providerHost}>
        <Toaster toastManager={manager} />
      </PortalContainerProvider>,
    );
    act(() => {
      manager.add({
        title: 'Export finished',
        actionProps: {
          children: (
            <Popover defaultOpen>
              <PopoverContent>
                <span data-testid={PROBE_ID}>popover content</span>
              </PopoverContent>
            </Popover>
          ),
        },
      });
    });

    const probe = await waitFor(() => {
      const el = byProbe(document.body);
      expect(el).not.toBeNull();
      return el as Element;
    });
    expect(getByText(providerHost, 'Export finished')).not.toBeNull();
    expect(providerHost.contains(probe)).toBe(true);
  });

  // A Tooltip does not reset the popup scope: a popover nested in a tooltip
  // that sits inside an open dialog still sees the dialog's scope from below
  // the tooltip, so it stays in the dialog's portal node instead of falling
  // through to the provider. HoverCard and Toast share the same shape - they
  // wrap nothing of their own either, and the tests above already prove they
  // do not arm the scope - so this one covers the not-resetting side. The
  // dialog carries its own container here, so "not the provider" is
  // observable as an empty provider host.
  it('keeps a popover nested in a tooltip inside a dialog in the dialog portal node', async () => {
    const providerHost = createHost();
    const dialogHost = createHost();
    render(
      <PortalContainerProvider value={providerHost}>
        <Dialog defaultOpen>
          <DialogContent container={dialogHost}>
            <DialogTitle>Settings</DialogTitle>
            <Tooltip defaultOpen>
              <TooltipTrigger>Hover me</TooltipTrigger>
              <TooltipContent>
                <span data-testid="tooltip-body">Tooltip body</span>
                <Popover defaultOpen>
                  <PopoverContent>
                    <span data-testid={PROBE_ID}>popover content</span>
                  </PopoverContent>
                </Popover>
              </TooltipContent>
            </Tooltip>
          </DialogContent>
        </Dialog>
      </PortalContainerProvider>,
    );

    const probe = await waitFor(() => {
      const el = byProbe(dialogHost);
      expect(el).not.toBeNull();
      return el as Element;
    });
    // Named query: the nested popover's popup carries the dialog role too.
    const dialogPortalNode = portalNodeOf(getByRole(dialogHost, 'dialog', { name: 'Settings' }));
    expect(dialogPortalNode?.contains(probe)).toBe(true);
    expect(byProbe(providerHost)).toBeNull();
  });
});
