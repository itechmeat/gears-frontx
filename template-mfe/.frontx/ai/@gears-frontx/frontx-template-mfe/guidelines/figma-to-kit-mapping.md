# Guideline: Figma-to-Kit Mapping (template-mfe)

The procedure between reading a Figma design context and writing the first line of a
screen's JSX. `@constructor/react-kit` was built from the same design system the mockups
are drawn in, so component names line up - which is what makes the mapping cheap, and
also what makes a wrong mapping look right. The rules below are the checks that turn the
name correspondence into an implementation that matches the design.

Import shape, the "the kit documents itself" rule, and the token/CSS-module styling rules
live in the `ecosystem-api-quick-reference` reference artifact in this same bundle; this
guideline does not restate them.

**Two authorities, and the split does not move per run:**

- **The kit is authoritative for tokens and identity** - colours, design tokens, which
  component an instance is, and the component's own internal paddings and intrinsic
  metrics. A mockup can be stale relative to the installed kit; where they differ, the kit
  renders and the difference is DISCLOSED, not corrected.
- **The design is authoritative for screen geometry** - which size variant, the air between
  and around regions, and the proportions of the layout. Those belong to the screen, and a
  mismatch in any of them is a DEFECT to fix before done.

Every rule below is one of those two sides applied to a concrete step.

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
output. Rule 6's named-exclusions requirement exists for anything a run skips BEYOND this
chrome, and never for this chrome.

**What IS in scope is the page content area - and that is the whole implementable region:**

1. the page title row - whatever the design puts there (title, view switches, page-level
   actions);
2. the filter / search bar;
3. the data area - the table, list or cards the page exists to show;
4. the pagination bar.

Those four are the regions of a typical list page, named so a run can see the shape of the
scope; the rule is the content area, not this list. A design whose content area holds other
regions carries those instead, and they are in scope on the same terms.

When the design source (rule 1) ships a target-region image - a crop of exactly that
in-scope region, e.g. `design/<screen>/target-region.png` - that crop IS the fidelity
scope. It settles what is in and out with nothing left to interpret, and it is the primary
comparison artifact for rule 6. Full-frame screenshots then serve for context only: they
show where the region sits inside the product, not what to build.

## 1. Enumerate before you write

Read the design out of the app container's own `design/` folder whenever it has one. A
pre-exported design context there - the export, the design variables, the screenshots -
IS the source of truth for what the design says; reach for a live Figma MCP only when the
container carries no local export. This is what lets the run prompt stay a one-liner: the
design's location is a convention of the project, not something a prompt has to carry.

Before any JSX, list every component instance the design context reports - by its Figma
name and its node id - as a written artifact, not an internal thought. It lands in
`<project>/.frontx/design-mapping.md`, one section per screen, the file accumulating
sections the way `verification-coverage.md` accumulates rows;
`add-mfe-package-workflow` step 5 does not begin until it is on disk:

| Figma name | Node id | Visual evidence | Kit entry | What closed the row |
| --- | --- | --- | --- | --- |

- **Visual evidence** is what the design SHOWS for that instance, read off the screenshot
  and the node data: shape and corner treatment, fill, presence or absence of an icon,
  the anatomy of the control (how many slots, what sits in each, which affordances).
- **What closed the row** is the `public.md` line (rule 2), the size pair where the component
  has variants (measured design box, variant chosen, what that variant renders - rule 2), and
  the sub-region configuration for a composite (rule 4) - which parts are on, which are off.

A list that exists only in reasoning cannot be checked by the next reader, or by the run
itself after the fourth component. Whatever the enumeration misses is what gets invented
later in JSX, and an invented component is far more expensive to find than to have listed.
The table on disk is also what makes a divergence reviewable later: it says what the run
believed the design contained.

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

A NAME MATCH ALONE NEVER CLOSES A ROW. Closing it takes both of the row's own columns: the
visual evidence from the design, and the `public.md` line that matches that evidence. When
the two disagree - the name says one entry, what the design shows matches another - the
evidence wins and the row records why. A row closed on the name only is an untested
assumption written down as a fact, and the build inherits it.

