/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FrontXProvider, apiRegistry, createFrontXApp, MfeHandlerMF, gtsPlugin, FRONTX_MFE_ENTRY_MF, themeSchema, languageSchema, extensionScreenSchema } from '@gears-frontx/react';
import { Toaster } from '@/app/components/ui/sonner';
import { AccountsApiService } from '@/app/api';
import './globals.css'; // Global styles with CSS variables
import '@/app/events/bootstrapEvents'; // Register app-level events (type augmentation)
import { registerBootstrapEffects } from '@/app/effects/bootstrapEffects'; // Register app-level effects
import App from './App';

// The `constructor` brand theme in its two colour schemes; the tokens
// themselves are linked as a stylesheet by index.html.
import { DEFAULT_THEME_ID, frontxThemes } from '@/app/themes';
import { KitProviders } from '@/app/kit/KitProviders';

// Register application-specific GTS schemas before constructing the FrontX app.
// These derived schemas encode application-level constraints (valid theme names,
// supported languages, screen extension shape) and are not part of the core
// type system in @gears-frontx/gts-plugin.
gtsPlugin.registerSchema(themeSchema);
gtsPlugin.registerSchema(languageSchema);
gtsPlugin.registerSchema(extensionScreenSchema);

// Register accounts service (application-level service for user info)
apiRegistry.register(AccountsApiService);

// Initialize API services
apiRegistry.initialize({});

// Create FrontX app instance
// Register MfeHandlerMF to enable Module Federation MFE loading
const app = createFrontXApp({
  microfrontends: {
    typeSystem: gtsPlugin,
    mfeHandlers: [new MfeHandlerMF(FRONTX_MFE_ENTRY_MF)],
  },
});

// Register app-level effects (pass store dispatch)
registerBootstrapEffects(app.store.dispatch);

// Register the themes in the order the Studio dropdown lists them; the light
// scheme carries default:true and activates on registration.
for (const theme of frontxThemes) {
  app.themeRegistry.register(theme);
}

// Apply default theme explicitly
app.themeRegistry.apply(DEFAULT_THEME_ID);

/**
 * Render application
 * Bootstrap happens automatically when Layout mounts
 *
 * Flow:
 * 1. App renders → Layout mounts → bootstrap dispatched
 * 2. Components show skeleton loaders (translationsReady = false)
 * 3. User fetched → language set → translations loaded
 * 4. Components re-render with actual text (translationsReady = true)
 * 5. MFE system loads and mounts extensions via MfeScreenContainer
 *
 * Note: Mock API is controlled via the FrontX Studio panel.
 * The mock plugin (included in full preset) handles mock plugin lifecycle automatically.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrontXProvider app={app}>
      {/*
        Inside FrontXProvider, because the kit's colour scheme is driven from
        the theme registry; outside App, so the chrome and every dialog the
        shell portals into document.body share one kit context.
      */}
      <KitProviders>
        <App />
        <Toaster />
      </KitProviders>
    </FrontXProvider>
  </StrictMode>
);
