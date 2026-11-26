import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Accessibility, Check, Contrast, Eye, Minus, MousePointer2, Plus, RotateCcw, Settings2, Type, X } from 'lucide-react';
import { useAccessibility, type AccessibilityProfile } from '../context/AccessibilityContext';
import { useHealthCenter } from '../context/HealthCenterContext';

const profiles: Array<{ id: AccessibilityProfile; icon: typeof Accessibility; en: string; fil: string }> = [
  { id: 'senior', icon: Accessibility, en: 'Senior citizen', fil: 'Para sa nakatatanda' },
  { id: 'visual', icon: Eye, en: 'Visual impairment', fil: 'Para sa kapansanan sa paningin' },
  { id: 'cognitive', icon: Type, en: 'Cognitive accessibility', fil: 'Mas madaling unawain' },
  { id: 'motor', icon: MousePointer2, en: 'Motor accessibility', fil: 'Mas madaling galawin' },
];

export const AccessibilityTools: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { language, setLanguage } = useHealthCenter();
  const { settings, updateSettings, applyProfile, resetSettings } = useAccessibility();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fil = language === 'fil';
  const text = {
    title: fil ? 'Mga setting ng accessibility' : 'Accessibility settings',
    close: fil ? 'Isara ang accessibility settings' : 'Close accessibility settings',
    language: fil ? 'Wika' : 'Language',
    english: 'English',
    filipino: 'Filipino',
    profiles: fil ? 'Mga profile ng accessibility' : 'Accessibility profiles',
    profileHint: fil ? 'Pumili ng preset at baguhin ang mga setting sa ibaba kung kailangan.' : 'Choose a preset, then adjust the settings below.',
    textSize: fil ? 'Laki ng teksto' : 'Text size',
    contrast: fil ? 'Contrast' : 'Contrast',
    options: fil ? 'Iba pang opsyon' : 'Additional options',
    reset: fil ? 'I-reset ang lahat ng setting' : 'Reset all settings',
    normal: fil ? 'Normal' : 'Normal',
    high: fil ? 'Mataas' : 'High contrast',
    smart: fil ? 'Matalino' : 'Smart contrast',
    screenReader: fil ? 'Suporta sa screen reader at keyboard' : 'Screen reader and keyboard support',
    screenReaderInfo: fil
      ? 'May keyboard navigation at nakikitang focus. Mababasa ng screen reader ang semantic na nilalaman; hindi pinapalitan ng panel na ito ang assistive technology ng device.'
      : 'Keyboard navigation and visible focus are supported. Device screen readers can read semantic page content; this panel does not replace your device assistive technology.',
  };
  const options = [
    ['highlightLinks', fil ? 'I-highlight ang mga link at control' : 'Highlight links and controls'],
    ['textSpacing', fil ? 'Dagdagan ang pagitan ng teksto' : 'Increase text spacing'],
    ['dyslexiaFont', fil ? 'Font na mas madaling basahin' : 'Dyslexia-friendly font'],
    ['largeCursor', fil ? 'Palakihin ang cursor' : 'Larger cursor'],
    ['largeTouchTargets', fil ? 'Palakihin ang touch target' : 'Larger touch targets'],
    ['reduceMotion', fil ? 'Bawasan ang animation' : 'Reduce animations'],
  ] as const;
  const resetAll = () => {
    resetSettings();
    setLanguage('en');
  };

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      data-accessibility-ui
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden border border-[#cbd8d0] bg-white shadow-2xl sm:rounded-md"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#0f4d3c] px-4 py-3 text-white sm:px-5">
          <h2 id="accessibility-title" className="text-base font-bold sm:text-lg">{text.title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={text.close} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <section aria-labelledby="accessibility-language">
            <h3 id="accessibility-language" className="mb-2 text-sm font-bold text-[#17312e]">{text.language}</h3>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={text.language}>
              {(['en', 'fil'] as const).map((option) => (
                <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)} className={`flex min-h-12 items-center justify-between border px-3 text-sm font-semibold ${language === option ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}>
                  {option === 'en' ? text.english : text.filipino}
                  {language === option && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="accessibility-profiles">
            <h3 id="accessibility-profiles" className="mb-1 flex items-center gap-2 text-sm font-bold text-[#17312e]">
              <Accessibility className="h-4 w-4 text-[#17645c]" aria-hidden="true" />{text.profiles}
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-[#66736f]">{text.profileHint}</p>
            <div className="grid grid-cols-2 gap-2">
              {profiles.map(({ id, icon: Icon, en, fil: filLabel }) => (
                <button key={id} type="button" aria-pressed={settings.profile === id} onClick={() => applyProfile(id)} className={`flex min-h-12 items-center gap-2 border px-3 py-2 text-left text-xs font-semibold sm:text-sm ${settings.profile === id ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#374151] hover:bg-[#f8faf9]'}`}>
                  <Icon className="h-5 w-5 shrink-0 text-[#17645c]" aria-hidden="true" />{fil ? filLabel : en}
                </button>
              ))}
              <button type="button" aria-pressed={settings.profile === 'default'} onClick={() => applyProfile('default')} className={`col-span-2 flex min-h-11 items-center justify-center gap-2 border px-3 py-2 text-sm font-semibold ${settings.profile === 'default' ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />{fil ? 'Mga default na setting' : 'Default settings'}
              </button>
            </div>
          </section>

          <section aria-labelledby="accessibility-text-size">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id="accessibility-text-size" className="text-sm font-bold text-[#17312e]">{text.textSize}</h3>
              <span className="text-xs font-semibold text-[#66736f]">{Math.round(settings.textScale * 100)}%</span>
            </div>
            <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2">
              <button type="button" aria-label={fil ? 'Bawasan ang laki ng teksto' : 'Decrease text size'} disabled={settings.textScale <= 0.9} onClick={() => updateSettings({ textScale: Math.max(0.9, Math.round((settings.textScale - 0.1) * 10) / 10) })} className="flex h-11 w-11 items-center justify-center border border-[#cbd8d0] disabled:opacity-40"><Minus className="h-4 w-4" /></button>
              <input aria-label={text.textSize} type="range" min="0.9" max="1.6" step="0.1" value={settings.textScale} onChange={(event) => updateSettings({ textScale: Number(event.target.value) })} className="w-full accent-[#17645c]" />
              <button type="button" aria-label={fil ? 'Lakihan ang teksto' : 'Increase text size'} disabled={settings.textScale >= 1.6} onClick={() => updateSettings({ textScale: Math.min(1.6, Math.round((settings.textScale + 0.1) * 10) / 10) })} className="flex h-11 w-11 items-center justify-center border border-[#cbd8d0] disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => updateSettings({ textScale: 1 })} className="mt-2 min-h-11 text-xs font-semibold text-[#17645c] underline underline-offset-2">{fil ? 'Ibalik ang laki ng teksto' : 'Reset text size'}</button>
          </section>

          <section aria-labelledby="accessibility-contrast">
            <h3 id="accessibility-contrast" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17312e]"><Contrast className="h-4 w-4 text-[#17645c]" aria-hidden="true" />{text.contrast}</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'high', 'smart'] as const).map((contrast) => (
                <button key={contrast} type="button" aria-pressed={settings.contrast === contrast} onClick={() => updateSettings({ contrast })} className={`min-h-11 border px-2 text-xs font-semibold sm:text-sm ${settings.contrast === contrast ? 'border-[#17645c] bg-[#eaf3ee] text-[#0f4d3c]' : 'border-[#dce7e1] text-[#4b5563] hover:bg-[#f8faf9]'}`}>{text[contrast]}</button>
              ))}
            </div>
          </section>

          <section aria-labelledby="accessibility-options">
            <h3 id="accessibility-options" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#17312e]"><Settings2 className="h-4 w-4 text-[#17645c]" aria-hidden="true" />{text.options}</h3>
            <div className="divide-y divide-[#edf1ee] border border-[#dce7e1] px-3">
              {options.map(([key, label]) => (
                <label key={key} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2 text-sm text-[#374151]">
                  <span>{label}</span>
                  <input type="checkbox" checked={settings[key]} onChange={(event) => updateSettings({ [key]: event.target.checked })} className="h-5 w-5 shrink-0 accent-[#17645c]" />
                </label>
              ))}
            </div>
          </section>

          <section className="border border-sky-200 bg-sky-50 p-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-sky-950"><Eye className="h-4 w-4" aria-hidden="true" />{text.screenReader}</h3>
            <p className="mt-1 text-xs leading-relaxed text-sky-900">{text.screenReaderInfo}</p>
          </section>

          <button type="button" onClick={resetAll} className="flex min-h-12 w-full items-center justify-center gap-2 border border-rose-200 px-4 text-sm font-bold text-rose-800 hover:bg-rose-50">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{text.reset}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};