Composition fidelity is instance-for-instance: every instance in the table renders as the
kit component it maps to, and a merely similarly-named component is a defect - a status
tag carrying an icon where the design shows the plain Tag pill is wrong even when it
looks close. Catch it here, at the mapping step, where it costs one line of reading.
Caught after the build it costs the JSX, every metric transcribed around it, and another
verification pass.

### Colour, tokens and a component's intrinsics come from the kit as-is

The design system keeps moving and mockups lag it, so a mockup's paint is evidence about the
design's intent, never an instruction to the theme. Where the two differ, the kit renders.
Concretely: an action colour the design shows that no kit variant produces is NOT bridged at
app level - no override token, no local restyle of a kit component, nothing added to the
theme to chase a mockup. Take the nearest variant the kit ships, use it as-is, and disclose
the delta (rule 5's disclosure list; rule 6 closes it as kit-authoritative). The same holds
for what a component owns inside its own box - internal padding, intrinsic heights, border
treatment: it arrives with the component, and the screen does not reach in to repaint a
mockup's pixel.

### Size variants are chosen by measurement, never by name

Where a component ships size variants, the design's measured box decides which one:

1. measure that instance's box in the export - the actual number, not the impression;
2. learn what each variant RENDERS (its `public.md`, or one DOM measure of the rendered
   control);
3. take the variant whose rendered box is NEAREST the measured one;
4. record the pair in the mapping row - design measured value, variant chosen, what that
   variant renders.

Eyeballing the letters is forbidden: a 32px control in the design asks for the variant that
renders 32, and 28 or 40 are both wrong however right `m` or `l` felt. Any residual
difference after picking the nearest variant is a kit intrinsic - disclose it, do not
restyle the component to close it.

## 3. Choose semantics over shape

Read what a region DOES, not only what it looks like: the affordances a mockup draws are
what name the component. Every visible affordance is a behaviour some kit component already
owns, and the component that owns them is the one to reach for - assembling the same look
out of lower-level parts drops the behaviour and, usually, the metrics with it.

As an illustration, in table territory: a table showing any of - sort indicators in header
cells, bulk or per-row selection, a page-size selector, page buttons, search over rows,
filter chips - is `AcvDataGrid` plus the plugins those affordances name (`order`,
`row-select`, `pagination`, `text-search`, `filters`, `row-actions`, `row-click`,
`table-configuration`), never a hand-composed `AcvTable`. Bare `AcvTable` is for static
grids: rows in, no interaction.

Hand-composing loses the layout as well as the behaviour, which is why the shortcut does
not even hold up visually:

- Data-grid header cells are border-box and the grid renders with `tableLayout: fixed`,
  so the widths declared in the design land exactly and the table fills its container.
- Bare `AcvTable` cells are content-box: `width={132}` renders 144. A full row of widths
  transcribed from a mockup then overflows the container and clips the last column, and
  the fix is not a width tweak - it is the component choice.

## 4. The design decides composition, even against the component's defaults

Choosing the right component settles which component, never what it renders. Every kit
component - and a composite assembling sub-regions out of plugins or slots most of all -
ships a default composition, and the design overrides that default in both directions:

- Every sub-region or control the component renders AND the design also shows must be
  configured to the design's placement, order and variant. The same set of controls in a
  different arrangement is a different screen; matching sets is not matching composition.
- Every element the component renders BY DEFAULT that the design does not show in that
  region is turned off or removed. Shipping it because the component offered it is the
  same defect as adding it by hand - the default is not evidence about this design.
- An element the design shows in one region while the component places it in another is
  not "already handled". It goes where the design puts it.

This is the general form of rule 5's "add nothing", extended from decorations to every
rendered element: a control, an affordance, a counter, a secondary action, a built-in
label or empty-state string. Whatever the component's default is, if the design does not
show it in that region, it does not ship there.

Record the configuration per composite in the mapping table's row - which sub-regions are
on, which are off, in what order. That row is what a later reader compares the built
screen against, and it is the cheapest place to notice that a default slipped through.

## 5. Carry the box metrics across, add nothing, disclose every gap

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

### The air is the screen's job

The kit ships components; the space between and around them is the screen's own CSS glue,
and it is transcribed from the design exactly like any other metric - inter-region gaps,
container paddings, the content area's edge gutters. Two regions never touch unless the
design shows them touching, and no region runs to the content area's edge unless the design
puts it there. This is the design's side of the split, so every one of these is a defect
when it diverges, never a disclosure. (Illustration, from one run: a filter bar glued to the
data area, no side gutters, and a control track stretched until it dominated the title row -
three failures of air, with no wrong component among them.)

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

**What the disclosure list holds, and what it must never absorb.** It holds the export's
silences above, and the kit-authoritative deltas of rule 2 - a colour no kit variant renders,
an intrinsic the component owns, a residual size difference left after picking the nearest
variant. Those are disclosed and shipped as the kit renders them. It never holds geometry: a
size variant off by a step, a missing gutter, two regions touching, a region out of
proportion, an element in the wrong place. Those are defects, fixed before the screen is
done, and writing one into a disclosure list is how a wrong screen ships with paperwork.

## 6. Verify as a written two-way diff, one region at a time

Before declaring the screen done, walk the implementation against the design image region
by region - a whole-screen glance passes over exactly the details this guideline exists
for. The image is the target-region crop when the design source ships one; the full-frame
screenshot otherwise.

The scope is rule 0's target region, ENTIRE - never only the region that was hardest to
build. Every region rule 0 lists gets its own comparison, and so does every state variant
the design shows inside one. Rule 0's chrome is not compared at all and needs no mention;
anything ELSE a run skips must be NAMED in the record, because an unnamed skip is
indistinguishable from a region nobody looked at, which is how the forgotten ones ship.

Compare at the design's native viewport - sized so the app's content area matches the
target region's own dimensions - and in the design's own colour scheme. A dark app held
against a light design yields a comparison where every difference has an easy explanation,
so no real difference is ever found: put the app on the design's scheme (or render the
design in the app's) before the first region, not after the last one.

**The comparison produces a written verdict, one row per region**, recorded with the
screen's entry in `<project>/.frontx/verification-coverage.md` (workflow step 7's file):

