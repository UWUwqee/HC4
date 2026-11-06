import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CalendarDays, Clock3, MapPin, Stethoscope } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CLINIC_SCHEDULE, STAFF_ROSTER } from '../data/delfinSalongaClinicInfo';

export const PublicInformation: React.FC = () => {
  const { language, siteContent, siteContentError } = useHealthCenter();
  const isFilipino = language === 'fil';
  const updates = siteContent.news.slice(0, 3);
  const outreach = siteContent.outreach.slice(0, 3);
  const settings = siteContent.settings;
  const holidayAdvisory = (isFilipino ? settings.holidayAdvisoryFil : settings.holidayAdvisory).trim()
    || (isFilipino ? 'Tiyakin ang operasyon ng klinika bago bumisita tuwing holiday.' : 'Verify clinic operations before visiting on holidays.');
  const clinicDuty = isFilipino ? settings.clinicHoursFil : settings.clinicHours;
  const [clinicDutyLabel, ...clinicDutyScheduleParts] = clinicDuty.split(':');
  const clinicDutySchedule = clinicDutyScheduleParts.join(':').trim();
  const additionalClinicHours = [
    isFilipino ? settings.doctorHoursFil : settings.doctorHours,
    isFilipino ? settings.xrayHoursFil : settings.xrayHours,
    isFilipino ? settings.dentalHoursFil : settings.dentalHours,
  ].filter((hours) => hours.trim());
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!viewingImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingImage(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [viewingImage]);

  return (
    <section id="information" className="site-section-bg section-enter border-b border-[#dce7e1] py-3 sm:py-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {siteContentError && <p role="status" className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{isFilipino ? 'Hindi ma-refresh ang pinakabagong impormasyon ng klinika; ipinapakita ang huling na-save na nilalaman.' : 'Clinic information could not be refreshed; showing the last saved content.'}</p>}
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Information</span></div>
        <div className="mb-4">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2c7a5f]">Clinic information</div>
            <h2 className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
              {isFilipino ? 'Kasalukuyang impormasyon' : 'Current information'}
            </h2>
          </div>
        </div>

        <div className="holiday-advisory" role="note">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div><strong>{isFilipino ? 'Pabatid sa holiday:' : 'Holiday advisory:'}</strong> {holidayAdvisory}</div>
        </div>

        <div className="grid items-start gap-3 md:grid-cols-2">
          <div className="grid content-start gap-3">
            <section className="site-card p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#0f4d3c]"><Clock3 className="h-5 w-5 text-[#2c7a5f]" />{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}</h3>
              <div className="space-y-1 text-xs text-[#374151]">
                <p><strong className="text-sm font-bold uppercase text-[#0f4d3c]">{clinicDutyLabel}</strong>{clinicDutySchedule ? `: ${clinicDutySchedule}` : ''}</p>
                {additionalClinicHours.map((hours, index) => <p key={`${index}-${hours}`}>{hours}</p>)}
              </div>
            </section>

            <section className="site-card p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#0f4d3c]"><Bell className="h-5 w-5 text-[#2c7a5f]" />{isFilipino ? 'Mga anunsyo' : 'Announcements'}</h3>
              {updates.length > 0 ? (
                <ul className="space-y-3">
                  {updates.map((update) => (
                    <li key={update.id} className="flex items-start gap-3 border-t border-[#e7eee9] pt-3 first:border-0 first:pt-0">
                      {update.imageUrl && <button type="button" onClick={() => setViewingImage({ url: update.imageUrl!, alt: isFilipino ? update.titleFil : update.title })} aria-label={isFilipino ? `Tingnan ang buong larawan: ${update.titleFil}` : `View full image: ${update.title}`} className="shrink-0 cursor-zoom-in overflow-hidden rounded-sm bg-[#eaf3ee]"><img src={update.imageUrl} alt="" loading="lazy" decoding="async" className="h-12 w-14 object-cover" /></button>}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f4d3c]">{isFilipino ? update.titleFil : update.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6b7280]">{isFilipino ? update.summaryFil : update.summary}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-[#6b7280]">{isFilipino ? 'Wala pang bagong anunsyo.' : 'There are no current announcements.'}</p>}
            </section>

            <section className="site-card p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#0f4d3c]"><CalendarDays className="h-5 w-5 text-[#2c7a5f]" />{isFilipino ? 'Paparating na outreach' : 'Upcoming outreach'}</h3>
              {outreach.length > 0 ? (
                <ul className="bullet-list text-sm text-[#374151]">
                  {outreach.map((program) => <li key={program.id}><strong>{isFilipino ? program.titleFil : program.title}</strong><span className="mt-1 flex items-start gap-1.5 text-xs text-[#6b7280]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{program.location}</span></li>)}
                </ul>
              ) : <p className="text-sm text-[#6b7280]">{isFilipino ? 'Wala pang naka-iskedyul na outreach.' : 'No outreach programs are currently scheduled.'}</p>}
            </section>
          </div>

          <section className="site-card p-3 sm:p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#0f4d3c]"><Stethoscope className="h-5 w-5 text-[#2c7a5f]" />{isFilipino ? 'Iskedyul ng serbisyo' : 'Service schedule'}</h3>
            <div className="space-y-3 text-xs leading-relaxed text-[#374151]">
              {CLINIC_SCHEDULE.map((entry) => (
                <div key={entry.day} className="border-t border-[#e7eee9] pt-2 first:border-0 first:pt-0">
                  <p className="font-bold text-[#0f4d3c]">{entry.day}</p>
                  <p><strong>AM (7 AM - 11 AM):</strong> {entry.am}</p>
                  <p><strong>PM (12 PM - 4 PM):</strong> {entry.pm}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {viewingImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.alt}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingImage(null); }}
        >
          <button type="button" onClick={() => setViewingImage(null)} aria-label="Close image" className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <span className="text-xl leading-none">×</span>
          </button>
          <img src={viewingImage.url} alt={viewingImage.alt} className="max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-full object-contain sm:max-h-[92vh]" />
        </div>
      )}
    </section>
  );
};