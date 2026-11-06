import React, { useMemo, useState } from 'react';
import { ArrowRight, Clock3, MapPin, Syringe, X } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import checkupImage from '../assets/images/CHECK UP.jpg';
import familyPlanningImage from '../assets/images/FAMILYPLANNING.jpg';
import maternityImage from '../assets/images/MATERNITY.png';
import vaccinationImage from '../assets/images/VACCINATION.jpg';

const serviceVisuals = {
  checkup: { image: checkupImage, imageAlt: 'A health worker speaking with a patient' },
  family_planning: { image: familyPlanningImage, imageAlt: 'Family standing together' },
  maternity: { image: maternityImage, imageAlt: 'A pregnant patient receiving care from a health worker' },
  vaccination: { image: vaccinationImage, imageAlt: 'Vaccination service illustration' },
  immunization: { image: vaccinationImage, imageAlt: 'Immunization service illustration' },
  dental: { image: checkupImage, imageAlt: 'Dental service illustration' },
  tb_dots: { image: checkupImage, imageAlt: 'TB-DOTS service illustration' },
  pen_meds: { image: checkupImage, imageAlt: 'Medication service illustration' },
  pap_smear: { image: maternityImage, imageAlt: 'Pap smear service illustration' },
} as const;

export const ServicesSection: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const serviceCards = useMemo(
    () => siteContent.services.map((service) => ({
      ...service,
      image: serviceVisuals[service.category as keyof typeof serviceVisuals]?.image ?? checkupImage,
      imageAlt: serviceVisuals[service.category as keyof typeof serviceVisuals]?.imageAlt ?? 'Clinic service illustration',
    })),
    [siteContent.services],
  );

  const selectedService = serviceCards.find((service) => service.id === selectedServiceId) ?? null;

  return (
    <section id="services" aria-labelledby="services-title" className="site-section-bg section-enter border-b border-[#dce7e1] py-5 sm:py-7">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-5 text-[#0f4d3c]">
          <div className="text-[12px] font-medium text-[#4b5563]">
            <span className="font-medium">Home</span>
            <span className="mx-2 text-[#6b7280]">/</span>
            <span className="font-semibold text-[#0f4d3c]">Services</span>
          </div>
          <h1 id="services-title" className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2c7a5f]">
            {isFilipino ? 'Mga serbisyong pangkalusugan' : 'Health services'}
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            {isFilipino ? 'Mga iskedyul, lokasyon, at impormasyon sa pangangalaga.' : 'Schedules, locations, and care information.'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white shadow-[0_1px_0_rgba(15,77,60,0.04)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="overflow-hidden">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <h2 className="text-[1.05rem] font-bold leading-snug text-[#0f4d3c]">
                  {isFilipino ? service.titleFil : service.title}
                </h2>

                <p className="min-h-[46px] text-sm leading-relaxed text-[#4b5563]">
                  {isFilipino ? service.shortDescFil : service.shortDesc}
                </p>

                <div className="space-y-2 text-sm text-[#374151]">
                  {service.schedule && (
                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" />
                      <span>{isFilipino ? service.scheduleFil || service.schedule : service.schedule}</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" />
                      <span>{service.location}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1f5d51] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#184c42]"
                >
                  {isFilipino ? 'Tingnan ang detalye' : 'View details'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
            <div className="w-full max-w-4xl rounded-xl border border-[#dce7e1] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e7eee9] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2c7a5f]">
                  {isFilipino ? 'Detalye ng serbisyo' : 'Service details'}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceId(null)}
                  aria-label="Close service details"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#edf7f3]"
                >
                  <X className="h-4 w-4 text-[#0f4d3c]" />
                </button>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <div className="mb-3 overflow-hidden rounded-lg">
                    <img src={selectedService.image} alt={selectedService.imageAlt} className="aspect-[16/10] w-full object-cover" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0f4d3c]">
                    {isFilipino ? selectedService.titleFil : selectedService.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#374151]">
                    {isFilipino ? selectedService.fullDescFil : selectedService.fullDesc}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-[#374151]">
                  <div className="rounded-lg border border-[#dce7e1] bg-[#f7faf8] p-3">
                    <div className="mb-1 flex items-center gap-2 font-bold text-[#0f4d3c]">
                      <Clock3 className="h-4 w-4 text-[#2c7a5f]" />
                      {isFilipino ? 'Iskedyul' : 'Schedule'}
                    </div>
                    <div>{isFilipino ? selectedService.scheduleFil || selectedService.schedule : selectedService.schedule || 'Available by appointment.'}</div>
                  </div>
                  <div className="rounded-lg border border-[#dce7e1] bg-[#f7faf8] p-3">
                    <div className="mb-1 flex items-center gap-2 font-bold text-[#0f4d3c]">
                      <MapPin className="h-4 w-4 text-[#2c7a5f]" />
                      {isFilipino ? 'Lokasyon' : 'Location'}
                    </div>
                    <div>{selectedService.location || 'Delfin Salonga Health Center'}</div>
                  </div>
                  <div className="rounded-lg border border-[#dce7e1] bg-[#eaf5ef] p-3 font-bold text-[#0f4d3c]">
                    {selectedService.badge || (isFilipino ? 'Available' : 'Available')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};