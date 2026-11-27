import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Accessibility,
  Check,
  Contrast,
  Eye,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Settings2,
  Type,
  X,
} from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { AccessibilityProfile, useAccessibility } from '../context/AccessibilityContext';

const words = {
  en: {
    title: 'Accessibility settings',
    close: 'Close accessibility settings',
    language: 'Language',
    english: 'English',
    filipino: 'Filipino',
    profiles: 'Accessibility profiles',
    profileHint: 'Choose a preset, then adjust any setting below.',
    senior: 'Senior citizen',
    visual: 'Visual impairment',
    cognitive: 'Cognitive accessibility',
    motor: 'Motor accessibility',
    default: 'Default settings',
    textSize: 'Text size',
    decreaseTextSize: 'Decrease text size',
    increaseTextSize: 'Increase text size',
    resetSize: 'Reset text size',
    contrast: 'Contrast',
    normal: 'Normal',
    high: 'High contrast',
    smart: 'Smart contrast',
    options: 'Additional options',
    highlight: 'Highlight links and controls',
    spacing: 'Increase text spacing',
    dyslexia: 'Dyslexia-friendly font',
    cursor: 'Larger cursor',
    targets: 'Larger touch targets',
    reduceMotion: 'Reduce animations',
    screenReader: 'Screen reader and keyboard support',
    screenReaderInfo: 'Keyboard navigation and visible focus are supported. Device screen readers can read semantic page content; this panel does not replace your device assistive technology.',
    resetAll: 'Reset all accessibility settings',
  },
  fil: {
    title: 'Mga setting ng accessibility',
    close: 'Isara ang mga setting ng accessibility',
    language: 'Wika',
    english: 'English',
    filipino: 'Filipino',
    profiles: 'Mga profile ng accessibility',
    profileHint: 'Pumili ng preset at baguhin ang mga setting sa ibaba kung kailangan.',
    senior: 'Para sa nakatatanda',
    visual: 'Para sa kapansanan sa paningin',
    cognitive: 'Mas madaling unawain',
    motor: 'Mas madaling galawin',
    default: 'Mga default na setting',
    textSize: 'Laki ng teksto',
    decreaseTextSize: 'Bawasan ang laki ng teksto',
    increaseTextSize: 'Lakihan ang teksto',
    resetSize: 'Ibalik ang laki ng teksto',
    contrast: 'Contrast',
    normal: 'Normal',
    high: 'Mataas na contrast',
    smart: 'Matalinong contrast',
    options: 'Iba pang opsyon',
    highlight: 'I-highlight ang mga link at control',
    spacing: 'Dagdagan ang pagitan ng teksto',
    dyslexia: 'Font na mas madaling basahin',
    cursor: 'Palakihin ang cursor',
    targets: 'Palakihin ang mga touch target',
    reduceMotion: 'Bawasan ang animation',
    screenReader: 'Suporta sa screen reader at keyboard',
    screenReaderInfo: 'May keyboard navigation at nakikitang focus. Mababasa ng screen reader ang semantic na nilalaman; hindi pinapalitan ng panel na ito ang assistive technology ng device.',
    resetAll: 'I-reset ang lahat ng accessibility setting',
  },
} as const;

const profileOptions: Array<{ id: AccessibilityProfile; icon: typeof Accessibility; label: 'senior' | 'visual' | 'cognitive' | 'motor' }> = [
  { id: 'senior', icon: Accessibility, label: 'senior' },
  { id: 'visual', icon: Eye, label: 'visual' },
  { id: 'cognitive', icon: Type, label: 'cognitive' },
  { id: 'motor', icon: MousePointer2, label: 'motor' },
];

