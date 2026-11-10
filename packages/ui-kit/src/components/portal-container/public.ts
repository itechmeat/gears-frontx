'use client';

/*
 * The directive is load-bearing here, not just on portal-container.tsx: the
 * provider module is shared by every overlay that resolves a portal target,
 * so Rollup hoists it into a shared chunk and this entry publishes as a bare
 * re-export facade. The build derives each chunk's 'use client' banner from
 * the modules that chunk contains, so the facade carries the banner only if
 * this file declares it - and it must, because a Server Component importing
 * @gears-frontx/ui-kit/portal-container gets exactly this chunk, and
 * PortalContainerProvider reads context in its render.
 */
export {
  PortalContainerProvider,
  type PortalContainerProviderProps,
  usePortalContainer,
  type PortalContainer,
} from './portal-container.js';
