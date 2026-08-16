// @cpt-dod:cpt-frontx-dod-template-resolution-agent-skill-delivery:p1
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AGENT_SKILL_DIR_NAME,
  createFsDeployAgentSkillFn,
  resolveAgentSkillsDir,
} from '../fs-agent-skill';

const created: string[] = [];

function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontx-agent-skill-'));
  created.push(dir);
  return dir;
}

/** A miniature kit root: the two nesting levels the real bundle uses. */
function bundledAssets(): string {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'SKILL.md'), 'kit root\n');
  fs.mkdirSync(path.join(dir, 'skills', 'project-scaffolding'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'skills', 'project-scaffolding', 'SKILL.md'), 'scaffolding\n');
  return dir;
}

function entriesUnder(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort();
}

afterEach(() => {
  for (const dir of created.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('resolveAgentSkillsDir', () => {
  it('defaults to the per-user agent-skill directory when no override is set', () => {
    expect(resolveAgentSkillsDir({ env: {} })).toBe(path.join(os.homedir(), '.claude', 'skills'));
  });

  it('yields to an absolute FRONTX_AGENT_SKILLS_DIR override', () => {
    const override = path.join(path.sep, 'srv', 'ci', 'skills');

    expect(resolveAgentSkillsDir({ env: { FRONTX_AGENT_SKILLS_DIR: override } })).toBe(override);
  });

  it('resolves a relative FRONTX_AGENT_SKILLS_DIR override against the working directory', () => {
    const cwd = path.join(path.sep, 'work', 'project');

    const resolved = resolveAgentSkillsDir({ cwd, env: { FRONTX_AGENT_SKILLS_DIR: 'build/skills' } });

    expect(resolved).toBe(path.join(cwd, 'build', 'skills'));
  });
});

describe('createFsDeployAgentSkillFn', () => {
  it('writes the whole bundled kit root under the frontx directory of the agent-skill directory', async () => {
    const assets = bundledAssets();
    const skillsDir = tmpDir();

    const deployment = await createFsDeployAgentSkillFn(assets, skillsDir)();

    expect(deployment).toEqual({ ok: true, targetDir: path.join(skillsDir, AGENT_SKILL_DIR_NAME) });
    expect(entriesUnder(path.join(skillsDir, AGENT_SKILL_DIR_NAME))).toEqual([
      'SKILL.md',
      path.join('skills', 'project-scaffolding', 'SKILL.md'),
    ]);
  });

  it('creates the agent-skill directory when the developer has none yet', async () => {
    const assets = bundledAssets();
    const skillsDir = path.join(tmpDir(), 'nested', 'skills');

    const deployment = await createFsDeployAgentSkillFn(assets, skillsDir)();

    expect(deployment.ok).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, AGENT_SKILL_DIR_NAME, 'SKILL.md'))).toBe(true);
  });

  it('leaves the target holding exactly the bundled set when a second delivery runs over the first', async () => {
    const assets = bundledAssets();
    const skillsDir = tmpDir();
    const deploy = createFsDeployAgentSkillFn(assets, skillsDir);
    const targetDir = path.join(skillsDir, AGENT_SKILL_DIR_NAME);
    await deploy();
    // Stands for a file an earlier CLI version bundled and this one dropped:
    // a merging delivery would leave it behind as part of the current skill.
    fs.writeFileSync(path.join(targetDir, 'retired.md'), 'from an earlier version\n');

    const deployment = await deploy();

    expect(deployment.ok).toBe(true);
    expect(entriesUnder(targetDir)).toEqual([
      'SKILL.md',
      path.join('skills', 'project-scaffolding', 'SKILL.md'),
    ]);
  });

  it('refuses with assets-missing when the distribution carries no bundled skill', async () => {
    const skillsDir = tmpDir();
    const absentAssets = path.join(tmpDir(), 'agent-skill');

    const deployment = await createFsDeployAgentSkillFn(absentAssets, skillsDir)();

    expect(deployment.ok).toBe(false);
    if (deployment.ok) return;
    expect(deployment.reason).toBe('assets-missing');
    expect(deployment.targetDir).toBe(path.join(skillsDir, AGENT_SKILL_DIR_NAME));
    expect(fs.existsSync(deployment.targetDir)).toBe(false);
  });

  it('refuses with write-failed when the agent-skill directory cannot be written', async () => {
    const assets = bundledAssets();
    // A regular file where the skills directory should be: the copy cannot
    // create a directory under it, and this is the shape of the real failure
    // (a target path the developer's host owns and this CLI cannot write).
    const occupied = path.join(tmpDir(), 'skills');
    fs.writeFileSync(occupied, 'not a directory\n');

    const deployment = await createFsDeployAgentSkillFn(assets, occupied)();

    expect(deployment.ok).toBe(false);
    if (deployment.ok) return;
    expect(deployment.reason).toBe('write-failed');
    expect(deployment.message).toContain(path.join(occupied, AGENT_SKILL_DIR_NAME));
  });
});
