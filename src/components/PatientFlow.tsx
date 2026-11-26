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
    <section aria-label="Patient flow and visit information" className="site-section-bg section-enter border-t border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          title="View the patient flow diagram"
          aria-label="Enlarge the patient flow diagram"
          className="group mx-auto block w-full max-w-6xl cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17645c]"
        >
          <img
            src={patientFlowDiagram}
            alt="Patient flow diagram with registration, screening, care pathways, consultation, and visit information."
            loading="lazy"
            decoding="async"
            className="block h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </button>
      </div>
      {isZoomed && (
        <div
          className="fixed inset-0 z-[70] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-950/90 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsZoomed(false); }}
        >
          <section role="dialog" aria-modal="true" aria-label="Patient flow diagram" className="relative flex h-full w-full items-center justify-center">
            <button type="button" onClick={() => setIsZoomed(false)} aria-label="Close patient flow diagram" className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
            <img
              src={patientFlowDiagram}
              alt="Patient flow diagram with registration, screening, care pathways, consultation, and visit information."
              className="block h-auto w-auto max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] max-w-[calc(100vw-2rem)] object-contain"
            />
          </section>
        </div>
      )}
    </section>
  );
};
