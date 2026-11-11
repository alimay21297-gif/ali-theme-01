import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalligraphy } from '../../app/hooks/useCalligraphy';

const state = { settings: {} as Record<string, unknown> };

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme: { settings: state.settings } }),
}));

const opacity = (scale?: number) =>
  (renderHook(() => useCalligraphy(scale)).result.current.style as Record<string, number>)[
    '--calligraphy-opacity'
  ];

describe('useCalligraphy', () => {
  it('uses the chosen strength, standard (0.08) when unset', () => {
    state.settings = {};
    expect(opacity()).toBe(0.08);
    state.settings = { calligraphy_bg_strength: 'strong' };
    expect(opacity()).toBe(0.12);
  });

  it('falls back to standard for an unknown strength, including inherited object keys', () => {
    for (const value of ['loud', 'toString', 'constructor', '__proto__']) {
      state.settings = { calligraphy_bg_strength: value };
      expect(opacity()).toBe(0.08);
    }
  });

  it('scales the strength for a quieter surface (footer: 60%)', () => {
    state.settings = { calligraphy_bg_strength: 'standard' };
    expect(opacity(0.6)).toBe(0.048);
    state.settings = { calligraphy_bg_strength: 'strong' };
    expect(opacity(0.6)).toBe(0.072);
  });

  it('is off when the switch is off', () => {
    state.settings = { calligraphy_bg_enabled: false };
    const { result } = renderHook(() => useCalligraphy(0.6));
    expect(result.current).toEqual({ className: '', style: undefined });
  });
});
