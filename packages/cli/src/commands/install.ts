// @cpt-flow:cpt-frontx-flow-template-resolution-install:p1
// @cpt-flow:cpt-frontx-flow-template-ai-extensions-bundle-publish-discover-activate:p1
// @cpt-dod:cpt-frontx-dod-template-resolution-install-by-spec:p1
import type { FetchFn } from '../resolver/types';
import { TemplateInventory } from '../inventory/TemplateInventory';
import type { DiscoveryHookResult, ExtensionDiscoveryHook } from '../discovery/types';
import type { AgentSkillDeployment, DeployAgentSkillFn } from '../agent-skill/types';

export interface InstallCommandResult {
  ok: boolean;
  message: string;
  discovery?: DiscoveryHookResult;
  /** Absent when no delivery was attempted; see `deployAgentSkill` below. */
  agentSkill?: AgentSkillDeployment;
}

/**
 * @param discoveryHook Optional cross-package edge (F16 <- F10): when
 * provided, invoked with the installed template's name+ref immediately
 * after a successful install, signaling the AI Tooling Framework that an
 * installed template is present so it can run its extension-discovery scan.
 * Never invoked on a failed install. Omitting the hook preserves the
 * pre-F16 install behavior exactly.
 * @param deployAgentSkill Optional agent-skill delivery (F10 §1.6): when
 * provided, invoked after a successful install to replace the per-user
 * agent-skill directory with this distribution's bundled kit root. Its
 * failure is carried on the result, never raised into the install's own
 * outcome — the template is in the inventory either way.
 */
export async function installCommand(
  spec: string,
  inventory: TemplateInventory,
  fetchFn: FetchFn,
  discoveryHook?: ExtensionDiscoveryHook,
  deployAgentSkill?: DeployAgentSkillFn,
): Promise<InstallCommandResult> {
  const result = await inventory.install(spec, fetchFn);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  const message = `Installed ${result.value.name}@${result.value.ref}`;

  // @cpt-begin:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-agent-skill
  // @cpt-begin:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-check
  // @cpt-begin:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-warn
  // Both outcomes leave `ok: true`: the delivery writes into the developer's
  // agent host, not into the inventory, so its refusal is a warning to relay
  // and never a reason to report an installed template as not installed.
  const agentSkill = await deployAgentSkill?.();
  // @cpt-end:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-warn
  // @cpt-end:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-check
  // @cpt-end:cpt-frontx-flow-template-resolution-install:p1:inst-install-deliver-agent-skill

  // @cpt-begin:cpt-frontx-flow-template-ai-extensions-bundle-publish-discover-activate:p1:inst-install-template
  if (!discoveryHook) {
    return { ok: true, message, agentSkill };
  }

  // @cpt-begin:cpt-frontx-flow-template-ai-extensions-bundle-publish-discover-activate:p1:inst-initiate-discovery
  const discovery = await discoveryHook({ name: result.value.name, ref: result.value.ref });
  // @cpt-end:cpt-frontx-flow-template-ai-extensions-bundle-publish-discover-activate:p1:inst-initiate-discovery
  return { ok: true, message, discovery, agentSkill };
  // @cpt-end:cpt-frontx-flow-template-ai-extensions-bundle-publish-discover-activate:p1:inst-install-template
}
