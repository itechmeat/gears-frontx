// @cpt-algo:cpt-frontx-algo-studio-devtools-clamp-to-viewport:p1
// @cpt-algo:cpt-frontx-algo-studio-devtools-default-position:p1
// @cpt-algo:cpt-frontx-algo-studio-devtools-event-routing:p1
// @cpt-flow:cpt-frontx-flow-studio-devtools-drag-panel:p1
// @cpt-flow:cpt-frontx-flow-studio-devtools-drag-button:p1
// @cpt-flow:cpt-frontx-flow-studio-devtools-viewport-clamp:p1
// @cpt-dod:cpt-frontx-dod-studio-devtools-viewport-clamping:p1
// @cpt-state:cpt-frontx-state-studio-devtools-drag:p1
import { useState, useEffect, useRef, useCallback } from 'react';
import { clamp } from 'lodash';
import { eventBus } from '@gears-frontx/react';
import type { Anchor, Size } from '../types';
import { loadStudioState } from '../utils/persistence';
import { STORAGE_KEYS, STUDIO_VIEWPORT_MARGIN } from '../types';
import { StudioEvents } from '../events/studioEvents';

/**
 * The anchor Studio uses until someone drags it: flush into the bottom-right
 * corner, one margin off each edge.
 */
const DEFAULT_ANCHOR: Anchor = {
  right: STUDIO_VIEWPORT_MARGIN,
  bottom: STUDIO_VIEWPORT_MARGIN,
};

/**
 * Reads a stored anchor, rejecting anything that is not one.
 *
 * Studio used to persist `{ x, y }` viewport coordinates under these same keys,
 * so any browser that ran an older build still has a pair of numbers there that
 * means something else entirely. Restoring one as an anchor would put the widget
 * at a mirrored, meaningless spot, so a stored value is used only when it is
 * shaped like an anchor; the previous schema is not migrated but dropped, which
 * returns the widget to the corner exactly once and costs a dev tool nothing.
 */
// @cpt-begin:cpt-frontx-algo-studio-devtools-default-position:p1:inst-1
function loadAnchor(storageKey: string): Anchor {
  const stored: unknown = loadStudioState<unknown>(storageKey, null);
  if (
    typeof stored === 'object' &&
    stored !== null &&
    'right' in stored &&
    'bottom' in stored &&
    typeof (stored as Anchor).right === 'number' &&
    typeof (stored as Anchor).bottom === 'number'
  ) {
    return { right: (stored as Anchor).right, bottom: (stored as Anchor).bottom };
  }
  return DEFAULT_ANCHOR;
}
// @cpt-end:cpt-frontx-algo-studio-devtools-default-position:p1:inst-1

/**
 * Holds the widget inside the viewport.
 *
 * Only a lower and an upper bound: the anchor already keeps its distance from
 * the bottom-right corner at every viewport size, so this exists for the one
 * case that distance cannot cover - a viewport too small to seat the widget at
 * the anchor the user chose, where the far edge would otherwise push it off
 * screen. `Math.max` on the upper bound keeps the range non-empty when the
 * widget is larger than the viewport, so a phone-sized window pins it to the
 * margin rather than inverting the clamp.
 */
// @cpt-begin:cpt-frontx-algo-studio-devtools-clamp-to-viewport:p1:inst-1
function clampToViewport(anchor: Anchor, size: Size): Anchor {
  const maxRight = Math.max(
    STUDIO_VIEWPORT_MARGIN,
    window.innerWidth - size.width - STUDIO_VIEWPORT_MARGIN
  );
  const maxBottom = Math.max(
    STUDIO_VIEWPORT_MARGIN,
    window.innerHeight - size.height - STUDIO_VIEWPORT_MARGIN
  );
  return {
    right: clamp(anchor.right, STUDIO_VIEWPORT_MARGIN, maxRight),
    bottom: clamp(anchor.bottom, STUDIO_VIEWPORT_MARGIN, maxBottom),
  };
}
// @cpt-end:cpt-frontx-algo-studio-devtools-clamp-to-viewport:p1:inst-1

interface UseDraggableProps {
  panelSize: Size;
  storageKey?: string;
}

// @cpt-begin:cpt-frontx-algo-studio-devtools-event-routing:p1:inst-1
// @cpt-begin:cpt-frontx-flow-studio-devtools-drag-panel:p1:inst-1
// @cpt-begin:cpt-frontx-flow-studio-devtools-drag-button:p1:inst-1
// @cpt-begin:cpt-frontx-flow-studio-devtools-viewport-clamp:p1:inst-1
// @cpt-begin:cpt-frontx-state-studio-devtools-drag:p1:inst-1
export const useDraggable = ({ panelSize, storageKey = STORAGE_KEYS.POSITION }: UseDraggableProps) => {
  const [anchor, setAnchor] = useState<Anchor>(() =>
    clampToViewport(loadAnchor(storageKey), panelSize)
  );
  const [isDragging, setIsDragging] = useState(false);
  /*
   * The pointer's offset inside the widget, captured at mousedown and held for
   * the length of the gesture. Kept as the distance to the widget's *far*
   * edges, in the same sense as the anchor, so a move is one subtraction and
   * the widget does not jump to centre itself under the cursor.
   */
  const grabOffset = useRef<Anchor>({ right: 0, bottom: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    grabOffset.current = {
      right: window.innerWidth - e.clientX - anchor.right,
      bottom: window.innerHeight - e.clientY - anchor.bottom,
    };
  }, [anchor]);

  const emitAnchor = useCallback((next: Anchor) => {
    eventBus.emit(
      storageKey === STORAGE_KEYS.BUTTON_POSITION
        ? StudioEvents.ButtonPositionChanged
        : StudioEvents.PositionChanged,
      { position: next }
    );
  }, [storageKey]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const next = clampToViewport(
        {
          right: window.innerWidth - e.clientX - grabOffset.current.right,
          bottom: window.innerHeight - e.clientY - grabOffset.current.bottom,
        },
        panelSize
      );
      setAnchor(next);
      emitAnchor(next);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, panelSize, emitAnchor]);

  /*
   * A resize no longer has to move the widget to keep it in its corner - the
   * anchor does that on its own. This is only the reachability guard: it fires
   * when the viewport has shrunk past what the current anchor can seat, and
   * does nothing at all when it has grown, which is the case that used to
   * strand the widget mid-screen.
   */
  useEffect(() => {
    const handleResize = () => {
      setAnchor((prev) => {
        const clamped = clampToViewport(prev, panelSize);
        if (clamped.right === prev.right && clamped.bottom === prev.bottom) return prev;
        emitAnchor(clamped);
        return clamped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelSize, emitAnchor]);

  return {
    anchor,
    isDragging,
    handleMouseDown,
  };
};
// @cpt-end:cpt-frontx-algo-studio-devtools-event-routing:p1:inst-1
// @cpt-end:cpt-frontx-flow-studio-devtools-drag-panel:p1:inst-1
// @cpt-end:cpt-frontx-flow-studio-devtools-drag-button:p1:inst-1
// @cpt-end:cpt-frontx-flow-studio-devtools-viewport-clamp:p1:inst-1
// @cpt-end:cpt-frontx-state-studio-devtools-drag:p1:inst-1
