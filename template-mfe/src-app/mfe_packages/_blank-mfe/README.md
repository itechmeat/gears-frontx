# Blank MFE Template

This is a template for creating new FrontX Microfrontend packages. It provides a complete, working MFE structure with:

- Shadow DOM isolation
- Bridge communication with the host
- Theme and language property subscriptions
- MFE-local i18n with 36 language files
- Components from `@constructor/react-kit`, styled from `@constructor/globals` tokens
- TypeScript strict mode
- Module Federation setup

## How to Use This Template

### 1. Copy the Template

Copy the entire `_blank-mfe` directory to a new name:

```bash
cp -r src/mfe_packages/_blank-mfe src/mfe_packages/your-mfe-name
```

### 2. Update Package Metadata

Edit `package.json`:
- Change `"name"` from `"@gears-frontx/blank-mfe"` to `"@gears-frontx/your-mfe-name"`
- Change the port in the `"dev"` and `"preview"` scripts (e.g., from `3099` to your chosen port)

Edit `vite.config.ts`:
- Change `name` in the federation config from `"blankMfe"` to `"yourMfeName"` (camelCase)
- Update the port in the dev server config if needed

### 3. Update GTS IDs in mfe.json

Replace all placeholder IDs with your actual GTS IDs. The placeholders are marked with `[YOUR_ORG]`, `[YOUR_APP]`, `[YOUR_MFE_NAME]`, and `[YOUR_SCREEN_NAME]`.

**Manifest ID Pattern:**
```
gts.frontx.mfes.mfe.mf_manifest.v1~[YOUR_ORG].[YOUR_APP].mfe.[YOUR_MFE_NAME].manifest.v1
```

Example:
```
gts.frontx.mfes.mfe.mf_manifest.v1~acme.crm.mfe.customer.manifest.v1
```

**Entry ID Pattern:**
```
gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~[YOUR_ORG].[YOUR_APP].mfe.[YOUR_MFE_NAME].[YOUR_SCREEN_NAME].v1
```

Example:
```
gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~acme.crm.mfe.customer.details.v1
```

**Extension ID Pattern:**
```
gts.frontx.mfes.ext.extension.v1~[YOUR_ORG].[YOUR_APP].ext.[YOUR_SCREEN_NAME]_screen.v1
```

Example:
```
gts.frontx.mfes.ext.extension.v1~acme.crm.ext.customer_details_screen.v1
```

**Update the `remoteEntry` URL:**
```json
"remoteEntry": "http://localhost:[YOUR_PORT]/assets/remoteEntry.js"
```

**Update the `remoteName`:**
```json
"remoteName": "yourMfeName"
```

**Update the presentation metadata:**
```json
"presentation": {
  "label": "Your Screen Label",
  "icon": "lucide:your-icon",
  "route": "/your-route",
  "order": 100
}
```

### 4. Customize the Screen Component

