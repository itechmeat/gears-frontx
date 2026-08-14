/**
 * The applied theme has to reach `<html>` as one of the two colour-scheme
 * classes, because that is the only thing that resolves the `--acv-*` tokens
 * the whole shell - and, through inheritance, every MFE shadow root - is
 * painted from. Nothing else in the app asserts that hop, and a silent break
 * shows up as the shell ignoring the theme picker while every unit test stays
 * green.
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  ACV_COLOR_SCHEME_CLASS_DARK,
  ACV_COLOR_SCHEME_CLASS_LIGHT,
} from '@constructor/react-kit/color-scheme';

const mockUseTheme = vi.fn();

vi.mock('@gears-frontx/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, never>>()),
  useTheme: () => mockUseTheme(),
}));

const renderWithTheme = async (currentTheme: string | undefined) => {
  mockUseTheme.mockReturnValue({ currentTheme, themes: [], setTheme: vi.fn() });
  const { KitProviders } = await import('./KitProviders');
  render(<KitProviders>{null}</KitProviders>);
};

describe('KitProviders', () => {
  it.each([
    ['the dark theme', 'dark', ACV_COLOR_SCHEME_CLASS_DARK, ACV_COLOR_SCHEME_CLASS_LIGHT],
    ['the light theme', 'light', ACV_COLOR_SCHEME_CLASS_LIGHT, ACV_COLOR_SCHEME_CLASS_DARK],
    // A theme the shell does not register, and the frames before the registry
    // has applied anything: both fall back to light rather than to no class at
    // all, because with neither class present the design system reads
    // `prefers-color-scheme` and a machine set to dark mode paints dark
    // surfaces inside light chrome.
    ['an unregistered theme', 'aurora', ACV_COLOR_SCHEME_CLASS_LIGHT, ACV_COLOR_SCHEME_CLASS_DARK],
    ['no theme applied yet', undefined, ACV_COLOR_SCHEME_CLASS_LIGHT, ACV_COLOR_SCHEME_CLASS_DARK],
  ])('marks the document for %s', async (_case, themeId, expected, unexpected) => {
    await renderWithTheme(themeId);

    expect(document.documentElement.classList.contains(expected)).toBe(true);
    expect(document.documentElement.classList.contains(unexpected)).toBe(false);
  });
});
