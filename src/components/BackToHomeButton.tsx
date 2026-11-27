import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const BackToHomeButton: React.FC = () => {
  const { language, setActiveSection } = useHealthCenter();

  const goHome = () => {
    setActiveSection('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={goHome}
      className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#0f4d3c] transition-colors hover:bg-[#eaf3ee]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {language === 'fil' ? 'Bumalik sa Home' : 'Back to Home'}
    </button>
  );
};
