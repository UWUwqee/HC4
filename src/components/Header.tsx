import React, { useCallback, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { AccessibilityTools } from './AccessibilityTools';
import { Accessibility, LogIn, LogOut, Mail, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { isSignedIn, signOut } = useAuth();
  const {
    language,
    activeSection,
    setActiveSection,
    setAuthModalOpen,
    setMessagesOpen,
    unreadAdminMessageCount,
    unreadMessagesError,
  } = useHealthCenter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const closeAccessibility = useCallback(() => setAccessibilityOpen(false), []);

  const navLinks = [
    { id: 'overview', label: 'HOME' },
    { id: 'clinic-information', label: 'INFORMATION' },
    { id: 'appointment-schedule', label: 'SCHEDULE' },
    { id: 'services', label: 'SERVICES' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <header className="header-enter sticky top-0 z-40 border-b border-[#dce7e1] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-end gap-2 sm:gap-6 xl:justify-between">
          <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-[#6b7280]">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#2c7a5f] py-1 cursor-pointer ${
                  activeSection === item.id
                    ? 'text-[#0f4d3c] font-bold border-b-2 border-[#0f4d3c]'
                    : 'text-[#6b7280]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-4 shrink-0">
            <button type="button" onClick={() => setAccessibilityOpen(true)} aria-haspopup="dialog" aria-expanded={accessibilityOpen} aria-label={language === 'fil' ? 'Mga setting ng accessibility' : 'Accessibility settings'} title={language === 'fil' ? 'Mga setting ng accessibility' : 'Accessibility settings'} className="flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-[#4b5563] hover:bg-[#eaf3ee] hover:text-[#0f4d3c]">
              <Accessibility className="h-5 w-5" aria-hidden="true" />
              <span>{language === 'fil' ? 'Aksesibilidad' : 'Accessibility'}</span>
            </button>
            {isSignedIn && <button type="button" onClick={() => setMessagesOpen(true)} className="relative p-2 text-[#4b5563] hover:bg-[#eaf3ee] hover:text-[#0f4d3c]" aria-label={`Messages${unreadAdminMessageCount > 0 ? `, ${unreadAdminMessageCount} unread` : ''}`} title={unreadMessagesError || (unreadAdminMessageCount > 0 ? `${unreadAdminMessageCount} unread message${unreadAdminMessageCount === 1 ? '' : 's'}` : 'Messages')}>
              <Mail className="h-5 w-5" />
              {unreadAdminMessageCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">{unreadAdminMessageCount > 99 ? '99+' : unreadAdminMessageCount}</span>}
            </button>}
            {isSignedIn ? (
              <button type="button" onClick={() => void signOut()} className="p-2 text-[#4b5563] hover:text-[#0f4d3c]" aria-label="Sign out" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setAuthModalOpen(true)} className="flex min-h-11 items-center gap-2 rounded-md bg-[#0f4d3c] px-4 text-sm font-bold text-white hover:bg-[#2c7a5f]">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>LOG IN</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 xl:hidden sm:gap-2">
            <button
              type="button"
              onClick={() => setAccessibilityOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[#4b5563] hover:bg-[#eaf3ee] hover:text-[#0f4d3c]"
              aria-haspopup="dialog"
              aria-expanded={accessibilityOpen}
              aria-label={language === 'fil' ? 'Mga setting ng accessibility' : 'Accessibility settings'}
              title={language === 'fil' ? 'Mga setting ng accessibility' : 'Accessibility settings'}
            >
              <Accessibility className="h-5 w-5" aria-hidden="true" />
            </button>
            {isSignedIn && <button type="button" onClick={() => setMessagesOpen(true)} className="relative flex h-11 w-11 shrink-0 items-center justify-center text-[#4b5563] hover:text-[#0f4d3c] xl:hidden" aria-label={`Messages${unreadAdminMessageCount > 0 ? `, ${unreadAdminMessageCount} unread` : ''}`} title={unreadMessagesError || (unreadAdminMessageCount > 0 ? `${unreadAdminMessageCount} unread message${unreadAdminMessageCount === 1 ? '' : 's'}` : 'Messages')}>
              <Mail className="h-5 w-5" />
              {unreadAdminMessageCount > 0 && <span aria-hidden="true" className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">{unreadAdminMessageCount > 99 ? '99+' : unreadAdminMessageCount}</span>}
            </button>}
            {!isSignedIn && (
              <button type="button" onClick={() => setAuthModalOpen(true)} className="flex min-h-11 items-center gap-2 rounded-md bg-[#0f4d3c] px-3 text-xs font-bold text-white hover:bg-[#2c7a5f]">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>LOG IN</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#374151] hover:bg-[#eaf3ee] hover:text-[#0f4d3c]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="xl:hidden border-t border-[#dce7e1] bg-white px-4 pt-3 pb-5 shadow-lg space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`min-h-11 text-left px-3 py-2 rounded-md transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#eaf3ee] text-[#0f4d3c] font-semibold'
                    : 'text-[#374151] hover:bg-[#f8faf9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#edf2ee]">
            {isSignedIn ? (
              <button type="button" onClick={() => void signOut()} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#dce7e1] px-4 text-sm font-semibold text-[#4b5563] hover:bg-[#f2f7f4]">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      )}
    </header>
    <AccessibilityTools open={accessibilityOpen} onClose={closeAccessibility} />
    </>
  );
};
