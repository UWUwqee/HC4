import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import patientFlowDiagram from '../assets/images/DIAGRAM xd.png';

export const PatientFlow: React.FC = () => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isZoomed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsZoomed(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isZoomed]);

  return (
    <section aria-label="Patient flow and visit information" className="site-section-bg section-enter border-t border-[#dce7e1] py-3 sm:py-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          title="View the patient flow diagram"
          aria-label="Enlarge the patient flow diagram"
          className="mx-auto block max-w-5xl overflow-hidden rounded-sm border border-[#dce7e1] bg-white"
        >
          <img
            src={patientFlowDiagram}
            alt="Patient flow diagram with registration, screening, care pathways, consultation, and visit information."
            loading="lazy"
            decoding="async"
            className="max-h-[min(52vh,480px)] h-auto w-full object-contain"
          />
        </button>
      </div>
      {isZoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-3 sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsZoomed(false); }}
        >
          <section role="dialog" aria-modal="true" aria-label="Patient flow diagram" className="relative flex h-full max-h-[90vh] w-full max-w-7xl items-center justify-center">
            <button type="button" onClick={() => setIsZoomed(false)} aria-label="Close patient flow diagram" className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 hover:bg-slate-200">
              <X className="h-5 w-5" />
            </button>
            <img
              src={patientFlowDiagram}
              alt="Patient flow diagram with registration, screening, care pathways, consultation, and visit information."
              className="max-h-full max-w-full object-contain"
            />
          </section>
        </div>
      )}
    </section>
  );
};
