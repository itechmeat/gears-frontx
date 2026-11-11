# Combobox

A filterable text field for picking from a list, wrapping Base UI's
dedicated `Combobox` primitive (not a Popover+search composition). The
input itself displays and edits the current value; the popup filters as
you type. Portalled, keyboard navigation, typeahead-by-typing, and form
submission (hidden native input on the root) come from Base UI.

Composition, single-select: `Combobox` (root, holds the value) →
`ComboboxInput` (the field itself; renders its own trailing trigger/clear
buttons) → `ComboboxContent` → `ComboboxEmpty` / `ComboboxList` /
`ComboboxItem` — `ComboboxGroup` / `ComboboxLabel` / `ComboboxSeparator`
for grouped lists. `ComboboxContent` does not wrap its children in a list
the way `SelectContent` does — place `ComboboxEmpty` and `ComboboxList` as
its direct children yourself, so an empty-results message can sit
alongside (not inside) the scrolling list.

Composition, multi-select: swap `ComboboxInput` for `ComboboxChips` (a
container of `ComboboxChip` pills plus a trailing `ComboboxChipsInput`),
and anchor the popup to the chips instead of a single-line field with
`useComboboxAnchor()`.

Composition, select-style: a field that looks like a `Select` but filters like
a combobox. `ComboboxTrigger variant="select"` is the visible field (the
chosen value or a placeholder, then a chevron), and the search input moves
into the popup as `<ComboboxInput showTrigger={false} />`, the first child
of `ComboboxContent`. See "Select-style trigger" below.

## When to use

- A single value from a long or unbounded list, filterable by typing —
  the list a `select` covers by scrolling doesn't fit a combobox until it
  is long enough that typing beats scrolling.
- Multiple values from a list, shown as removable chips (`multiple`).

## When not to use

- 2–6 always-visible options — use `radio-group`.
- A short, non-searchable list — use `select`; a combobox invites typing a
  query that doesn't need to exist.

## Props (kit level)

`Combobox` (root): `value` / `defaultValue`, `onValueChange`, `multiple`,
`name`, `disabled`, `required`, `autoHighlight` — see Base UI
`Combobox.Root`. Always pass `items` as well: without it, filtering and
the built-in label/value stringification (for `{ value, label }`-shaped
items) don't run.

`ComboboxInput`:

| Prop | Type | Default |
|------|------|---------|
| `showTrigger` | `boolean` — renders the trailing chevron button that opens the popup | `true` |
| `showClear` | `boolean` — renders a trailing clear button once a value is chosen. Base UI only mounts it while there's something to clear, and it visually replaces the trigger in the same corner rather than the two ever stacking | `false` |
| `toggleLabel` | `string` — accessible name for the chevron button | `'Toggle options'` |
| `clearLabel` | `string` — accessible name for the clear button | `'Clear value'` |
| `className` | `string` — merged after the kit class | — |

Both trailing buttons are icon-only, so those two labels ARE their
accessible names — override them for any language but English, the same
way `Dialog`'s `closeLabel` and `SidebarTrigger`'s `label` work.

`ComboboxTrigger`:

| Prop | Type | Default |
|------|------|---------|
| `variant` | `default` \| `select` — `default` is the compact chevron button `ComboboxInput` places in its corner; `select` is a field of its own that looks like `SelectTrigger`: its children (the chosen value or a placeholder), then a chevron it adds itself | `default` |
| `className` | `string` — merged after the kit class | — |

Every other prop is Base UI's `Combobox.Trigger` (`render`, `nativeButton`,
`disabled`, `aria-*`, ...).

`ComboboxContent` accepts positioning props (`side`, `sideOffset`,
`align`, `alignOffset`, `anchor`, plus the escape hatch for fields inside a
`transform`/`filter` container: `positionMethod="fixed"`,
`collisionBoundary`, `collisionPadding`) and `container` - without a
`container` the popup portals where the kit overlay order puts it (see
PortalContainer): outside other kit popups that is the nearest
`PortalContainerProvider`'s value, or to `<body>`
when there is none, so if your theme lives on a subtree
(`data-theme` on a section instead of `<html>`), pass that section as
`container` or wrap the subtree in `PortalContainerProvider`, or the popup
renders with the root theme. Inside a shadow root (an MFE screen), the
popup must be given a container inside that shadow root - through
`PortalContainerProvider` or `container` - or it renders outside the
shadow root: unstyled, and an outside press closes it. `ComboboxItem` takes
`value` (required) and `disabled`. `aria-invalid` on `ComboboxInput` (or
`ComboboxChips`, for multi-select) switches its border and ring to the
destructive color.

