import React from 'react';
import patientFlowDiagram from '../assets/images/DIAGRAM xd.png';

export const PatientFlow: React.FC = () => (
  <section aria-label="Patient flow and visit information" className="site-section-bg section-enter border-t border-[#dce7e1] py-4 sm:py-5">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
      <a href={patientFlowDiagram} target="_blank" rel="noreferrer" title="Open the full-size patient flow diagram" className="mx-auto block max-w-5xl overflow-hidden rounded-sm border border-[#dce7e1] bg-white">
        <img
          src={patientFlowDiagram}
          alt="Patient flow diagram with registration, screening, care pathways, consultation, and visit information."
          loading="lazy"
          decoding="async"
          className="max-h-[min(62vh,560px)] h-auto w-full object-contain"
        />
      </a>
    </div>
  </section>
);
