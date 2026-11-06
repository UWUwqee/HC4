import React, { useMemo, useState } from 'react';
import { ArrowRight, Syringe } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import checkupImage from '../assets/images/CHECK UP.jpg';
import familyPlanningImage from '../assets/images/FAMILYPLANNING.jpg';
import maternityImage from '../assets/images/MATERNITY.png';
import vaccinationImage from '../assets/images/VACCINATION.jpg';

const serviceVisuals = [
  {
    id: 'checkup',
    category: 'checkup',
    title: 'Consultation',
    titleFil: 'Konsultasyon',
    image: checkupImage,
    imageAlt: 'A health worker speaking with a patient',
  },
  {
    id: 'family_planning',
    category: 'family_planning',
    title: 'Family planning',
    titleFil: 'Family planning',
    image: familyPlanningImage,
    imageAlt: 'Family standing together',
  },
  {
    id: 'maternity',
    category: 'maternity',
    title: 'Prenatal and postnatal care',
    titleFil: 'Prenatal at postnatal',
    image: maternityImage,
    imageAlt: 'A pregnant patient receiving care from a health worker',
  },
  {
    id: 'vaccination',
    category: 'vaccination',
    title: 'Vaccination',
    titleFil: 'Bakuna',
    image: vaccinationImage,
    imageAlt: 'Vaccination service illustration',
  },
] as const;

export const ServicesSection: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const serviceCards = useMemo(() => {
    const map = new Map(siteContent.services.map((service) => [service.category, service]));
    return serviceVisuals.map((visual) => ({
      ...visual,
      details: map.get(visual.category) ?? {
        id: visual.id,
        category: visual.category,
        title: visual.title,
        titleFil: visual.titleFil,
        shortDesc: visual.title,
        shortDescFil: visual.titleFil,
        fullDesc: 'Service details are provided by the health center team.',
        fullDescFil: 'Ang detalye ng serbisyong ito ay ibinibigay ng team ng health center.',
        schedule: '',
        scheduleFil: '',
        location: '',
        keyPersonnel: [],
        requirements: [],
        requirementsFil: [],
        badge: '',
        badgeFil: '',
      },
    }));
  }, [siteContent.services]);

  const selectedService = serviceCards.find((service) => service.id === selectedServiceId) ?? serviceCards[0];

  return (
    <section id="services" aria-labelledby="services-title" className="site-section-bg section-enter border-b border-[#dce7e1] py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2c7a5f]">Delfin Salonga Health Center</div>
          <h1 id="services-title" className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
            {isFilipino ? 'Mga serbisyo' : 'Services'}
          </h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((service) => (
            <article key={service.id} className="site-card overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
              <div className="overflow-hidden">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#e8f1ec] text-[#17645c]" aria-hidden="true">
                    <Syringe className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="px-3 pb-3 pt-3">
                <h2 className="text-center text-base font-bold text-[#0f4d3c]">
                  {isFilipino ? service.titleFil : service.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#2c7a5f] bg-[#2c7a5f] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#235d4f]"
                >
                  {isFilipino ? 'Tingnan ang detalye' : 'View details'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {selectedService && (
          <div className="mt-4 rounded-xl border border-[#dce7e1] bg-[#edf7f3] p-4 sm:p-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2c7a5f]">{isFilipino ? 'Detalye ng serbisyo' : 'Service details'}</div>
            <h3 className="text-xl font-bold text-[#0f4d3c]">{isFilipino ? selectedService.titleFil : selectedService.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#374151]">
              {isFilipino ? selectedService.details.fullDescFil : selectedService.details.fullDesc}
            </p>
            {selectedService.details.schedule && (
              <p className="mt-3 text-sm text-[#374151]">
                <span className="font-bold text-[#0f4d3c]">{isFilipino ? 'Iskedyul:' : 'Schedule:'}</span>{' '}
                {isFilipino ? selectedService.details.scheduleFil || selectedService.details.schedule : selectedService.details.schedule}
              </p>
            )}
            {selectedService.details.requirements.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#374151]">
                {(isFilipino ? selectedService.details.requirementsFil : selectedService.details.requirements).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
};