`ComboboxChip` takes `showRemove` (`boolean`, default `true`) to omit the
remove button on a fixed/read-only chip, and `removeLabel` (`string`,
default `'Remove'`) for that button's accessible name — worth naming the
chip itself (`removeLabel={`Remove ${label}`}`) once a form carries
several.

## Select-style trigger

`ComboboxTrigger variant="select"` draws the trigger as a field of its own,
the same height, border, radius, type and states as `SelectTrigger`: the
children read in the foreground tone once something is chosen and in
`--muted-foreground` until then (Base UI flags the empty state, so a
`ComboboxValue placeholder` is enough), a long text value is cut with an
ellipsis before the chevron, and `aria-invalid` / `disabled` draw the same
invalid and dimmed looks. The ellipsis needs the value to be inline content
(text, a `ComboboxValue`, an inline icon in front of it): a block element of
your own in there is not cut. A multiple select's chips wrap onto further
lines instead. There is no text field in the trigger: the query is typed into a
`ComboboxInput showTrigger={false}` placed first in `ComboboxContent`.
Inside the popup that input fills the popup's width, inset by the same step
the list pads its items by, with no width floor of its own; anywhere else it
is only as wide as the field. The popup is anchored to the trigger and as
wide as it (at least 9rem, like every combobox popup). `ComboboxInput`'s
`children` are rendered inside the field's
wrapper, so an adornment such as a search icon can be composed there.

The trigger's role is `combobox`, which takes no name from its content, so
name it: `aria-labelledby` pointing at a visible label, or an `aria-label`.
A `<label for>` (`FieldLabel htmlFor`) names only the button form; the
multiple form below renders its trigger as a `div`, which `<label for>`
cannot name, so there it has to be `aria-labelledby` or `aria-label`. The
same goes for the search input in the popup.

For a multiple select, render the trigger as a `div` and put
`ComboboxChips` among its children:
`<ComboboxTrigger variant="select" render={<div />} nativeButton={false}>`.
A button may not contain the chips' `div`, so `nativeButton={false}` with a
`div` is what keeps the markup valid. The chips drop their own border, fill
and padding there, since the trigger already is the field, and the trigger
grows to hold chips that wrap instead of holding one fixed row. Pressing a
chip's remove button removes the chip and does not open the popup.

The keyboard path to a chip is different here. In the chips-field form the
search input sits among the chips, so ArrowLeft from it reaches a chip and
Backspace on an empty query removes the last one. In the select-style form
the input lives in the popup, outside the chips: ArrowLeft never reaches a
chip and Backspace on an empty query removes nothing. A chosen value is removed
by toggling its option off in the list instead (a chosen option is highlighted
when the popup opens, other options are reached with the arrow keys, and Enter
toggles the highlighted one). The remove buttons stay out of the tab order on
purpose: interactive content inside an element with `role="combobox"` is its
own accessibility anti-pattern, so they are a pointer affordance here.

## Examples

Single-select, filterable, with groups:

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from '@gears-frontx/ui-kit';

const TIMEZONES = [
  { value: 'europe', label: 'Europe', items: ['Frankfurt', 'Dublin'] },
  { value: 'americas', label: 'Americas', items: ['Virginia', 'Oregon'] },
];