| Region | In the design, missing in the build | In the build, absent from the design | Metrics and proportions (design vs built) | Verdict |
| --- | --- | --- | --- | --- |

- Both middle columns are filled, always. The second one is the one runs skip, and it is
  where rule 4's leaked defaults and rule 5's invented elements show up - a diff run in one
  direction only reports nothing when the build has MORE than the design.
- The metrics column carries numbers, not adjectives: the two or three box values spot
  checked in that region (a padding, a height, a gap), as design value vs built value, AND
  two or three region-level PROPORTIONS - a control track's height against its row's height,
  a region gap against a row height, a region's width against the container's. Proportions
  catch what absolute pixels let a run argue about: a region rendered gigantic can pass value
  by value and still be wrong at a glance, and a ratio makes that undeniable.
- Every difference gets a CLASS in the verdict column, and the class says what happens next.
  A geometry difference (size variant, gap, gutter, proportion, placement) is a defect to fix
  before the screen is done. A kit-authoritative difference - a colour or an intrinsic the kit
  renders its own way (rule 2) - is recorded as "kit-authoritative, disclosed" and closed
  there. An unclassified difference is still open, whatever else the row says.
- A region whose metrics cell is EMPTY stays in the table with the cell empty. That is a
  visible gap, and it is the honest record of a metric nobody measured; deleting the row or
  writing "looks right" turns an unmeasured region into an apparently verified one.

Both directions need the picture, not just the export: icon glyphs ship as opaque asset
URLs and per-row content resolves only from the screenshot, so a run that never looked at
it ships plausible wrong glyphs and invented content, all of which type-checks.

This is design fidelity, and it sits alongside - not instead of - the browser verification
in `add-mfe-package-workflow` step 7, which captures the screen per registered theme in
that same file. Capture the design's native viewport among those, so the two records read
against one another.
