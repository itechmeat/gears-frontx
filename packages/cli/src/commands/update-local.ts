// @cpt-flow:cpt-frontx-flow-template-resolution-update-local:p1
// @cpt-dod:cpt-frontx-dod-template-resolution-bounded-local-update:p1
// @cpt-dod:cpt-frontx-dod-template-resolution-agent-skill-delivery:p1
import type { FetchFn } from '../resolver/types';
import { TemplateInventory } from '../inventory/TemplateInventory';
import type { AgentSkillDeployment, DeployAgentSkillFn } from '../agent-skill/types';

export interface UpdateLocalResult {
  ok: boolean;
  message: string;
  /** Absent when no delivery was attempted; see `deployAgentSkill` below. */
  agentSkill?: AgentSkillDeployment;
}

/**
 * @param deployAgentSkill Optional agent-skill delivery (F10 §1.6), on the
 * same terms as install: a developer who updates but never re-installs would
 * otherwise stay on whichever skill version the last install delivered. Its
 * failure is carried on the result rather than raised — the inventory entry is
 * updated either way.
 */
export async function updateLocalCommand(
  name: string,
  spec: string,
  inventory: TemplateInventory,
  fetchFn: FetchFn,
  deployAgentSkill?: DeployAgentSkillFn,
): Promise<UpdateLocalResult> {
  const result = await inventory.updateLocal(name, spec, fetchFn);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  // @cpt-begin:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-agent-skill
  // @cpt-begin:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-check
  // @cpt-begin:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-warn
  const agentSkill = await deployAgentSkill?.();
  // @cpt-end:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-warn
  // @cpt-end:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-check
  // @cpt-end:cpt-frontx-flow-template-resolution-update-local:p1:inst-update-deliver-agent-skill

  return {
    ok: true,
    message: `Updated ${result.value.name} to ${result.value.ref}`,
    agentSkill,
  };
}