<Combobox items={TIMEZONES}>
  <ComboboxInput aria-label="Timezone" placeholder="Select a timezone" showClear />
  <ComboboxContent>
    <ComboboxEmpty>No timezones found.</ComboboxEmpty>
    <ComboboxList>
      {(group) => (
        <ComboboxGroup key={group.value} items={group.items}>
          <ComboboxLabel>{group.label}</ComboboxLabel>
          {group.items.map((item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          ))}
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

Multi-select, chips:

```tsx
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@gears-frontx/ui-kit';

function FrameworkPicker() {
  const anchor = useComboboxAnchor();
  return (
    <Combobox multiple items={FRAMEWORKS}>
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: string[]) =>
            values.map((value) => (
              <ComboboxChip key={value}>{value}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput aria-label="Frameworks" placeholder="Add a framework" />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
```

Select-style, single (the search input is in the popup):

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@gears-frontx/ui-kit';

<Combobox items={REGIONS}>
  <ComboboxTrigger variant="select" aria-label="Region">
    <ComboboxValue placeholder="Select a region" />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput showTrigger={false} aria-label="Search regions" placeholder="Search…" />
    <ComboboxEmpty>No regions found.</ComboboxEmpty>
    <ComboboxList>
      {(region: Region) => (
        <ComboboxItem key={region.value} value={region}>
          {region.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>;
```

Select-style, multiple (chips inside a trigger rendered as a `div`, named by
its visible label through `aria-labelledby`, since a `<label for>` cannot name
a `div`):

```tsx
<>
  <span id="frameworks-label">Frameworks</span>
  <Combobox multiple items={FRAMEWORKS}>
    <ComboboxTrigger
      variant="select"
      render={<div />}
      nativeButton={false}
      aria-labelledby="frameworks-label"
    >
      <ComboboxChips>
        <ComboboxValue>
          {(values: string[]) =>
            values.length === 0
              ? 'Select frameworks'
              : values.map((value) => (
                  <ComboboxChip key={value} removeLabel={`Remove ${value}`}>
                    {value}
                  </ComboboxChip>
                ))
          }
        </ComboboxValue>
      </ComboboxChips>
    </ComboboxTrigger>
    <ComboboxContent>
      <ComboboxInput showTrigger={false} aria-label="Search frameworks" />
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
</>
```

## Not ported from upstream

Upstream's own `combobox.tsx` (the shadcn/ui base-variant registry file
this was ported from) surfaces only a subset of Base UI's Combobox
primitive. Skipped for the same reason upstream skips them — no kit API
exists beyond what upstream demonstrates:

- `Combobox.Row` / `virtualized` — virtualized/grid list rendering.
- `Combobox.Status` — a live-region announcer separate from `Empty`.
- `Combobox.Backdrop` / `Combobox.Arrow` / `Combobox.Icon` — upstream
  renders no modal backdrop, no positioner arrow, and inlines its chevron
  as a plain child rather than through the `Icon` part.
- `Combobox.InputGroup` (the Base UI part, distinct from the unrelated
  shadcn `input-group` registry component upstream actually composes
  with) — never referenced by upstream's own source.
- `useFilter` / `useFilteredItems` — upstream relies on `Combobox.Root`'s
  built-in filtering (pass `items`); these hooks are for externally
  controlled filtering, which upstream's example never does.
- A standalone `Clear` export — upstream defines `ComboboxClear` but does
  not export it from its file; it only appears composed into its
  `ComboboxInput` via `showClear`, which this kit mirrors exactly.

`ComboboxInput`'s field text also skips the literal-1rem/1.5rem small-screen
step `input.module.css`/`textarea.module.css` drop to below the desktop
breakpoint (an iOS Safari focus-zoom guard) — that pattern depends on a
`tokens.test.ts` `EXCEPTIONS` entry naming the file, and this port is out of
scope to add `combobox.module.css`'s own entry to that list. `.input` uses
the Studio/Label token metrics unconditionally instead, same as this kit's
button-based triggers (which never had the zoom problem to begin with).

## Anti-patterns

- Do not use a combobox for navigation — that is a menu/link pattern.
- Do not omit `items` — without it, object-shaped values render as
  `[object Object]` in the field instead of their label.
- Do not use `variant="select"` without the search input in the popup — the
  trigger holds no text field, so there is nowhere to type the query.
- Do not put `ComboboxChips` in a select-style trigger that is still a
  button — render it as a `div` (`render={<div />}`, `nativeButton={false}`).
- Do not name that `div` trigger with a `<label for>` / `FieldLabel htmlFor` —
  a `div` is not labelable, so the combobox ends up with no name. Give it
  `aria-labelledby` or `aria-label`.
- Do not make a chip's remove button tabbable to give keyboard users a way to
  remove a value in the select-style form — remove it by toggling its option
  in the list.
