#!/usr/bin/env node
/**
 * Copy `@constructor/globals`' document-level stylesheets and fonts into
 * `public/acv/`, where `index.html` links them directly.
 *
 * Why not `import '@constructor/globals/base.css'` from the app entry: the
 * shell's `postcss.config.js` runs Tailwind v3 over every stylesheet Vite
 * touches, and Tailwind silently drops rules it cannot digest. Measured on
 * base.css: the whole `.go-icon, .base-icon { block-size: var(--icon-size…) }`
 * rule disappears because of the native CSS nesting inside it, so every icon
 * inside every kit component renders at 0x0 while the rest of the file survives
 * and hides the failure. `tailwindcss/nesting` restores the selector but not the
 * declarations. A plain <link> keeps the design system's CSS byte-for-byte.
 *
 * Copying rather than linking into node_modules also keeps the @font-face
 * `url(../../fonts/…)` references resolvable: the fonts land at the same
 * relative offset under public/acv/ that they occupy in the package.
 *
 * The output is generated, not authored: `.gitignore` excludes `public/acv/`,
 * and `predev` / `prebuild` regenerate it, so a freshly scaffolded project gets
 * the design system on its first `npm run dev` without any manual step.
 *
 * `@constructor/browserslist-config` is a devDependency of this app for the same
 * design system, and is not optional: `@constructor/globals` declares
 * `browserslist: ["extends @constructor/browserslist-config"]` and does not
 * depend on it, so once the package is present in the tree autoprefixer resolves
 * that config and throws if it cannot be found, taking the whole CSS build with
 * it. Removing the devDependency breaks `npm run build` and not this script.
 */

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

/*
 * The package does not export ./package.json, so its root is derived from a
 * subpath it does export rather than from require.resolve of the manifest.
 */
const require = createRequire(import.meta.url);
const pkgRoot = dirname(require.resolve('@constructor/globals'));
const pkg = JSON.parse(await readFile(join(pkgRoot, 'package.json'), 'utf8'));

const target = resolve(process.cwd(), 'public/acv');

/**
 * Theme whose token values are copied.
 *
 * The package ships several under `themes/`; the links in `index.html` name
 * this one, so changing the palette means changing both together.
 */
const THEME = 'constructor';

/** Exports map entry -> destination path under public/acv. */
const sheets = [
  ['./base.css', 'base.css'],
  [`./themes/${THEME}/styles.css`, `themes/${THEME}/styles.css`],
];

for (const [exportKey, destRel] of sheets) {
  const source = join(pkgRoot, pkg.exports[exportKey]);
  const dest = join(target, destRel);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, await readFile(source));
  console.log(`acv-globals: ${exportKey} -> public/acv/${destRel}`);
}

await cp(join(pkgRoot, 'fonts'), join(target, 'fonts'), { recursive: true });
console.log('acv-globals: fonts -> public/acv/fonts');
