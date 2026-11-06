import React from 'react';
import { Syringe } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import checkupImage from '../assets/images/CHECK UP.jpg';
import familyPlanningImage from '../assets/images/FAMILYPLANNING.jpg';
import maternityImage from '../assets/images/MATERNITY.png';
import vaccinationImage from '../assets/images/VACCINATION.jpg';

const services = [
  {
    id: 'consultation',
    category: 'checkup',
    title: 'Consultation',
    titleFil: 'Konsultasyon',
    image: checkupImage,
    imageAlt: 'A health worker speaking with a patient',
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
    id: 'family-planning',
    category: 'family_planning',
    title: 'Family planning',
    titleFil: 'Family planning',
    image: familyPlanningImage,
    imageAlt: 'Family standing together',
  },
  {
    id: 'vaccination',
    category: 'vaccination',
    title: 'Vaccination',
    titleFil: 'Bakuna',
    image: vaccinationImage,
    imageAlt: 'Vaccination service illustration',
  },
];

export const ServicesSection: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';

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
          {siteContent.services.map((service) => {
            const visual = services.find((item) => item.category === service.category);
            return (
            <article key={service.id} className="site-card overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
              <div className="overflow-hidden">
                {visual?.image ? (
                  <img
                    src={visual.image}
                    alt={visual.imageAlt}
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
              </div>
            </article>
            );
          })}
          {siteContent.services.length === 0 && <p className="text-sm text-[#6b7280]">{isFilipino ? 'Walang kasalukuyang nakalistang serbisyo.' : 'No services are currently listed.'}</p>}
        </div>
      </div>
    </section>
  );
};