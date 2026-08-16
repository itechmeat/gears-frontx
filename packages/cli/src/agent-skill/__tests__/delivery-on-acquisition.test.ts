// @cpt-flow:cpt-frontx-flow-template-resolution-install:p1
// @cpt-flow:cpt-frontx-flow-template-resolution-update-local:p1
// @cpt-dod:cpt-frontx-dod-template-resolution-agent-skill-delivery:p1
import { describe, expect, it, vi } from 'vitest';

import { installCommand } from '../../commands/install';
import { updateLocalCommand } from '../../commands/update-local';
import { TemplateInventory } from '../../inventory/TemplateInventory';
import type { FetchFn } from '../../resolver/types';
import type { TemplateManifest } from '../../manifest/types';
import type { DeployAgentSkillFn } from '../types';

const SPEC = 'github:acme/my-template@v1.0.0';
const NEXT_SPEC = 'github:acme/my-template@v1.1.0';
const TARGET_DIR = '/home/dev/.claude/skills/frontx';

function manifestContent(name = 'widget-kit', version = '1.0.0'): string {
  const manifest: TemplateManifest = {
    name,
    version,
    ownershipBoundaries: { exclusiveSubtrees: [], sharedFiles: [] },
  };
  return JSON.stringify(manifest);
}

function succeedingFetch(): FetchFn {
  return vi.fn().mockResolvedValue(manifestContent());
}

function failingFetch(message = 'Network error'): FetchFn {
  return vi.fn().mockRejectedValue(new Error(message));
}

function deliverySucceeds(): DeployAgentSkillFn {
  return vi.fn().mockResolvedValue({ ok: true, targetDir: TARGET_DIR });
}

function deliveryRefuses(): DeployAgentSkillFn {
  return vi.fn().mockResolvedValue({
    ok: false,
    reason: 'write-failed',
    targetDir: TARGET_DIR,
    message: `Could not write the agent skill to "${TARGET_DIR}": EACCES`,
  });
}

describe('agent-skill delivery on install (inst-install-deliver-agent-skill)', () => {
  it('delivers the bundled skill after a successful install and reports the target directory', async () => {
    const deploy = deliverySucceeds();

    const result = await installCommand(SPEC, new TemplateInventory(), succeedingFetch(), undefined, deploy);

    expect(result.ok).toBe(true);
    expect(deploy).toHaveBeenCalledTimes(1);
    expect(result.agentSkill).toEqual({ ok: true, targetDir: TARGET_DIR });
  });

  // inst-install-deliver-warn
  it('reports the template as installed when the delivery is refused, carrying the refusal as a warning', async () => {
    const result = await installCommand(SPEC, new TemplateInventory(), succeedingFetch(), undefined, deliveryRefuses());

    expect(result.ok).toBe(true);
    expect(result.message).toBe('Installed widget-kit@v1.0.0');
    expect(result.agentSkill?.ok).toBe(false);
  });

  it('attempts no delivery when the install itself failed', async () => {
    const deploy = deliverySucceeds();

    const result = await installCommand(SPEC, new TemplateInventory(), failingFetch(), undefined, deploy);

    expect(result.ok).toBe(false);
    expect(deploy).not.toHaveBeenCalled();
  });

  it('installs exactly as before when no delivery is wired in', async () => {
    const result = await installCommand(SPEC, new TemplateInventory(), succeedingFetch());

    expect(result.ok).toBe(true);
    expect(result.agentSkill).toBeUndefined();
  });
});

describe('agent-skill delivery on update-local (inst-update-deliver-agent-skill)', () => {
  it('delivers the bundled skill after a successful bounded local update', async () => {
    const inventory = new TemplateInventory();
    await inventory.install(SPEC, succeedingFetch());
    const deploy = deliverySucceeds();

    const result = await updateLocalCommand('widget-kit', NEXT_SPEC, inventory, succeedingFetch(), deploy);

    expect(result.ok).toBe(true);
    expect(result.agentSkill).toEqual({ ok: true, targetDir: TARGET_DIR });
  });

  // inst-update-deliver-warn
  it('reports the entry as updated when the delivery is refused', async () => {
    const inventory = new TemplateInventory();
    await inventory.install(SPEC, succeedingFetch());

    const result = await updateLocalCommand(
      'widget-kit',
      NEXT_SPEC,
      inventory,
      succeedingFetch(),
      deliveryRefuses(),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe('Updated widget-kit to v1.1.0');
    expect(result.agentSkill?.ok).toBe(false);
  });

  it('attempts no delivery when the named entry is absent from the inventory', async () => {
    const deploy = deliverySucceeds();

    const result = await updateLocalCommand('absent-kit', NEXT_SPEC, new TemplateInventory(), succeedingFetch(), deploy);

    expect(result.ok).toBe(false);
    expect(deploy).not.toHaveBeenCalled();
  });
});
