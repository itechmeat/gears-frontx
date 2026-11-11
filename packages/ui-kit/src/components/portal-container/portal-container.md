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
   waits for a target instead of falling through - a behaviour menus
   gained in 0.6.0: before, an explicit null on menu content fell through
   to the container an enclosing menu content resolved, or to `<body>`),
2. Base UI's parent portal, when the overlay renders, at any depth, inside
   a kit popup that gives Base UI one, so a nested overlay stays in the
   popup that opened it. A popup arms this step by wrapping its popup
   children in `PortalScope`, with no `PortalContainerProvider` in
   between: the arming overlays are Dialog, AlertDialog, Sheet, Drawer,
   Popover, Select, Combobox and the menus (DropdownMenu, ContextMenu,
   Menubar, submenus included), and DrawerPortal - the one Portal part the
   kit publishes - arms it the same way for overlays composed directly
   into it, beside the panel. A `PortalContainerProvider` nested inside
   a popup resets the step, so that provider wins again for the overlays
   below it - menu content keeps the inheritance described below,
3. the nearest `PortalContainerProvider`'s value,
4. Base UI's own default, `<body>`.

Menus add one step in front: a menu content rendered inside another menu
content of its own family (a submenu, or a menu opened directly inside
such a menu) first inherits the container that enclosing menu content
resolved (`DropdownMenuContent` hands the container it resolved to every
`DropdownMenuContent` below it, so a theme passed to the first-level popup
holds in its submenus). DropdownMenu and Menubar form one family,
ContextMenu is its own: a ContextMenu content inside a DropdownMenu or
Menubar content, or the other way round, inherits nothing and follows the
order above. That inheritance outranks a nearer `PortalContainerProvider`
and the popup step, and crosses menu popups only: another kit popup that
arms the popup scope between the two menu contents (Dialog, AlertDialog,
Sheet, Drawer, Popover, Select, Combobox, DrawerPortal) ends it, so a menu
inside one of those takes the popup step instead and lands in the
intervening popup's own portal node. The boundary keeps the inner menu
reachable: a modal Dialog marks everything outside its own popup
`aria-hidden` while it is open, so a container inherited across it would
hang the inner menu in a hidden subtree; what the inheritance leaves unset
follows the order above.

Tooltip, HoverCard and Toast neither arm nor reset the popup scope: an
overlay nested inside one of them follows whatever encloses that Tooltip,
HoverCard or Toast - step two when a popup that arms the scope encloses it
(at any depth), steps three and four when none does. One known limit: the
NavigationMenu wraps its viewport in `PortalScope`, but no consumer content
renders under it, because `NavigationMenuContent` arrives through a raw
`createPortal` into the viewport, outside that popup's React subtree. The
NavigationMenu therefore arms nothing for consumer overlays: overlays
inside `NavigationMenuContent` see the popup step only from popups
enclosing the whole NavigationMenu, and otherwise follow steps three and
four.

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

Read the value to portal something the kit does not own the same way. The
two unset shapes stay distinct: with no provider above the caller the
value is `undefined` and the example falls back to `<body>`, the same
default the overlays use; an explicit `null` is a set value whose target
is not there yet, so the popup waits instead - no popup until the target
exists, never `<body>`:

```tsx
import { createPortal } from 'react-dom';

import { usePortalContainer } from '@gears-frontx/ui-kit';

function ExternalPopup({ children }: { children: React.ReactNode }) {
  const container = usePortalContainer();
  if (container === undefined) {
    return createPortal(children, document.body);
  }
  const target = container === null ? null : 'current' in container ? container.current : container;
  return target === null ? null : createPortal(children, target);
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
