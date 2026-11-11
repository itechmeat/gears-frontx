import { createContext, useContext } from 'react';

import type { PopoverContentProps } from '../../../popover/public.js';

type PortalContainer = PopoverContentProps['container'];

/*
 * Where the grid's popups portal, as passed to `DataGrid`'s `portalContainer` prop. Every popup
 * the grid and its plugins open hands it to its `*Content` as `container`. A context rather than a
 * grid store for the same reason as the label: it is read at render time only, and nothing
 * loads, persists or writes it from a second place.
 *
 * `undefined` is what a grid without the prop provides, and the popups then follow the kit overlay
 * order (see useResolvedPortalContainer): outside kit popups that arm the popup scope, that is the
 * nearest PortalContainerProvider's value, else <body>.
 */
const DataGridPortalContainerContext = createContext<PortalContainer>(undefined);

export const DataGridPortalContainerProvider = DataGridPortalContainerContext.Provider;

/**
 * The grid's `portalContainer` prop, or `undefined` when the grid has none.
 */
export function useDataGridPortalContainer(): PortalContainer {
  return useContext(DataGridPortalContainerContext);
}
