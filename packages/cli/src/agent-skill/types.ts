// @cpt-flow:cpt-frontx-flow-template-resolution-install:p1
// @cpt-flow:cpt-frontx-flow-template-resolution-update-local:p1
// @cpt-dod:cpt-frontx-dod-template-resolution-agent-skill-delivery:p1
/**
 * Agent-skill delivery seam (F10 §1.6).
 *
 * Acquiring a template makes this CLI usable; it does not make an agent in an
 * arbitrary directory know the CLI exists. The kit that carries that knowledge
 * ships inside this distribution as build-time assets and is written into the
 * developer's per-user agent-skill directory after every successful
 * acquisition.
 *
 * The delivery itself is a filesystem effect, so it reaches `install` and
 * `update-local` as an injected function rather than an imported one — the
 * same seam shape `FetchFn` and `ExtensionDiscoveryHook` already use, and what
 * lets a test exercise the two commands against a temporary directory with no
 * `node:fs` in the command modules.
 */

/**
 * Outcome of one delivery attempt. `targetDir` is present on both branches
 * because the failure has to name the directory that could not be written, and
 * the success has to name the one that was.
 */
export type AgentSkillDeployment =
  | { ok: true; targetDir: string }
  | { ok: false; reason: AgentSkillDeploymentFailure; targetDir: string; message: string };

/**
 * `assets-missing` — this distribution carries no bundled agent skill, so the
 * build never ran its bundling step. `write-failed` — the assets are present
 * and the target directory refused the write. The two call for opposite
 * responses (reinstall the CLI versus fix the directory's permissions or
 * location), so they are never collapsed into one reason.
 */
export type AgentSkillDeploymentFailure = 'assets-missing' | 'write-failed';

/** Injectable effect: "replace the per-user agent-skill directory with the bundled set." */
export type DeployAgentSkillFn = () => Promise<AgentSkillDeployment>;
