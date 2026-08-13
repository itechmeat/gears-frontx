# Figma Node Index (template-mfe)

Every `parameters.design.url` the kit's own Storybook declares, resolved to
`kit entry` plus `fileKey` plus `node-id`. The kit's authors wrote these links to point a
story at the frame it was built from, which makes them the one machine-checkable identity
signal between a design node and a kit entry.

**Scope, honestly:** 17 links across 17 of the kit's 104 entries - about 16% coverage, at
the revision this was extracted. So:

- **A hit is strong evidence.** When a node id in the design context matches a row here,
  the identity question is settled for that instance: use that entry, and record the row as
  what closed it in the `figma-to-kit-mapping` mapping table (its rules 1 and 2).
- **A miss means nothing at all.** The other ~84% of entries simply carry no design link in
  Storybook. Absence from this table is not evidence about which component an instance is,
  and never a reason to hand-compose one.

Node ids appear as `27270-33999` in a Figma URL and as `27270:33999` in design-context and
API payloads. Normalize the separator before comparing; they are the same id.

## The index

`fileKey` is the segment after `/design/` in the URL. Three files appear:

| Key | `fileKey` | File name | Status |
| --- | --- | --- | --- |
| DS | `2wmdVreCHk7AeLrRLb28PW` | OneCloud - Components | The design system's own file |
| GO | `RGdjj7JhqXkRUCkP7WpveU` | GO Components | Second component file the kit links to |
| PR | `nquBs14topVFH2llgIP4To` | [Learn] Schedule redesign | **A project redesign file, NOT the design system** |

| Kit entry | File | `node-id` | Declared on |
| --- | --- | --- | --- |
| `accordion` | DS | `1854-17619` | meta |
| `avatar` | DS | `7420-168596` | meta |
| `checkbox` | DS | `1850-4024` | meta |
| `data-grid` | PR | `2782-48266` | story (`ViewSelector`) |
| `filler` | DS | `7420-168598` | meta |
| `floating-button` | DS | `27066-753` | meta |
| `floating-modal` | DS | `25619-42378` | meta |
| `input` | DS | `12217-170408` | meta |
| `main-navigation` | DS | `11515-224388` | meta |
| `menu` | DS | `7420-168599` | meta |
| `message` | DS | `10806-292756` | meta |
| `popover` | GO | `7299-6422` | meta |
| `radio` | DS | `5311-255526` | meta |
| `secondary-navigation` | DS | `13752-333413` | meta |
| `side-sheet` | DS | `3305-205779` | meta |
| `tabs` | DS | `27270-33999` | story (`Overflow`) |
| `tooltip` | GO | `7399-5992` | meta |

## Reading the table

- **File matters as much as the id.** A node id is only unique inside its file, so a match
  counts only when the design context's file key matches the row's too. Two ids from
  different files can collide and mean nothing.
- **The PR row is not design-system evidence.** `data-grid`'s link points into a project
  redesign file, not the design system, and it hangs off one story rather than the entry's
  meta. Treat it as a pointer to where that story's layout came from - not as the canonical
  frame for the data grid.
- **`meta` vs `story`.** A meta-level link describes the entry as a whole; a story-level one
  describes that story's particular case (`tabs` links its `Overflow` story, not the tab
  component in general). A story-level hit still identifies the entry; it just says less
  about which variant.
- **The links move with the kit.** These were read out of the installed kit's
  `src/entries/**/*.stories.tsx`. A newer kit may add rows, and a design file may be
  reorganized under the same id. When a hit contradicts what the entry's `public.md` and the
  design's own visual evidence say, the guideline's rule 2 order still holds: the evidence
  decides, and the mismatch gets recorded.