Edit `src/screens/home/HomeScreen.tsx`:
- Rename the component if needed
- Add your business logic
- Compose the controls from `@constructor/react-kit`, and put screen-local
  layout in `HomeScreen.module.css` using `--acv-*` tokens (see
  [Styling](#styling))

### 5. Update Translations

Edit the i18n files in `src/screens/home/i18n/`:
- Update the `title` and `description` keys for all 36 language files
- Add any additional translation keys your screen needs
- Ensure all keys used in `t()` calls exist in the translation files

### 6. Install Dependencies

```bash
npm install
```

No registration step is needed to make the package buildable or runnable: the
root `package.json` globs `src-app/mfe_packages/*` as workspaces, and the
shell's dev orchestrator discovers every package under that directory and
reads its port from the package's own `preview` script. A copied directory is
picked up by both as soon as it exists.

### 7. Register with Host

In the host app's MFE bootstrap file (e.g., `src/app/mfe/bootstrap.ts`):

```typescript
import yourMfeConfig from '@gears-frontx/your-mfe-name/mfe.json';

// Register manifest
runtime.registerManifest(yourMfeConfig.manifest);

// Register entries
yourMfeConfig.entries.forEach(entry => {
  runtime.registerEntry(entry);
});

// Register extensions
yourMfeConfig.extensions.forEach(extension => {
  runtime.registerExtension(extension);
});
```

## Project Structure

```
_blank-mfe/
├── package.json              # Package metadata and dependencies
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite and Module Federation config
├── vitest.config.ts          # Test config, on the shell's shared MFE base
├── mfe.json                  # MFE manifest, entries, and extensions
├── README.md                 # This file
└── src/
    ├── lifecycle.tsx         # MFE lifecycle: shadow-root styling + screen render
    ├── init.ts               # MFE app composition (services, slices, effects)
    ├── api/                  # MFE-local API service, endpoint types, mocks
    ├── actions/              # Action creators
    ├── events/               # Event definitions
    ├── effects/              # Effect handlers
    ├── slices/               # State slices
    ├── shared/
    │   ├── useScreenTranslations.ts         # i18n hook
    │   ├── KitProviders.tsx                 # the kit's required context, host theme -> colour scheme
    │   ├── acvColorScheme.ts                # host theme id -> the kit's light/dark
    │   ├── demoteUnlayeredShadowStyles.ts   # cascade bridge: let @layer ui win
    │   └── mirrorMfeStylesToDocument.ts     # cascade bridge: style portalled overlays
    └── screens/
        └── home/
            ├── HomeScreen.tsx        # Screen component
            ├── HomeScreen.module.css # Screen-local layout on --acv-* tokens
            └── i18n/                 # 36 language files
                ├── en.json
                ├── es.json
                └── ... (34 more)
```

Every source file has its test beside it (`*.test.ts`, `*.test.tsx`).

## Key Concepts

### Shadow DOM Isolation

All MFE content renders inside a Shadow DOM root, ensuring complete CSS
isolation from the host application. Three separate things put CSS in there,
and it helps to know which is which:

1. **This package's own CSS** - the component styles from
   `@constructor/react-kit` and `HomeScreen.module.css` - is emitted by the
   build into this MFE's own stylesheet, listed in its `mf-manifest.json`, and
   injected as a `<link>` into the shadow root by the host's MFE handler
   *before* `mount()` runs. Nothing in the package has to arrange this.
2. **The host document's stylesheets** are cloned into the shadow root by
   `ThemeAwareReactLifecycle.mount()`, once, at mount. Some of those clones are
   harmful here, which is what `initializeStyles()` deals with - see
   [Styling](#styling).
3. **The design tokens** are NOT in this list, and that is the point: the shell
   links `@constructor/globals` at document level, so the tokens are declared on
   the document's `:root` and inherit through the shadow boundary. This package
   injects no tokens of its own; a copy on `:host` would shadow the host's and
   freeze the screen on whichever colour scheme was current at mount.

### Bridge Communication

The `ChildMfeBridge` provides APIs for:
- Property subscriptions (theme, language)
- Actions chain execution (navigation, custom actions)
- Bidirectional communication with the host

### MFE-Local i18n

Each screen manages its own translations using `useScreenTranslations`:
- Translations are loaded dynamically based on the current language
- Language changes trigger automatic translation reload
- No host-side i18n dependencies

### Styling

Controls come from `@constructor/react-kit`, pinned to an exact version, one
entry per subpath. It is a dependency, not a folder of copied files - do not
vendor primitives into this package.

```tsx
import { AcvButton } from '@constructor/react-kit/button';
import { AcvInput } from '@constructor/react-kit/input';
```

Each kit component carries its own CSS Module; importing the component pulls its
styles in with it, and the build ships only the components you imported. The kit
documents every entry in
`node_modules/@constructor/react-kit/entries/<entry>/public.md` - read that
rather than guessing a prop name.

**The kit's context is already installed.** `lifecycle.tsx` wraps every screen in
`shared/KitProviders.tsx`, which provides `AcvColorScheme` and `LocaleProvider`.
Neither is optional - every kit component calls `useInternalTranslations()` and
throws outside a `LocaleProvider`, `AcvButton` included via `AcvLoader` - and a
screen must not add its own. `KitProviders` also subscribes to the host's shared
theme property and drives the kit's colour scheme from it, collapsing the shell's
five themes onto the kit's light and dark (`shared/acvColorScheme.ts`). A screen
that needs to know which one resolved reads `useColorScheme()`; it must not call
`setColorScheme`.

**The kit ships controls, not containers.** There is no card, panel or skeleton
component. Build layout in the `*.module.css` beside the screen against
`@constructor/globals` tokens, the way `HomeScreen.module.css` builds its
`.panel` out of `--acv-color-surface-secondary`, `--acv-radius-medium` and
`--acv-spacing-regular`. Token families:

```
--acv-color-{surface,glyph,border,status,decoration}-*
--acv-spacing-*   --acv-radius-*   --acv-shadow-*   --acv-icon-size-*
--acv-font-size-* --acv-line-height-* --acv-font-weight-* --acv-height-*
```

The full list is the shell's `public/acv/base.css` and
`public/acv/themes/constructor/styles.css`, which the shell regenerates from the
package on every `npm run dev`.

**Do not use Tailwind utility classes here.** The host's compiled Tailwind does
reach this shadow root, but its colour utilities read the shell's tokens, whose
value grammar differs from the kit's (`0 0% 100%` where the kit has a complete
colour). A colour utility therefore resolves against names that are not declared
here, while layout utilities keep working - the worst kind of failure to inherit
into a copied screen.

#### The two cascade bridges in `initializeStyles()`

Both exist because the kit ships its component CSS inside `@layer ui`, and both
are needed for a kit component to render fully styled. Neither needs anything
from a screen; each is documented in full at its own definition.

`shared/demoteUnlayeredShadowStyles.ts` - a declaration in ANY cascade layer
loses to an unlayered one at ANY specificity, and the base class puts unlayered
CSS in the shadow root (the host's compiled Tailwind, cloned; plus its own base
resets). Measured without this: `AcvButton` computes
`background-color: rgba(0, 0, 0, 0)` and `padding: 0px` while still taking its
`border-radius` and `height` from the kit - half-styled, which reads as a
rendering glitch rather than as a cascade problem. Inline `<style>` blocks are
wrapped in a `frontx-host` layer; a cloned `<link>` cannot be rewritten, so an
unlayered one is dropped. Note which kind the host's stylesheet is depends on the
BUILD - the dev server serves a `<style>`, `vite build` emits a `<link>` - so a
bridge handling only one of them works in only one mode.

`shared/mirrorMfeStylesToDocument.ts` - every overlay the kit ships (tooltip,
select, dropdown, popover, dialog, notification) portals its popup into
`document.body`, which this MFE's stylesheet does not reach, because the handler
injects it into the shadow root only. This mirrors the same stylesheet URL into
`document.head`. Safe rather than a leak: every rule in it is a hashed
CSS-module class, so it can only match elements this MFE rendered, and the file
is already in the browser cache.

## Development

### Run Locally

```bash
npm run dev
```

The MFE will be served at `http://localhost:[YOUR_PORT]/assets/remoteEntry.js`.

### Build

```bash
npm run build
```

### Type Check and Test

```bash
npm run type-check
npm run test:unit
```

Both resolve through files the shell contributes to the same `src-app/`:
`vitest.config.ts` extends `../../vitest.mfe.base`, and `tsconfig.json` maps
`@frontx-test-utils/*` to `../../__test-utils__/*`. They run from an assembled
project — a shell plus this template — not from either template alone.

## Troubleshooting

### Module Federation Errors

If you see "Shared module not available" errors:
- Ensure all shared dependencies in `mfe.json` match those in `vite.config.ts`
- Verify the host app is configured to consume your remote

### Type Errors

If TypeScript cannot resolve `@gears-frontx/*` imports:
- Ensure `@gears-frontx/react` is in `dependencies`
- Run `npm install` to symlink workspace packages

### Style Issues

If a kit component renders HALF-styled - a real height and border-radius but a
transparent background and no padding - the cascade bridge is not doing its job.
Something unlayered in the shadow root is outranking `@layer ui`: check that
`initializeStyles()` still calls `demoteUnlayeredShadowStyles`, and look for a
`<link>` or `<style>` in the shadow root whose rules are not inside an `@layer`
- see [Styling](#styling).

If a component renders unstyled with NO token values at all -
`var(--acv-*)` resolving to nothing - the design system is not on the host
document. Check that the shell's `index.html` links `/acv/base.css` and
`/acv/themes/constructor/styles.css` and that both return 200; the shell
regenerates them with `npm run sync:acv-globals`, which its `predev`/`prebuild`
run.

If icons collapse to 0x0 while everything else looks right, `base.css` reached
the document through a bundler instead of a plain `<link>`: Tailwind drops the
icon-sizing rule and nothing else, so the failure hides. This is the shell's
concern - see its `scripts/sync-acv-globals.mjs`.

If a tooltip, select, dropdown, dialog or notification popup renders unstyled
while the same component's trigger looks right, the popup portalled into
`document.body` and the mirror is missing. Check for
`link[data-frontx-mfe-style-mirror]` in `document.head` - see
[Styling](#styling).

If a screen throws `useTranslation must be used within a LocaleProvider`, it is
rendering outside `KitProviders` - in a test that renders the screen directly,
or in a lifecycle that stopped wrapping it.

If a colour is wrong or missing while spacing and layout are right, something is
reading the shell's tokens rather than the kit's. A Tailwind colour utility in
this package is the usual cause - see [Styling](#styling).

If a component's own styles are missing, the CSS is not reaching the shadow
root at all: confirm the component is imported statically (a lazily imported
one is not in this MFE's stylesheet) and that `dist/mf-manifest.json` lists a
CSS file under the exposed module's assets.
