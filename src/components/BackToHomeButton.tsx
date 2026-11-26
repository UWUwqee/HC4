import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const BackToHomeButton: React.FC = () => {
  const { language, setActiveSection } = useHealthCenter();

  return (
    <button
      type="button"
      onClick={() => {
        setActiveSection('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#17645c] hover:text-[#0f4d3c]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {language === 'fil' ? 'Bumalik sa tahanan' : 'Back to home'}
    </button>
  );
};
