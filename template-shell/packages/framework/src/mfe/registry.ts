/**
 * MFE Registry Composition Root
 *
 * The now-deleted screensets assembly package used to own this singleton
 * (its old `mfe/runtime/index.ts`) as a "backward compatibility" re-export
 * shim over `@gears-frontx/mfes`. That package has been deleted with no
 * surviving shim (Stage 2b) — the singleton wiring is app-layer
 * composition, so it now lives here, in the template's framework package,
 * rather than in a core SDK package.
 *
 * This is the primary way application code obtains a MfeRegistry instance:
 * the factory accepts configuration (including a TypeSystemPlugin) and
 * returns the registry singleton. After the first `build()`, subsequent
 * calls return the cached instance.
 *
 * @packageDocumentation
 */

import { DefaultMfeRegistryFactory, type MfeRegistryFactory } from '@gears-frontx/mfes';

/**
 * Held to the published `@gears-frontx/mfes@0.3.0-alpha.1` surface this package
 * pins: alpha.1 exports the `DefaultMfeRegistryFactory` class and has no
 * `createMfeRegistryFactory` function, so the function form fails to compile
 * (TS2724) in every scaffolded project that installs the pin.
 *
 * ROLL BACK to `createMfeRegistryFactory()` when the pin moves to
 * `0.3.0-alpha.2` (#535) - that version replaces the class export with the
 * function, so the two forms never compile against the same version.
 */
export const mfeRegistryFactory: MfeRegistryFactory = new DefaultMfeRegistryFactory();
