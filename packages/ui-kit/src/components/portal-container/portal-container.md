# PortalContainer

The default portal container for every kit overlay, provided as React
context. Renders no DOM element of its own (a bare
`React.Context.Provider`); it exists so an application sets where popups
portal once per subtree instead of passing `container` to each overlay
individually.

Every kit overlay that portals a popup reads it: `AlertDialogContent`,
`ComboboxContent`, `ContextMenuContent` (and its submenus), `DialogContent`,
`DrawerContent`/`DrawerPortal`, `DropdownMenuContent` (and its submenus),
`HoverCardContent`, `MenubarContent` (through `DropdownMenuContent`),
`NavigationMenu`, `PopoverContent`, `SelectContent`, `SheetContent`,
`Toaster`, `TooltipContent`, and the DataGrid's popups when its own
`portalContainer` prop is unset. Each one resolves its target in the same
order:

1. the overlay's own `container` prop, when the caller passed one (an
   explicit `null` counts: the caller set it on purpose, and Base UI then
   waits for a target instead of falling through),
2. Base UI's parent portal, when the overlay renders, at any depth, inside
   a kit popup that gives Base UI one, so a nested overlay stays in the
   popup that opened it. A popup arms this step by wrapping its popup
   children in `PortalScope`, with no `PortalContainerProvider` in
   between: the arming overlays are Dialog, AlertDialog, Sheet, Drawer,
   Popover, Select, Combobox, the menus (DropdownMenu, ContextMenu,
   Menubar, submenus included) and the NavigationMenu viewport. A
   `PortalContainerProvider` nested inside a popup resets the step, so
   that provider wins again for the overlays below it,
3. the nearest `PortalContainerProvider`'s value,
4. Base UI's own default, `<body>`.

Menus add one step in front: a submenu first inherits the container its
parent menu content resolved (`DropdownMenuContent` hands the container it
resolved to every `DropdownMenuSubContent` below it, so a theme passed to
the first-level popup holds in its submenus), then follows the order
above.

Tooltip, HoverCard and Toast neither arm nor reset the popup scope: an
overlay nested inside one of them follows whatever encloses that Tooltip,
HoverCard or Toast - step two when a popup that arms the scope encloses it
(at any depth), steps three and four when none does. One known limit:
`NavigationMenuContent` mounts through a raw `createPortal` into the
viewport, outside the popup's React subtree, so overlays inside
`NavigationMenuContent` see the popup step only from popups enclosing the
whole NavigationMenu - they skip the NavigationMenu's own viewport scope,
and otherwise follow steps three and four.

`usePortalContainer()` returns the provided value, or `undefined` with no
provider above the caller - also inside popups, where it ignores the
popup scope - so app code can hand the same target to a non-kit portal.

## When to use

- A micro-frontend screen rendered inside a shadow root: the kit's styles
  are delivered into that shadow root, so every popup must portal inside
  it. Wrap the screen in `PortalContainerProvider` with a node inside the
  shadow root, or its popups land on `<body>` outside the shadow root -
  unstyled, in normal flow at the bottom of the page, and closed by an
  outside press when a field inside them is clicked.
- A theme scoped to a subtree (`data-theme` on a container that is not
  `<html>`/`<body>`): one provider hands every popup below it that
  subtree, instead of a `container` prop per overlay.

## Props

| Prop | Type | Default |
|------|------|---------|
| `value` | `PortalContainer` - the same union the overlays' `container` props take: an `HTMLElement`, a `ShadowRoot`, a ref to either, or `null` | - |
| `children` | `ReactNode` | - |

## Examples

Wrap a subtree so every kit overlay below it portals into a node the
application chooses:

```tsx
import { Dialog, DialogContent, DialogTitle, PortalContainerProvider } from '@gears-frontx/ui-kit';

function Screen({ portalHost }: { portalHost: HTMLElement }) {
  return (
    <PortalContainerProvider value={portalHost}>
      <Dialog>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
        </DialogContent>
      </Dialog>
    </PortalContainerProvider>
  );
}
```

Read the value to portal something the kit does not own the same way:

```tsx
import { createPortal } from 'react-dom';

import { usePortalContainer } from '@gears-frontx/ui-kit';

function ExternalPopup({ children }: { children: React.ReactNode }) {
  const container = usePortalContainer();
  const target = container && 'current' in container ? container.current : container;
  return createPortal(children, target ?? document.body);
}
```

## Anti-patterns

- Do not pass `container` on an overlay that a provider already covers with
  the same node - the prop wins over the provider, so the two stay in sync
  only while one of them is unset; prefer the provider alone.
- Do not mount the provider with a node outside the shadow root the
  screen's styles are delivered to - a popup there is no better placed than
  one on `<body>`.
- Do not read `usePortalContainer()` above the provider: with no provider
  above the caller it returns `undefined`, and the fallback it hands to a
  non-kit portal is `<body>`, the same default the overlays fall back to.