export const AccessibilityTools: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { language, setLanguage } = useHealthCenter();
  const {
    settings,
    updateSettings,
    applyProfile,
    resetSettings,
  } = useAccessibility();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFilipino = language === 'fil';
  const t = words[language];

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const toggleSetting = (key: 'highlightLinks' | 'textSpacing' | 'dyslexiaFont' | 'largeCursor' | 'largeTouchTargets' | 'reduceMotion', value: boolean) => {
    updateSettings({ [key]: value });
  };

  const resetAll = () => {
    resetSettings();
    setLanguage('en');
  };

  if (!open) return null;

  return createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 sm:items-center sm:justify-center sm:p-5"
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
          data-accessibility-ui
        >
          <section
            ref={panelRef}
            id="accessibility-settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-panel-title"
            className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[#cbd8d0] bg-white shadow-2xl sm:max-h-[min(92dvh,780px)] sm:rounded-xl"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#dce7e1] bg-[#0f4d3c] px-4 py-3 text-white sm:px-5">
              <h2 id="accessibility-panel-title" className="text-base font-bold sm:text-lg">{t.title}</h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
              <section aria-labelledby="accessibility-language-title">
                <h3 id="accessibility-language-title" className="mb-2 text-sm font-bold text-[#17312e]">{t.language}</h3>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.language}>
                  {(['en', 'fil'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={language === option}
                      onClick={() => setLanguage(option)}
                      className={`flex min-h-12 items-center justify-between rounded-md border px-3 text-sm font-semibold ${language === option ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}
                    >
                      {option === 'en' ? t.english : t.filipino}
                      {language === option && <Check className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </section>

              <section aria-labelledby="accessibility-profiles-title">
                <div className="mb-1 flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-[#17645c]" aria-hidden="true" />
                  <h3 id="accessibility-profiles-title" className="text-sm font-bold text-[#17312e]">{t.profiles}</h3>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-[#66736f]">{t.profileHint}</p>
                <div className="grid grid-cols-2 gap-2">
                  {profileOptions.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={settings.profile === id}
                      onClick={() => applyProfile(id)}
                      className={`flex min-h-[4.25rem] items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold leading-snug sm:text-sm ${settings.profile === id ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#374151] hover:bg-[#f8faf9]'}`}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-[#17645c]" aria-hidden="true" />
                      {t[label]}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={settings.profile === 'default'}
                    onClick={() => applyProfile('default')}
                    className={`col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${settings.profile === 'default' ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />{t.default}
                  </button>
                </div>
              </section>

              <section aria-labelledby="accessibility-text-size-title">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 id="accessibility-text-size-title" className="text-sm font-bold text-[#17312e]">{t.textSize}</h3>
                  <span className="text-xs font-semibold text-[#66736f]">{Math.round(settings.textScale * 100)}%</span>
                </div>
                <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2">
                  <button type="button" aria-label={t.decreaseTextSize} disabled={settings.textScale <= 0.9} onClick={() => updateSettings({ textScale: Math.max(0.9, Math.round((settings.textScale - 0.1) * 10) / 10) })} className="flex h-12 w-12 items-center justify-center rounded-md border border-[#cbd8d0] disabled:opacity-40">
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <input aria-label={t.textSize} type="range" min="0.9" max="1.6" step="0.1" value={settings.textScale} onChange={(event) => updateSettings({ textScale: Number(event.target.value) })} className="w-full accent-[#17645c]" />
                  <button type="button" aria-label={t.increaseTextSize} disabled={settings.textScale >= 1.6} onClick={() => updateSettings({ textScale: Math.min(1.6, Math.round((settings.textScale + 0.1) * 10) / 10) })} className="flex h-12 w-12 items-center justify-center rounded-md border border-[#cbd8d0] disabled:opacity-40">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" onClick={() => updateSettings({ textScale: 1 })} className="mt-2 min-h-11 text-xs font-semibold text-[#17645c] underline underline-offset-2">{t.resetSize}</button>
              </section>

              <section aria-labelledby="accessibility-contrast-title">
                <div className="mb-2 flex items-center gap-2">
                  <Contrast className="h-4 w-4 text-[#17645c]" aria-hidden="true" />
                  <h3 id="accessibility-contrast-title" className="text-sm font-bold text-[#17312e]">{t.contrast}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'high', 'smart'] as const).map((contrast) => (
                    <button key={contrast} type="button" aria-pressed={settings.contrast === contrast} onClick={() => updateSettings({ contrast })} className={`min-h-12 rounded-md border px-2 text-xs font-semibold sm:text-sm ${settings.contrast === contrast ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}>
                      {t[contrast]}
                    </button>
                  ))}
                </div>
              </section>

              <section aria-labelledby="accessibility-options-title">
                <h3 id="accessibility-options-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17312e]">
                  <Settings2 className="h-4 w-4 text-[#17645c]" aria-hidden="true" />{t.options}
                </h3>
                <div className="divide-y divide-[#edf1ee] rounded-md border border-[#dce7e1] px-3">
                  {([
                    ['highlightLinks', 'highlight', settings.highlightLinks],
                    ['textSpacing', 'spacing', settings.textSpacing],
                    ['dyslexiaFont', 'dyslexia', settings.dyslexiaFont],
                    ['largeCursor', 'cursor', settings.largeCursor],
                    ['largeTouchTargets', 'targets', settings.largeTouchTargets],
                    ['reduceMotion', 'reduceMotion', settings.reduceMotion],
                  ] as const).map(([key, label, checked]) => (
                    <label key={key} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2 text-sm text-[#374151]">
                      <span>{t[label]}</span>
                      <input type="checkbox" checked={checked} onChange={(event) => toggleSetting(key, event.target.checked)} className="h-5 w-5 shrink-0 accent-[#17645c]" />
                    </label>
                  ))}
                </div>
              </section>

              <section aria-labelledby="accessibility-screen-reader-title" className="rounded-md border border-sky-200 bg-sky-50 p-3">
                <h3 id="accessibility-screen-reader-title" className="flex items-center gap-2 text-sm font-bold text-sky-950">
                  <Eye className="h-4 w-4" aria-hidden="true" />{t.screenReader}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-sky-900">{t.screenReaderInfo}</p>
              </section>

              <button type="button" onClick={resetAll} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-bold text-rose-800 hover:bg-rose-50">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />{t.resetAll}
              </button>
            </div>
          </section>
        </div>,
    document.body,
  );
};
