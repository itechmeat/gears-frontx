---
name: frontx
description: "Entry point for any request naming FrontX or frontx - \"frontx, build me a console\", create or scaffold a FrontX project from what the developer wants built, apply or upgrade a FrontX template, add a screen or MFE to one, or understand the ecosystem's MFE runtime substrate, GTS type system, API protocol surface, CLI and package boundaries. Routes the request to the capability that serves it, and carries the preflight that installs whatever the request needs before it runs. Solution-agnostic base only."
---

# FrontX AI Tooling Kit

Provides AI agents with ecosystem-level fluency for FrontX projects, and routes
a FrontX request to the capability that serves it.

<!-- frontx:routing:begin -->

## Request Routing

Read this before answering a FrontX request. Decide from the request itself and
from whether the working directory already holds applied templates - a
`.frontx/provenance.json` with records means it does. **Decide that by looking,
never by asking**: an empty or absent directory is a state the routed capability
classifies under its own rule, and a developer who pointed at a directory has
already told you which one they mean.

**A request that names a URL carries part of itself there, so read that before
you route.** An issue, a ticket, a spec: it states what is to be built, and which
row below serves the request can turn on what it says. Reach it with a connected
fetch capability if one addresses that host, and otherwise with `curl` from the
shell, which needs nothing connected. If it answers unauthorized, a token by
environment convention and the API form of a human-facing page are both worth an
attempt before anyone is asked anything - the mechanics are written out once, in
`skills/project-scaffolding/SKILL.md` under Step 0.1, and that is the copy to
follow. **No connected tool for a host is not the same as no way to read it**: one
run looked for such a tool, found none, and ended its turn asking the developer to
paste an issue that a shell command would have fetched.

**Every entry in the "Served by" column is a document to open or a command to
run, and none of them is a skill to invoke.** A `frontx_`-prefixed name is a
resource this kit installs at a path under its own root: reach it with the Read
tool at that path, relative to this document. None of them is registered with
the agent host as a skill of its own, so a Skill tool call - or any other
invoke-by-name mechanism - fails with an unknown-skill error, whatever name is
guessed at. Two runs tried such a call before falling back to reading the file,
and both fallbacks worked; the guess is simply not a step this table asks for.
Take the path from the row and read it.

| The request is to | Served by |
|---|---|
| Create a new project from what the developer wants to be built, holding no reference to start from | `frontx_project_scaffolding` - **read `skills/project-scaffolding/SKILL.md`**. It matches the stated intent against what the installed inventory declares, applies the chosen set through the `frontx` executable, and realizes the units the intent names |
| Apply a specific template whose reference the developer already holds - `seed` into a new repository, `add` into an existing one | `frontx_project_scaffolding`, **the same document at `skills/project-scaffolding/SKILL.md`**. Naming the template settles which template and settles nothing else: the executable still has to be invocable, the named template still has to be in the inventory, and the target directory still has to exist and be a repository the developer can revert. Its Step 0 establishes all three, asking before each; its Step 3 then takes the named reference as the selection instead of matching descriptions |
| Add a unit inside ground an applied template already owns - one more screen, one more isolated UI unit | The skills that applied template activates in this project - read them from disk under `.frontx/ai/<template-identity>/`, where the apply wrote them. The base kit adds no unit itself |
| Move an applied template to a newer version | Step 0 of that same document, `skills/project-scaffolding/SKILL.md`, first - the executable and the project directory are its business here too - and then `frontx upgrade <projectRoot> <targetVersion>`, or its `--json` form, which emits the change set for review and reads a decision back before anything is applied |
| Understand the ecosystem - runtime substrate, type system, API surface, package boundaries | This document and the guidelines it ships with |
| Check that a template is publishable | The `frontx` executable directly - `frontx validate <templateDir>` |

**No `frontx` command that writes is reached straight from this table.** `seed`,
`add` and `upgrade` each write into a directory the developer keeps, and every
route ending in one of them passes through `frontx_project_scaffolding`'s Step 0
first, which establishes the executable, the inventory and the target directory
and puts a closed question before every command it runs. Only the reading
commands - `list`, `validate`, `help` - are invoked directly from a route here.

**A request that names its template is not an exception to that.** Reading it as
one is the failure this rule exists to stop: a session asked to scaffold a named
template into a new folder took the reference as licence to skip the capability,
ran `frontx seed` into a directory it had itself just created, asked nothing, and
handed back a project with provenance in it and no git repository around it. The
name answers "which template". It answers none of what the preflight asks.

If the request matches none of these, say so and name the capabilities above.
Do not route it to the closest one; a capability applied to a request it does
not serve produces a confident wrong answer.

**The route is not the capability.** This table names which document serves the
request and nothing more, so a request routed here and then answered from this
page alone has been answered without the steps that serve it: read the routed
document and follow it. The kit's remaining resources sit under this same root -
the standing agent rules at `AGENTS.md` beside this file, the package-boundary
guidelines under `guidelines/` - and are reached the same way, by path.
That holds wherever this kit root sits: alongside the other Constructor Studio
kits, or on its own as an agent skill the `frontx` CLI deployed.

<!-- frontx:routing:end -->

## Packages

| Package | Scope | Purpose |
|---|---|---|
| `@gears-frontx/mfes` | Ecosystem | MFE runtime substrate — registration, loading, isolation, mediation |
| `@gears-frontx/gts-plugin` | Ecosystem | GTS default type-system plugin |
| `@gears-frontx/api` | Ecosystem | API protocol surface — handler-agnostic fetch, cache sharing |
| `@gears-frontx/cli` | Ecosystem | Template resolution CLI — zero bundled template content (CLI-1) |
| `@gears-frontx/cyber-pilot-kit-frontx` | Ecosystem | This AI tooling kit |

## Architecture Principles

- **CLI-1**: CLI has zero dependency on any template; resolves by source-spec at runtime.
- **KIT-1**: All resource identifiers in this kit carry the `frontx_` prefix.
- **MFES-2 / MFES-3**: MFE packages do not depend on template packages.
- **API-1**: API package is handler-agnostic; mocks are template territory.
- **GTS-PLUGIN-2**: GTS plugin ships no solution schemas; schemas are template territory.

## Key Concepts

- **MFE** (Microfrontend): isolated UI unit registered through the MFE registry.
- **Extension domain**: capability grouping that governs which MFEs may mount in a given area.
- **Source-spec**: `host:owner/repo[//subtree]@ref` — the address the CLI resolves to a template at runtime; the optional `//subtree` addresses a template occupying a subdirectory of a repository.
- **Template**: an external project-type deliverable (not bundled into core packages).
- **Constructor Studio kit**: declarative content bundle installable via `cfs kit install`.
