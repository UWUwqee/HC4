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

const STORAGE_KEY = 'pateros_healthconnect_accessibility';

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

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  applyProfile: (profile: AccessibilityProfile) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readSettings(): AccessibilitySettings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaultSettings;
    const value = stored as Record<string, unknown>;
    return {
      ...defaultSettings,
      profile: ['default', 'senior', 'visual', 'cognitive', 'motor', 'custom'].includes(String(value.profile))
        ? value.profile as AccessibilityProfile
        : defaultSettings.profile,
      textScale: typeof value.textScale === 'number' ? Math.min(1.6, Math.max(0.9, value.textScale)) : 1,
      contrast: ['normal', 'high', 'smart'].includes(String(value.contrast))
        ? value.contrast as ContrastMode
        : defaultSettings.contrast,
      highlightLinks: typeof value.highlightLinks === 'boolean' ? value.highlightLinks : defaultSettings.highlightLinks,
      textSpacing: typeof value.textSpacing === 'boolean' ? value.textSpacing : defaultSettings.textSpacing,
      dyslexiaFont: typeof value.dyslexiaFont === 'boolean' ? value.dyslexiaFont : defaultSettings.dyslexiaFont,
      largeCursor: typeof value.largeCursor === 'boolean' ? value.largeCursor : defaultSettings.largeCursor,
      largeTouchTargets: typeof value.largeTouchTargets === 'boolean' ? value.largeTouchTargets : defaultSettings.largeTouchTargets,
      reduceMotion: typeof value.reduceMotion === 'boolean' ? value.reduceMotion : defaultSettings.reduceMotion,
    };
  } catch {
    return defaultSettings;
  }
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
    if (profile === 'custom') return;
    setSettings({ ...defaultSettings, ...profiles[profile], profile });
  }, []);

  const resetSettings = useCallback(() => setSettings(defaultSettings), []);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    applyProfile,
    resetSettings,
  }), [settings, updateSettings, applyProfile, resetSettings]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider.');
  return context;
}
