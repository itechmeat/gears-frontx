# Guideline: Figma-to-Kit Mapping (template-mfe)

The procedure between reading a Figma design context and writing the first line of a
screen's JSX. `@constructor/react-kit` was built from the same design system the mockups
are drawn in, so component names line up - which is what makes the mapping cheap, and
also what makes a wrong mapping look right. The rules below are the checks that turn the
name correspondence into an implementation that matches the design.

Import shape, the "the kit documents itself" rule, and the token/CSS-module styling rules
live in the `ecosystem-api-quick-reference` reference artifact in this same bundle; this
guideline does not restate them.

## 0. The product's global chrome is out of scope - always

Two parts of any design frame are NEVER implemented, NEVER compared against, and NEVER
counted in geometry beyond subtracting the space they take:

- the left navigation sidebar;
- the surrounding product / OneCloud shell frame - the top-level app wrapper the design
  frame embeds the page into.

Ignore them entirely. The console's own shell provides navigation, so reproducing either
inside a screen is a defect rather than extra fidelity, and comparing against them
manufactures differences no implementation can ever close. This is a STANDING rule, not a
per-run judgement: it needs no decision, no justification, and no mention in the run
output. Rule 5's named-exclusions requirement exists for anything a run skips BEYOND this
chrome, and never for this chrome.

**What IS in scope is the page content area - and that is the whole implementable region:**

1. the page title row - title, view tabs, primary action button;
2. the filter / search bar;
3. the data area (the table);
4. the pagination bar.

When the design source (rule 1) ships a target-region image - a crop of exactly that
in-scope region, e.g. `design/<screen>/target-region.png` - that crop IS the fidelity
scope. It settles what is in and out with nothing left to interpret, and it is the primary
comparison artifact for rule 5. Full-frame screenshots then serve for context only: they
show where the region sits inside the product, not what to build.

## 1. Enumerate before you write

Read the design out of the app container's own `design/` folder whenever it has one. A
pre-exported design context there - the export, the design variables, the screenshots -
IS the source of truth for what the design says; reach for a live Figma MCP only when the
container carries no local export. This is what lets the run prompt stay a one-liner: the
design's location is a convention of the project, not something a prompt has to carry.

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

Composition fidelity is instance-for-instance: every instance in the table renders as the
kit component it maps to, and a merely similarly-named component is a defect - a status
tag carrying an icon where the design shows the plain Tag pill is wrong even when it
looks close. Catch it here, at the mapping step, where it costs one line of reading.
Caught after the build it costs the JSX, every metric transcribed around it, and another
verification pass.

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

## 4. Carry the box metrics across, add nothing, disclose every gap

Derive the content container's geometry from the TARGET REGION, not from the whole frame:
the target-region crop's own dimensions when the design source ships one, otherwise the
frame's native size minus the space rule 0's chrome occupies. Guessing that width from a
browser window instead lands every transcribed metric in the wrong box, and each one then
reads as an individually wrong number rather than as one wrong container.

Transcribe `min-h`, padding, `gap` and `flex-[1_0_0]` from the design context into the
screen's CSS module (translate them - a design context's utility class names are not
usable as Tailwind classes in an MFE screen). `flex-[1_0_0]` on a column is an
instruction, not decoration: leave that column flexible so it absorbs the slack. Pinning
it to a fixed width is a different layout that only matches at one viewport.

Every border, separator and background in the implementation must be traceable to a node
in the export. Do not invent dividers. A row separator added because the rows "need"
one is the defect that survives review longest, because it looks deliberate.

That is one instance of the general rule: where the export is SILENT, make the
conservative choice and disclose it in the run report as an explicit decision. A static
export shows no initial sort state, no filter semantics, and no hover, selected, empty,
loading or error variant - so each of those is a decision the run made, and a decision
named in the report can be corrected in a sentence. The same choice left unnamed reads as
the design's own, and the next reader has no way to tell which visuals came from the
mockup and which the run invented.

## 5. Verify against the design screenshot, region by region

Before declaring the screen done, walk the implementation against the design image one
region at a time - a whole-screen glance passes over exactly the details this guideline
exists for. The image is the target-region crop when the design source ships one; the
full-frame screenshot otherwise.

The scope is rule 0's target region, ENTIRE - not the table alone. Title row (title, view
tabs, primary action), filter / search bar, the table's header row, its sample rows
including each state variant, and the pagination bar each get their own comparison. Rule
0's chrome is not compared at all and needs no mention; anything ELSE a run skips must be
NAMED in the run output, because an unnamed skip is indistinguishable from a region nobody
looked at, which is how the forgotten ones ship.

Compare at the design's native viewport - sized so the app's content area matches the
target region's own dimensions - and in the design's own colour scheme. A dark app held
against a light design yields a comparison where every difference has an easy explanation,
so no real difference is ever found: put the app on the design's scheme (or render the
design in the app's) before the first region, not after the last one.

The screenshot is not optional confirmation of the export, it carries what the export
does not: icon glyphs ship as opaque asset URLs, and per-row content resolves only from
the picture. A run that never looked at it ships plausible wrong glyphs and invented row
data, both of which type-check and both of which a reviewer spots immediately.

This is design fidelity, and it sits alongside - not instead of - the browser
verification in `add-mfe-package-workflow` step 7, which captures the screen per
registered theme and records it in `.frontx/verification-coverage.md`. Capture the design's
native viewport among those, so the two comparisons read against one another.
