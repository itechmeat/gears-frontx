import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@gears-frontx/react';
import { StudioEvents } from '../events/studioEvents';
import { STORAGE_KEYS, STUDIO_VIEWPORT_MARGIN } from '../types';
import { useDraggable } from './useDraggable';

vi.mock('@gears-frontx/react', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

const setViewport = (width: number, height: number) => {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(globalThis, 'innerHeight', { value: height, configurable: true });
};

describe('useDraggable', () => {
  beforeEach(() => {
    setViewport(1200, 900);
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens in the bottom-right corner, one margin off each edge', () => {
    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 300 } })
    );

    expect(result.current.anchor).toEqual({
      right: STUDIO_VIEWPORT_MARGIN,
      bottom: STUDIO_VIEWPORT_MARGIN,
    });
  });

  // The regression this hook exists to prevent. An anchor measured from the
  // bottom-right corner is viewport-independent, so growing the viewport must
  // leave it untouched - and therefore leave the widget in the corner. The
  // left/top scheme this replaced kept its old coordinate here, which put the
  // widget in the middle of the enlarged screen.
  it('stays in the corner when the viewport grows', () => {
    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 300 } })
    );

    setViewport(1920, 1200);
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });

    expect(result.current.anchor).toEqual({
      right: STUDIO_VIEWPORT_MARGIN,
      bottom: STUDIO_VIEWPORT_MARGIN,
    });
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it('pulls the widget back in when the viewport shrinks past it', () => {
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify({ right: 760, bottom: 560 }));

    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 300 } })
    );
    expect(result.current.anchor).toEqual({ right: 760, bottom: 560 });

    setViewport(700, 500);
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });

    expect(result.current.anchor).toEqual({ right: 284, bottom: 184 });
    expect(eventBus.emit).toHaveBeenCalledWith(StudioEvents.PositionChanged, {
      position: { right: 284, bottom: 184 },
    });
  });

  // Older builds persisted `{ x, y }` viewport coordinates under these keys. A
  // pair of numbers that means the opposite corner must not be read as an
  // anchor, or every browser that ever ran Studio would restore the widget to a
  // mirrored spot instead of the corner.
  it('ignores a position stored under the previous left/top schema', () => {
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify({ x: 4000, y: -50 }));

    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 300 } })
    );

    expect(result.current.anchor).toEqual({
      right: STUDIO_VIEWPORT_MARGIN,
      bottom: STUDIO_VIEWPORT_MARGIN,
    });
  });

  it('emits anchor changes while dragging the panel', () => {
    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 300 } })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 790, clientY: 590 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 620, clientY: 440 }));
    });

    // The pointer moved 170px left and 150px up, so both gaps grow by that much.
    expect(result.current.anchor).toEqual({ right: 186, bottom: 166 });
    expect(eventBus.emit).toHaveBeenCalledWith(StudioEvents.PositionChanged, {
      position: { right: 186, bottom: 166 },
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('routes collapsed button drags through the button position event', () => {
    const { result } = renderHook(() =>
      useDraggable({
        panelSize: { width: 48, height: 48 },
        storageKey: STORAGE_KEYS.BUTTON_POSITION,
      })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 1140, clientY: 840 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 868, clientY: 568 }));
    });

    expect(eventBus.emit).toHaveBeenCalledWith(StudioEvents.ButtonPositionChanged, {
      position: { right: 288, bottom: 288 },
    });
  });

  // A viewport smaller than the widget has no room for the margin on both
  // sides; the clamp must still produce a reachable anchor rather than an
  // inverted range.
  it('pins the widget to the margin when the viewport is smaller than it is', () => {
    setViewport(320, 300);

    const { result } = renderHook(() =>
      useDraggable({ panelSize: { width: 400, height: 500 } })
    );

    expect(result.current.anchor).toEqual({
      right: STUDIO_VIEWPORT_MARGIN,
      bottom: STUDIO_VIEWPORT_MARGIN,
    });
  });
});
