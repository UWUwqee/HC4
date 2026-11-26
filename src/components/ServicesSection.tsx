import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useHealthCenter } from '../context/HealthCenterContext';
import { ServiceDetail } from '../types';
import { ArrowRight, Clock, Heart, MapPin, Smile, Stethoscope, X } from 'lucide-react';
import checkupImage from '../assets/images/CHECK UP.jpg';
import dentalServiceImage from '../assets/images/DENTAL SERVICE.jpg';
import familyPlanningImage from '../assets/images/FAMILYPLANNING.jpg';
import immunizationImage from '../assets/images/IMMUNIZATION.png';
import maternityImage from '../assets/images/MATERNITY.png';
import papSmearImage from '../assets/images/PAP SMEAR.png';
import penMedsImage from '../assets/images/PEN MEDS.jpg';
import tbDotsImage from '../assets/images/TB DOTS.png';
import { BackToHomeButton } from './BackToHomeButton';

const serviceImages: Partial<Record<ServiceDetail['category'], string>> = {
  checkup: checkupImage,
  family_planning: familyPlanningImage,
  maternity: maternityImage,
  immunization: immunizationImage,
  dental: dentalServiceImage,
  pen_meds: penMedsImage,
  tb_dots: tbDotsImage,
  pap_smear: papSmearImage,
};

const illustrationForService = (category: string) => {
  switch (category) {
    case 'maternity':
      return { Icon: Heart, color: 'bg-rose-50 text-rose-700', accent: 'bg-rose-200/70' };
    case 'dental':
      return { Icon: Smile, color: 'bg-sky-50 text-sky-700', accent: 'bg-sky-200/70' };
    default:
      return { Icon: Stethoscope, color: 'bg-emerald-50 text-emerald-800', accent: 'bg-emerald-200/70' };
  }
};

export const ServicesSection: React.FC = () => {
  const { t, language, siteContent } = useHealthCenter();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedService = siteContent.services.find((service) => service.id === selectedServiceId) ?? null;

  const servicePreview = (description: string) => {
    const firstSentence = description.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? description.trim();
    return firstSentence.length > 150 ? `${firstSentence.slice(0, 147).trimEnd()}...` : firstSentence;
  };

  return (
    <section id="services" className="site-section-bg section-enter services-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <BackToHomeButton />
        <div className="breadcrumb">
          Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Services</span>
        </div>

        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2c7a5f]">
              {language === 'fil' ? 'Mga serbisyong pangkalusugan' : 'Health services'}
            </div>
            <p className="mt-1 text-xs text-[#6b7280] sm:mt-2 sm:text-sm">
              {language === 'fil'
                ? 'Mga iskedyul, lokasyon, at impormasyon sa pangangalaga.'
                : 'Schedules, locations, and care information.'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {siteContent.services.map((service) => {
            const image = serviceImages[service.category as keyof typeof serviceImages];
            const illustration = illustrationForService(service.category);
            const IllustrationIcon = illustration.Icon;
            const serviceTitle = language === 'fil' ? service.titleFil : service.title;
            const serviceDescription = language === 'fil' ? service.shortDescFil : service.shortDesc;

            return (
              <article
                key={service.id}
                className="site-card service-row lift-on-hover flex min-w-0 flex-col overflow-hidden transition-colors duration-200 hover:border-[#9bbdad]"
              >
                {image ? (
                  <img
                    src={image}
                    alt={serviceTitle}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] w-full border-b border-[#dce7e1] object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${language === 'fil' ? service.titleFil : service.title} illustration`}
                    className={`relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-[#dce7e1] ${illustration.color}`}
                  >
                    <span className={`absolute right-8 top-5 h-14 w-14 rounded-full ${illustration.accent}`} />
                    <span className={`absolute bottom-4 left-8 h-10 w-10 rounded-full ${illustration.accent}`} />
                    <IllustrationIcon className="relative h-9 w-9 stroke-[1.6] sm:h-10 sm:w-10" aria-hidden="true" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="break-words text-base font-bold leading-snug text-[#0f4d3c]">{serviceTitle}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#6b7280]">{servicePreview(serviceDescription)}</p>

                  <div className="mt-4 flex flex-1 items-start gap-2 text-xs leading-relaxed text-[#4b5563]">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" />
                    <span className="min-w-0 break-words">{language === 'fil' ? service.scheduleFil : service.schedule}</span>
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#6b7280]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" />
                    <span className="min-w-0 break-words">{service.location}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#0f4d3c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2c7a5f]"
                  >
                    {language === 'fil' ? 'Tingnan ang detalye' : 'View details'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}

          {siteContent.services.length === 0 && (
            <p className="col-span-full py-8 text-sm text-[#6b7280]">
              {language === 'fil' ? 'Walang serbisyong nailathala sa ngayon.' : 'No services have been published yet.'}
            </p>
          )}
        </div>
      </div>

      {selectedService && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4"
          onClick={() => setSelectedServiceId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto rounded-md border border-[#dce7e1] bg-white p-4 shadow-[0_18px_50px_rgba(15,77,60,0.18)] sm:max-h-[90vh] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2c7a5f]">
                  {language === 'fil' ? selectedService.badgeFil : selectedService.badge}
                </div>
                <h3 id="service-dialog-title" className="mt-1 break-words text-2xl font-bold text-[#0f4d3c]">
                  {language === 'fil' ? selectedService.titleFil : selectedService.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServiceId(null)}
                aria-label={t.btnCloseArticle}
                className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="py-5 text-sm leading-relaxed text-[#374151]">
              {language === 'fil' ? selectedService.fullDescFil : selectedService.fullDesc}
            </p>

            <div className="grid gap-4 border-y border-[#dce7e1] py-4 text-sm sm:grid-cols-2">
              <div>
                <div className="font-bold text-[#0f4d3c]">{language === 'fil' ? 'Iskedyul' : 'Schedule'}</div>
                <p className="mt-1 text-[#6b7280]">
                  {language === 'fil' ? selectedService.scheduleFil : selectedService.schedule}
                </p>
              </div>
              <div>
                <div className="font-bold text-[#0f4d3c]">{language === 'fil' ? 'Lokasyon' : 'Location'}</div>
                <p className="mt-1 text-[#6b7280]">{selectedService.location}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="font-bold text-[#0f4d3c]">{language === 'fil' ? 'Mga tauhan' : 'Care team'}</div>
                <p className="mt-1 text-[#6b7280]">{selectedService.keyPersonnel.join(', ')}</p>
              </div>
            </div>

          </section>
        </div>,
        document.body,
      )}
    </section>
  );
};