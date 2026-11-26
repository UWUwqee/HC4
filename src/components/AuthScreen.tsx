import React, { useEffect, useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { X } from 'lucide-react';
import delfinLogo from '../assets/images/DELFIN.png';

const authAppearance = {
  variables: {
    colorPrimary: '#17645c',
    colorPrimaryForeground: '#ffffff',
    colorBackground: '#ffffff',
    colorForeground: '#17312e',
    colorMutedForeground: '#66736f',
    colorBorder: '#d9e1dc',
    colorInput: '#ffffff',
    colorInputForeground: '#17312e',
    colorRing: '#17645c',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    spacing: '0.75rem',
  },
  options: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  elements: {
    rootBox: { display: 'flex', width: '100%', minWidth: '0', maxWidth: '100%', justifyContent: 'center' },
    cardBox: { display: 'flex', width: '100%', minWidth: '0', maxWidth: '100%', justifyContent: 'center' },
    card: {
      width: '100%',
      minWidth: '0',
      maxWidth: '100%',
      boxSizing: 'border-box',
      border: '1px solid #d9e1dc',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      padding: '1.25rem',
      boxShadow: '0 8px 24px rgba(23, 58, 55, 0.12)',
    },
    headerTitle: { color: '#17312e', textAlign: 'center' },
    headerSubtitle: { color: '#66736f', textAlign: 'center' },
    formFieldLabel: { color: '#17312e' },
    formFieldHintText: { color: '#66736f' },
    formFieldErrorText: { color: '#be123c' },
    socialButtonsBlockButton: {
      borderColor: '#d9e1dc',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: 'none',
    },
    socialButtonsBlockButtonText: { color: '#17312e' },
    formFieldInput: {
      borderColor: '#cfd8d2',
      color: '#17312e',
      borderRadius: '8px',
      padding: '0.375rem 0.625rem',
    },
    phoneInputInput: { color: '#17312e' },
    dividerLine: { backgroundColor: '#d9e1dc' },
    dividerText: { color: '#66736f' },
    formButtonPrimary: {
      backgroundColor: '#17645c',
      borderRadius: '8px',
      padding: '0.375rem 0.75rem',
      boxShadow: 'none',
    },
    footerAction: { display: 'none' },
    footer: {
      backgroundColor: '#f8faf9',
      borderTop: '1px solid #d9e1dc',
      borderBottomLeftRadius: '12px',
      borderBottomRightRadius: '12px',
    },
    footerActionText: { color: '#66736f' },
    footerActionLink: { color: '#0f4d3c' },
    identityPreviewText: { color: '#17312e' },
  },
};

export const AuthScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 px-3 py-4 text-[#17312e] sm:px-4 sm:py-8"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      data-auth-dialog
    >
      <div className="flex min-h-full items-center justify-center">
        <section role="dialog" aria-modal="true" aria-label={isRegistering ? 'Create an account' : 'Log in'} className="relative mx-auto w-full min-w-0 max-w-[400px] border border-[#d9e1dc] bg-[#fbfcfa] shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
          <button type="button" onClick={onClose} aria-label="Close sign-in dialog" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f1f5f2] hover:text-[#17312e]">
            <X className="h-5 w-5" />
          </button>
          <div className="border-b border-[#dfe6e1] px-5 py-3">
            <div className="flex items-center gap-3">
              <img src={delfinLogo} alt="Delfin Salonga Health Center" className="h-9 w-9 shrink-0 rounded-full border border-[#dce7e1] object-cover" />
              <div>
                <div className="text-xs font-bold text-[#17312e]">Delfin Salonga Health Center</div>
                <div className="mt-0.5 text-[10px] text-[#66736f]">Health Center · Pateros</div>
              </div>
            </div>
          </div>
          <div className="flex w-full min-w-0 justify-center px-4 py-5 sm:px-5">
            {isRegistering ? (
              <SignUp routing="hash" signInUrl="#" appearance={authAppearance} />
            ) : (
              <SignIn routing="hash" signUpUrl="#" appearance={authAppearance} />
            )}
          </div>
          <div className="mx-5 border-t border-[#dfe6e1] py-3 text-center text-xs text-[#66736f]">
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering((registering) => !registering)}
              className="font-semibold text-[#0f4d3c] hover:text-[#17645c]"
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
