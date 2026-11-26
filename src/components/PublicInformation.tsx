import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CalendarDays, Clock3, MapPin, Megaphone, Stethoscope, Users } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CLINIC_SCHEDULE, STAFF_ROSTER } from '../data/delfinSalongaClinicInfo';
import { BackToHomeButton } from './BackToHomeButton';

export const PublicInformation: React.FC = () => {
  const { language, siteContent, siteContentError } = useHealthCenter();
  const isFilipino = language === 'fil';
  const featuredServices = siteContent.services.slice(0, 5);
  const updates = siteContent.news.slice(0, 3);
  const outreach = siteContent.outreach.slice(0, 3);
  const settings = siteContent.settings;
  const holidayAdvisory = (isFilipino ? settings.holidayAdvisoryFil : settings.holidayAdvisory).trim()
    || (isFilipino ? 'Tiyakin ang operasyon ng klinika bago bumisita tuwing holiday.' : 'Verify clinic operations before visiting on holidays.');
  const clinicHours = [
    isFilipino ? settings.clinicHoursFil : settings.clinicHours,
    isFilipino ? settings.doctorHoursFil : settings.doctorHours,
    isFilipino ? settings.xrayHoursFil : settings.xrayHours,
    isFilipino ? settings.dentalHoursFil : settings.dentalHours,
  ].filter((hours) => hours.trim());
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!viewingImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingImage(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [viewingImage]);

  return (
    <section id="clinic-information" className="site-section-bg section-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="w-full px-5 sm:px-8 lg:px-12">
        {siteContentError && <p role="status" className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{isFilipino ? 'Hindi ma-refresh ang pinakabagong impormasyon ng klinika; ipinapakita ang huling na-save na nilalaman.' : 'Clinic information could not be refreshed; showing the last saved content.'}</p>}
        <BackToHomeButton />
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Information</span></div>
        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2c7a5f]">Clinic information</div>
          <h2 className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
            {isFilipino ? 'Kasalukuyang impormasyon' : 'Current information'}
          </h2>
        </div>
      </div>

      <div className="w-full bg-[#0b3f32] px-5 py-5 shadow-lg shadow-[#0b3f32]/15 sm:px-8 sm:py-8 lg:px-12">
        <div className="holiday-advisory" role="note">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div><strong>{isFilipino ? 'Pabatid sa holiday:' : 'Holiday advisory:'}</strong> {holidayAdvisory}</div>
        </div>

        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-emerald-100">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{isFilipino ? 'Mga anunsyo' : 'Announcements'}</h3>
                <p className="mt-0.5 text-xs text-emerald-100">{isFilipino ? 'Mga pinakabagong balita at pabatid mula sa health center' : 'The latest news and notices from the health center'}</p>
              </div>
            </div>
            {updates.length > 0 ? (
              <div className="space-y-4">
                {updates.map((update) => (
                  <article key={update.id} className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-md shadow-black/10">
                    <div className="p-4 sm:p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eaf3ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#17645c]">
                          {isFilipino ? update.categoryFil : update.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-[#66736f]">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {update.date}
                        </span>
                      </div>
                      <h4 className="text-base font-bold leading-snug text-[#123f36] sm:text-lg">
                        {isFilipino ? update.titleFil : update.title}
                      </h4>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#43534d]">
                        {(isFilipino ? update.contentFil : update.content) || (isFilipino ? update.summaryFil : update.summary)}
                      </p>
                      <div className="mt-4 border-t border-[#e7eee9] pt-3 text-xs font-medium text-[#66736f]">
                        {update.author}
                      </div>
                    </div>
                    {update.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: update.imageUrl!, alt: isFilipino ? update.titleFil : update.title })}
                        aria-label={isFilipino ? `Tingnan ang buong larawan: ${update.titleFil}` : `View full image: ${update.title}`}
                        className="group block w-full cursor-zoom-in overflow-hidden border-t border-[#e1e9e4] bg-[#f3f7f4] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#17645c]"
                      >
                        <img
                          src={update.imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="mx-auto block h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-5 text-sm text-emerald-50">
                {isFilipino ? 'Wala pang bagong anunsyo.' : 'There are no current announcements.'}
              </p>
            )}
          </section>

          <div className="accessibility-dark-details mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <section className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-white lg:text-lg">
                <Clock3 className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}
              </h3>
              <ul className="bullet-list my-0 text-base leading-7 text-emerald-50 lg:text-sm lg:leading-6">
                {clinicHours.map((hours) => <li key={hours}>{hours}</li>)}
              </ul>
            </section>

            <section className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-white lg:text-lg">
                <Stethoscope className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Mga serbisyo' : 'Services overview'}
              </h3>
              {featuredServices.length > 0 ? (
                <ul className="bullet-list my-0 text-base leading-7 text-emerald-50 lg:text-sm lg:leading-6">
                  {featuredServices.map((service) => <li key={service.id}><strong>{isFilipino ? service.titleFil : service.title}</strong>{service.badge ? ` · ${isFilipino ? service.badgeFil : service.badge}` : ''}</li>)}
                </ul>
              ) : <p className="text-base text-emerald-50 lg:text-sm">{isFilipino ? 'Wala pang nailathalang serbisyo.' : 'No services have been published yet.'}</p>}
            </section>

            <section className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-white lg:text-lg">
                <CalendarDays className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Paparating na outreach' : 'Upcoming outreach'}
              </h3>
              {outreach.length > 0 ? (
                <ul className="bullet-list my-0 text-base leading-7 text-emerald-50 lg:text-sm lg:leading-6">
                  {outreach.map((program) => <li key={program.id}><strong>{isFilipino ? program.titleFil : program.title}</strong><span className="mt-1 flex items-start gap-1.5 text-sm text-emerald-100 lg:text-xs"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{program.location}</span></li>)}
                </ul>
              ) : <p className="text-base text-emerald-50 lg:text-sm">{isFilipino ? 'Wala pang naka-iskedyul na outreach.' : 'No outreach programs are currently scheduled.'}</p>}
            </section>

          </div>

          <section className="grid gap-8 border-t border-white/20 pt-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                <Users className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Mga kawani ng klinika' : 'Clinic staff'}
              </h3>
              <ul className="grid gap-3 text-sm leading-6 text-emerald-50 sm:grid-cols-2">
                {STAFF_ROSTER.map((person) => (
                  <li key={`${person.name}-${person.role}`}>
                    <strong>{person.name}</strong><span className="block text-xs text-emerald-100">{person.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                <CalendarDays className="h-5 w-5 text-emerald-200" />{isFilipino ? 'Iskedyul ng serbisyo' : 'Service schedule'}
              </h3>
              <div className="grid gap-3 text-sm text-emerald-50 sm:grid-cols-2">
                {CLINIC_SCHEDULE.map((entry) => (
                  <div key={entry.day} className="border-t border-white/20 pt-3">
                    <p className="font-bold text-white">{entry.day}</p>
                    <p><strong>AM (7 AM - 11 AM):</strong> {entry.am}</p>
                    <p><strong>PM (12 PM - 4 PM):</strong> {entry.pm}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {viewingImage && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.alt}
          className="fixed inset-0 z-[70] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-950/90 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingImage(null); }}
        >
          <button type="button" onClick={() => setViewingImage(null)} aria-label={isFilipino ? 'Isara ang larawan' : 'Close image'} className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <span className="text-xl leading-none">×</span>
          </button>
          <img src={viewingImage.url} alt={viewingImage.alt} className="block h-auto w-auto max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] max-w-[calc(100vw-2rem)] object-contain" />
        </div>,
        document.body,
      )}
    </section>
  );
};
