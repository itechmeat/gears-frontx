'use client';

/*
 * The directive is load-bearing here, not just on portal-container.tsx: the
 * provider module is shared by every overlay that resolves a portal target,
 * so Rollup hoists it into a shared chunk and this entry publishes as a bare
 * re-export facade. The build derives each chunk's 'use client' banner from
 * the modules that chunk contains, and a facade contains only this file, so
 * the facade carries the banner only if this file declares it. Every
 * published client entry carries the banner itself (verify-consumer.sh
 * checks it), so the client boundary is visible at the subpath without
 * following the re-export, and PortalContainerProvider reads context in its
 * render.
 */
export {
  PortalContainerProvider,
  type PortalContainerProviderProps,
  usePortalContainer,
  type PortalContainer,
} from './portal-container.js';
