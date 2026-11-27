import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const PatientFlow: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const steps = isFilipino
    ? [
      { number: '01', title: 'Magparehistro', description: 'Kumpletuhin ang pagpaparehistro pagdating at ibigay ang impormasyong hihingin ng kawani.' },
      { number: '02', title: 'Sabihin ang serbisyong kailangan', description: 'Ipaliwanag sa kawani kung anong serbisyo ang kailangan upang maituro kayo sa tamang proseso.' },
      { number: '03', title: 'Sundin ang gabay ng kawani', description: 'Sundin ang mga tagubilin ng klinika at magtanong kung kailangan ng follow-up.' },
    ]
    : [
      { number: '01', title: 'Register', description: 'Complete registration when you arrive and provide the information requested by clinic staff.' },
      { number: '02', title: 'Describe the service you need', description: 'Tell staff which service you need so they can guide you through the right process.' },
      { number: '03', title: 'Follow staff guidance', description: 'Follow the clinic instructions and ask whether you need a follow-up visit.' },
    ];
  const settings = siteContent.settings;

  return (
    <section aria-labelledby="patient-flow-title" className="site-section-bg section-enter border-t border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-8 max-w-2xl">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2c7a5f]">
            {isFilipino ? 'Gabay sa pagbisita' : 'Plan your visit'}
          </div>
          <h2 id="patient-flow-title" className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
            {isFilipino ? 'Daloy ng pasyente' : 'Patient flow'}
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="site-card divide-y divide-[#e7eee9] border-y border-[#e7eee9] px-5 sm:px-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 py-5">
                <span className="text-sm font-bold tabular-nums text-[#2c7a5f]">{step.number}</span>
                <div>
                  <h3 className="text-base font-bold text-[#0f4d3c]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <aside className="site-card p-5 sm:p-6">
            <h3 className="text-base font-bold text-[#0f4d3c]">{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              {isFilipino ? settings.clinicHoursFil : settings.clinicHours}
            </p>
            <p className="mt-4 text-sm text-[#6b7280]">
              {isFilipino
                ? 'May iskedyul ang mga serbisyo. Tingnan ang detalye ng napiling serbisyo bago bumisita.'
                : 'Services have individual schedules. Check the selected service details before visiting.'}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
};
