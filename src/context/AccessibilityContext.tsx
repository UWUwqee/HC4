import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AccessibilityProfile = 'default' | 'senior' | 'visual' | 'cognitive' | 'motor' | 'custom';
export type ContrastMode = 'normal' | 'high' | 'smart';

export interface AccessibilitySettings {
  profile: AccessibilityProfile;
  textScale: number;
  contrast: ContrastMode;
  highlightLinks: boolean;
  textSpacing: boolean;
  dyslexiaFont: boolean;
  largeCursor: boolean;
  largeTouchTargets: boolean;
  reduceMotion: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  applyProfile: (profile: AccessibilityProfile) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'delfin-salonga-accessibility-settings';
const defaultSettings: AccessibilitySettings = {
  profile: 'default',
  textScale: 1,
  contrast: 'normal',
  highlightLinks: false,
  textSpacing: false,
  dyslexiaFont: false,
  largeCursor: false,
  largeTouchTargets: false,
  reduceMotion: false,
};

const profiles: Record<Exclude<AccessibilityProfile, 'default' | 'custom'>, Partial<AccessibilitySettings>> = {
  senior: { textScale: 1.2, contrast: 'smart', highlightLinks: true, largeTouchTargets: true, reduceMotion: true },
  visual: { textScale: 1.25, contrast: 'high', highlightLinks: true, textSpacing: true, largeCursor: true },
  cognitive: { textScale: 1.1, contrast: 'smart', highlightLinks: true, reduceMotion: true },
  motor: { largeTouchTargets: true, largeCursor: true, reduceMotion: true },
};

function readSettings(): AccessibilitySettings {
  let legacyMode: string | null;
  let stored: string | null;
  try {
    legacyMode = localStorage.getItem('delfin-salonga-accessibility');
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Accessibility preferences could not be read:', error);
    return defaultSettings;
  }
  const defaults = legacyMode === 'high-contrast'
    ? { ...defaultSettings, contrast: 'high' as const }
    : legacyMode === 'large-text'
      ? { ...defaultSettings, textScale: 1.125 }
      : defaultSettings;
  if (!stored) return defaults;

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch (error) {
    console.error('Accessibility preferences could not be parsed:', error);
    return defaults;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const settings = value as Record<string, unknown>;
  const profile = ['default', 'senior', 'visual', 'cognitive', 'motor', 'custom'].includes(String(settings.profile))
    ? settings.profile as AccessibilityProfile
    : defaults.profile;
  const contrast = ['normal', 'high', 'smart'].includes(String(settings.contrast))
    ? settings.contrast as ContrastMode
    : defaults.contrast;
  return {
    profile,
    textScale: typeof settings.textScale === 'number' && Number.isFinite(settings.textScale)
      ? Math.min(1.6, Math.max(0.9, settings.textScale))
      : defaults.textScale,
    contrast,
    highlightLinks: typeof settings.highlightLinks === 'boolean' ? settings.highlightLinks : defaults.highlightLinks,
    textSpacing: typeof settings.textSpacing === 'boolean' ? settings.textSpacing : defaults.textSpacing,
    dyslexiaFont: typeof settings.dyslexiaFont === 'boolean' ? settings.dyslexiaFont : defaults.dyslexiaFont,
    largeCursor: typeof settings.largeCursor === 'boolean' ? settings.largeCursor : defaults.largeCursor,
    largeTouchTargets: typeof settings.largeTouchTargets === 'boolean' ? settings.largeTouchTargets : defaults.largeTouchTargets,
    reduceMotion: typeof settings.reduceMotion === 'boolean' ? settings.reduceMotion : defaults.reduceMotion,
  };
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Accessibility preferences could not be saved:', error);
    }
    const root = document.documentElement;
    root.dataset.accessibilityContrast = settings.contrast;
    root.dataset.accessibilityHighlightLinks = String(settings.highlightLinks);
    root.dataset.accessibilityTextSpacing = String(settings.textSpacing);
    root.dataset.accessibilityDyslexiaFont = String(settings.dyslexiaFont);
    root.dataset.accessibilityLargeCursor = String(settings.largeCursor);
    root.dataset.accessibilityTouchTargets = String(settings.largeTouchTargets);
    root.dataset.accessibilityReduceMotion = String(settings.reduceMotion);
    root.style.setProperty('--accessibility-font-scale', String(settings.textScale));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((current) => ({ ...current, ...patch, profile: 'custom' }));
  }, []);

  const applyProfile = useCallback((profile: AccessibilityProfile) => {
    if (profile === 'default') {
      setSettings(defaultSettings);
      return;
    }
    if (profile !== 'custom') setSettings({ ...defaultSettings, ...profiles[profile], profile });
  }, []);

  const resetSettings = useCallback(() => setSettings(defaultSettings), []);
  const value = useMemo(() => ({ settings, updateSettings, applyProfile, resetSettings }), [
    settings, updateSettings, applyProfile, resetSettings,
  ]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider.');
  return context;
}
