#!/usr/bin/env node
/**
 * Copies the FrontX AI Tooling Kit's agent-skill files into this CLI's
 * distribution as package assets (F10 §1.6,
 * `cpt-frontx-dod-template-resolution-agent-skill-delivery`).
 *
 * Runs after `tsup`, which cleans `dist/` on every build. The CLI gains no
 * dependency on the kit package by this: the assets are inert files, resolved
 * from the monorepo layout at BUILD time only, and `dist/agent-skill/` is what
 * the published tarball and the deployed skill are both made of.
 *
 * The kit-root-relative path of each asset is preserved verbatim in the output.
 * The scaffolding document addresses its own siblings by exactly these paths
 * ("skills/project-scaffolding/verification-checklist.md under the installed
 * kit root"), so the deployed directory has to BE a kit root for those
 * references to resolve.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kitRoot = path.resolve(packageRoot, '..', 'cyber-pilot-kit-frontx');
const outputRoot = path.join(packageRoot, 'dist', 'agent-skill');

// Listed one by one rather than copied wholesale: the kit package also holds
// its own architecture tree, coverage output and node_modules, none of which
// belongs in a deployed skill, and a glob would quietly start shipping
// whatever the kit adds next.
const ASSETS = [
  'SKILL.md',
  'AGENTS.md',
  'guidelines/ecosystem-boundaries.md',
  'skills/project-scaffolding/SKILL.md',
  'skills/project-scaffolding/verification-checklist.md',
  'skills/project-scaffolding/scripts/verify-walk.mjs',
];

async function main() {
  await fs.rm(outputRoot, { recursive: true, force: true });

  for (const asset of ASSETS) {
    const source = path.join(kitRoot, asset);
    // Fails the build rather than shipping a distribution whose skill is
    // missing a file it cites. A skill deployed with an absent
    // verification-checklist.md reads as a checklist nobody wrote.
    const stats = await fs.stat(source).catch(() => undefined);
    if (!stats?.isFile()) {
      throw new Error(`Agent-skill asset "${asset}" is not a file at ${source}.`);
    }

    const destination = path.join(outputRoot, asset);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }

  process.stdout.write(`Bundled ${ASSETS.length} agent-skill asset(s) into ${outputRoot}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
