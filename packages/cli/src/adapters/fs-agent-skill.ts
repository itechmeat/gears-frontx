// @cpt-dod:cpt-frontx-dod-template-resolution-agent-skill-delivery:p1
/**
 * Filesystem-backed agent-skill delivery (F10 §1.6): where the bundled assets
 * live inside this distribution, where they are written on the developer's
 * machine, and the copy itself.
 *
 * This is the only module that touches `node:fs` for the delivery; the
 * `install` and `update-local` commands see it as a `DeployAgentSkillFn`.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { AgentSkillDeployment, DeployAgentSkillFn } from '../agent-skill/types';

/**
 * The directory the bundled kit root is deployed under, inside the per-user
 * agent-skill directory. It is also the skill's name to the agent host, which
 * is why it is the bare ecosystem name: a developer's prompt reaches this
 * capability by naming `frontx`.
 */
export const AGENT_SKILL_DIR_NAME = 'frontx';

export interface ResolveAgentSkillsDirOptions {
  cwd?: string;
  env?: Partial<Record<string, string | undefined>>;
}

/**
 * Resolves the per-user agent-skill directory the bundled kit root is written
 * into a subdirectory of.
 *
 * Precedence mirrors `resolveInventoryRoot`: an explicit
 * `FRONTX_AGENT_SKILLS_DIR` override — resolved against `cwd` when relative —
 * takes precedence over the per-user default (`~/.claude/skills`), so a CI job
 * or a test redirects the delivery without any calling code changing. The
 * override names the skills directory itself, not the deployed skill: the
 * `frontx` segment is appended to whichever of the two this returns.
 */
export function resolveAgentSkillsDir(options: ResolveAgentSkillsDirOptions = {}): string {
  const env = options.env ?? process.env;
  const override = env.FRONTX_AGENT_SKILLS_DIR;
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(options.cwd ?? process.cwd(), override);
  }
  return path.join(os.homedir(), '.claude', 'skills');
}

/**
 * Resolves the bundled asset root inside this distribution.
 *
 * `scripts/bundle-agent-skill.mjs` copies the kit files into `dist/agent-skill/`
 * after the bundler runs, and every emitted entry point sits directly in
 * `dist/`, so the assets are always one directory name away from the module
 * asking for them. Nothing here reaches for the monorepo layout: outside a
 * built distribution this path simply does not exist, and the delivery reports
 * `assets-missing` rather than guessing at a source tree.
 */
export function resolveBundledAgentSkillDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'agent-skill');
}

/**
 * Builds the delivery effect: replace `<agentSkillsDir>/frontx` with the
 * bundled kit root at `bundledAssetsDir`.
 *
 * @param bundledAssetsDir The distribution's bundled kit root (`resolveBundledAgentSkillDir`).
 * @param agentSkillsDir The per-user agent-skill directory (`resolveAgentSkillsDir`).
 */
export function createFsDeployAgentSkillFn(bundledAssetsDir: string, agentSkillsDir: string): DeployAgentSkillFn {
  const targetDir = path.join(agentSkillsDir, AGENT_SKILL_DIR_NAME);

  return async function deployAgentSkill(): Promise<AgentSkillDeployment> {
    if (!(await isDirectory(bundledAssetsDir))) {
      return {
        ok: false,
        reason: 'assets-missing',
        targetDir,
        message:
          `This CLI distribution carries no bundled agent skill at "${bundledAssetsDir}", so nothing was ` +
          `written to "${targetDir}". Reinstall @gears-frontx/cli; a build that skipped its asset-bundling ` +
          `step cannot deliver the skill.`,
      };
    }

    try {
      // Removed before the copy rather than copied over: a file an earlier
      // version bundled and this one dropped would otherwise survive in the
      // target and be read as part of the current skill. Removal is also what
      // makes a second delivery leave the directory byte-identical to the
      // first instead of accumulating.
      await fs.rm(targetDir, { recursive: true, force: true });
      await fs.cp(bundledAssetsDir, targetDir, { recursive: true });
      return { ok: true, targetDir };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        reason: 'write-failed',
        targetDir,
        message: `Could not write the agent skill to "${targetDir}": ${message}`,
      };
    }
  };
}

async function isDirectory(candidate: string): Promise<boolean> {
  try {
    return (await fs.stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}
