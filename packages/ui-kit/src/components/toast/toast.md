# Toast

A brief, transient notification stacked bottom-right of the viewport.
Wraps Base UI's Toast primitives (`@base-ui/react/toast`), not sonner —
sonner would pull in `sonner` + `next-themes` as extra runtime
dependencies, breaking the kit's "behavior from Base UI, no extra deps"
architecture for one component. Unlike `Dialog`/`DropdownMenu`/
`Tooltip`, a toast isn't composed as JSX at the call site — it's fired
imperatively from anywhere in the app, the same call-anywhere ergonomics
sonner is known for, kept here through Base UI's own manager object
instead. Mount `Toaster` once, then call `toast.add({ ... })` to show
one.

Composition: mount `Toaster` once — internally it wraps Base UI's
Toast provider, portal, and viewport, and renders whatever toasts the
manager holds using the kit's own card layout (title, description,
type icon, optional action, close button); none of those internal
parts are exported. Call the shared `toast` manager's
`add`/`close`/`update`/`promise` to control what's shown; no manual
composition of individual toast parts.

## When to use

- Brief, non-blocking feedback about the result of an action the user
  just took (saved, uploaded, undo available) that doesn't need to
  interrupt them.

## When not to use

- Content the user must read or decide on before continuing — use
  `dialog`.
- A persistent status that should stay visible until explicitly
  dismissed by something other than a timeout or swipe — a toast times
  out automatically by design.
- Essential information with no other channel — a toast can be missed
  (auto-dismiss, easy to swipe away) and isn't a substitute for inline
  validation or page content.

## Props (kit level)

`Toaster`: `timeout` (ms before a toast auto-dismisses, `0` disables it,
default `5000`), `limit` (max toasts shown at once, default `3`;
overflow toasts stay mounted with `data-limited` rather than being
removed, so they can reappear as space frees up), `toastManager`
(defaults to the shared `toast` manager below), `container` (DOM node to
portal the toast viewport into; default: where the kit overlay order puts
it (see PortalContainer): outside kit popups that arm the popup scope,
that is the nearest `PortalContainerProvider`'s value, or `<body>` when
there is none), `closeLabel`
(accessible name for each toast's close (X) button, default
`'Close toast'`), `label` (accessible name for the toast region landmark,
default `'Notifications'`) — `closeLabel` and `label` are the two strings
a non-English app needs to replace, `children` — wrap the
app (or at least any subtree calling `useToastManager`) so it can reach
the manager via context; the toast viewport itself always portals
regardless of where `Toaster` sits in the tree.

`toast` — the shared manager. Call from anywhere, no hook or ancestor
required:

| Method | Use |
|--------|-----|
| `toast.add({ title, description?, type?, timeout?, actionProps? })` | Show a toast; returns its `id`. |
| `toast.close(id?)` | Dismiss one toast, or every toast if `id` is omitted. |
| `toast.update(id, { ... })` | Update a toast in place and refresh its timer. |
| `toast.promise(promise, { loading, success, error })` | One toast that morphs through loading → success/error. |

`type` drives the built-in icon: `success` \| `info` \| `warning` \|
`error` \| `loading` (spins, 4x slower under `prefers-reduced-motion:
reduce` rather than stopping — it's the only cue a `loading` toast is
still pending); omit it for no icon. `actionProps` (native
`<button>` props, e.g. `{ children: 'Undo', onClick }`) renders an
outline action button beside the close button; omit it and none
renders.

The card's own motion — the stacking/scale math, expand-on-hover, and
entry/exit/swipe slides — is suppressed under `prefers-reduced-motion:
reduce`; toasts snap straight to position instead of sliding or
resizing. Their opacity fades keep playing regardless — a fade isn't
motion in the sense the OS preference is asking to reduce.

