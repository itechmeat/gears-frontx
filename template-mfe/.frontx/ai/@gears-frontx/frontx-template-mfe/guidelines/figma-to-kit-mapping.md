# Guideline: Figma-to-Kit Mapping (template-mfe)

The procedure between reading a Figma design context and writing the first line of a
screen's JSX. `@constructor/react-kit` was built from the same design system the mockups
are drawn in, so component names line up - which is what makes the mapping cheap, and
also what makes a wrong mapping look right. The rules below are the checks that turn the
name correspondence into an implementation that matches the design.

Import shape, the "the kit documents itself" rule, and the token/CSS-module styling rules
live in the `ecosystem-api-quick-reference` reference artifact in this same bundle; this
guideline does not restate them.

## 1. Enumerate before you write

Before any JSX, list every component instance the design context reports - by its Figma
name and its node id - as a visible run artifact, a table in the run output. Not an
internal thought:

| Figma name | Node id | Kit entry | The `public.md` line that decided it |
| --- | --- | --- | --- |

A list that exists only in reasoning cannot be checked by the next reader, or by the run
itself after the fourth component. Whatever the enumeration misses is what gets invented
later in JSX, and an invented component is far more expensive to find than to have listed.

## 2. A name match is a hypothesis; the `public.md` line is the decision

Name correspondence between the Figma design system and the kit is expected and is the
primary lookup - start there, always. Then read that entry's
`node_modules/@constructor/react-kit/entries/<entry>/public.md` BEFORE committing to it.
The name gets you to the candidate; the entry's own prose is what confirms it.

The trap is a name that reads plausible for the thing on screen while a different entry
is the actual match:

- The mockup's "State" pill is the component Figma names **Tag**. `AcvTag`
  (`color="green"` / `color="red"`) matches it token for token.
- `AcvStatusTag` sounds like the component for a state column, and its `public.md` opens
  by describing "status indicators with icons" - a different component. One line of
  reading separates the two; the name alone does not.

Record in the table which line decided each row. A row whose decision column is empty is
a guess still waiting to be checked.

## 3. Choose semantics over shape

Read what the table in the mockup DOES, not what it looks like. If it shows any of - sort
indicators in header cells, bulk or per-row selection, a page-size selector, page
buttons, search over rows, filter chips - it is `AcvDataGrid` plus the plugins those
affordances name (`order`, `row-select`, `pagination`, `text-search`, `filters`,
`row-actions`, `row-click`, `table-configuration`), never a hand-composed `AcvTable`.
Bare `AcvTable` is for static grids: rows in, no interaction.

Hand-composing loses the layout as well as the behaviour, which is why the shortcut does
not even hold up visually:

- Data-grid header cells are border-box and the grid renders with `tableLayout: fixed`,
  so the widths declared in the design land exactly and the table fills its container.
- Bare `AcvTable` cells are content-box: `width={132}` renders 144. A full row of widths
  transcribed from a mockup then overflows the container and clips the last column, and
  the fix is not a width tweak - it is the component choice.

## 4. Carry the box metrics across, and add nothing

Transcribe `min-h`, padding, `gap` and `flex-[1_0_0]` from the design context into the
screen's CSS module (translate them - a design context's utility class names are not
usable as Tailwind classes in an MFE screen). `flex-[1_0_0]` on a column is an
instruction, not decoration: leave that column flexible so it absorbs the slack. Pinning
it to a fixed width is a different layout that only matches at one viewport.

Every border, separator and background in the implementation must be traceable to a node
in the export. Do not invent dividers. A row separator added because the rows "need"
one is the defect that survives review longest, because it looks deliberate.

## 5. Verify against the design screenshot, region by region

Before declaring the screen done, fetch the design's screenshot and walk the
implementation against it at the design's native viewport and colour scheme: header row,
sample rows including each state variant, filter bar, pagination bar. One region at a
time - a whole-screen glance passes over exactly the details this guideline exists for.

The screenshot is not optional confirmation of the export, it carries what the export
does not: icon glyphs ship as opaque asset URLs, and per-row content resolves only from
the picture. A run that never looked at it ships plausible wrong glyphs and invented row
data, both of which type-check and both of which a reviewer spots immediately.

This is design fidelity, and it sits alongside - not instead of - the browser
verification in `add-mfe-package-workflow` step 7, which captures the screen per
registered theme and records it in `.frontx/verification-coverage.md`. Capture at the
same viewport the design declares, so the two comparisons read against one another.
