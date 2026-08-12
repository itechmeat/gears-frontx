/// <reference types="node" />
// @cpt-dod:cpt-frontx-dod-unit-test-generation-and-agent-verification-standard-test-convention:p1
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { defineMfeProject } from '../../vitest.mfe.base';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  defineMfeProject(__dirname),
  defineConfig({
    test: {
      /*
       * Vitest resolves a stylesheet import to an empty string unless CSS is
       * processed, and the screen's own CSS Module is what carries its class
       * names into the rendered markup.
       */
      css: true,
      server: {
        deps: {
          /*
           * @constructor/react-kit ships one CSS Module per component and each
           * emitted chunk imports its own stylesheet. Left external, those
           * imports reach Node's ESM loader, which has no `.css` extension
           * handler and fails the whole suite before a single test runs.
           * Inlining hands them back to Vite, which resolves a stylesheet
           * import in a test environment to nothing.
           */
          inline: ['@constructor/react-kit'],
        },
      },
    },
  })
);