`createToastManager()` / `useToastManager()` are re-exported for
advanced cases: `createToastManager()` makes an isolated manager
independent of the shared `toast` singleton (e.g. a second, differently
positioned `Toaster` scoped to one part of the app). `useToastManager()`
reads the live toast list and the same `add`/`close`/`update`/`promise`
bound to whichever manager the nearest `Toaster` ancestor uses — from a
component nested under `Toaster`, this is how you react to the toast
list itself (an unread-count badge, "N toasts pending") or call that
same manager without importing it directly. It is **not** a way to
render your own toast cards in place of `Toaster`: the kit doesn't
export the underlying Root/Content/Title/etc. parts.

Whether your own `@base-ui/react` shares this context depends on how it
resolves. `@base-ui/react` is a regular dependency of this package and
stays external in the build, so if your range is satisfied by the same
version your installer dedupes to one copy and the context is shared; if
you pin an incompatible version you get a second copy, and Base UI's
Toast context — like any React context — does not cross between the two.

`toast` is a module-scope singleton, which has three failure modes worth
knowing rather than debugging blind: it's safe under SSR (it holds no
toast state itself, only a listener registered by whichever `Toaster`
is mounted), but calling `toast.add(...)` before any `Toaster` has
mounted, or from code that resolved a different copy of this package
(e.g. a mixed CJS/ESM module graph), drops the toast silently — no
error, nothing queued, it just never appears. The third is the inverse:
mounting **two** `Toaster`s on the shared singleton (plausible in a
shell + MFE setup where each fragment mounts its own) renders every
toast twice, once per viewport. If a subtree genuinely needs its own
viewport, give it an isolated manager via `createToastManager()` and
pass that as its `Toaster`'s `toastManager`.

Without a `container`, the viewport portals where the kit overlay order
puts it (see PortalContainer): outside kit popups that arm the popup scope,
that is the nearest `PortalContainerProvider`'s value, or `<body>` when
there is none, so if your theme lives on a subtree (`data-theme` on a
section instead of `<html>`), pass that section as `Toaster`'s `container`
or wrap the subtree in `PortalContainerProvider`, or toasts render with the
root theme: same contract as `Dialog`, `Select`, `DropdownMenu`, and
`Tooltip`.
Inside a shadow root (an MFE screen), the viewport must be given a
container inside that shadow root - through `PortalContainerProvider` or
`container` - or it renders outside the shadow root: unstyled.

One level down: an overlay rendered inside a toast card does not stay in
it - the toast portal is Base UI's FloatingPortalLite, which gives Base UI
no parent portal node to fall back to - so the overlay follows whatever
encloses the toast: the portal of a kit popup that arms the popup scope,
with no `PortalContainerProvider` in between, when one encloses it,
otherwise the nearest `PortalContainerProvider`'s value, or `<body>` when
there is none.

## Examples

```tsx
import type { ReactNode } from 'react';
import { Toaster, toast } from '@gears-frontx/ui-kit';

// Once, near the app root — wrap the app so any subtree can reach the
// manager via useToastManager; the shared `toast` singleton below works
// from anywhere in the tree regardless.
function Root({ children }: { children: ReactNode }) {
  return <Toaster>{children}</Toaster>;
}

// From anywhere else in the app:
toast.add({ title: 'Saved', description: 'Your changes have been saved.' });
toast.add({ type: 'error', title: 'Failed to save', description: 'Check your connection and retry.' });
toast.add({
  title: 'File deleted',
  actionProps: { children: 'Undo', onClick: handleUndo },
});

toast.promise(saveDraft(), {
  loading: 'Saving…',
  success: 'Saved',
  error: (thrown) => (thrown instanceof Error ? thrown.message : 'Failed to save'),
});
```

## Anti-patterns

- Do not use `Toast` for a confirmation the user must act on before
  continuing — a toast times out and can be swiped away; use `dialog`.
- Do not chain multiple unrelated pieces of information into one toast
  — fire separate toasts, or use `update` to change one in place, rather
  than growing a single toast's `description` into a paragraph.
- Do not rely on a toast as the only place an error is shown — it can be
  missed; pair it with inline form/field errors where the user is
  already looking.
