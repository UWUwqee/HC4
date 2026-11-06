import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown, Clock3, MapPin } from 'lucide-react';
import { CLINIC_ADDRESS } from '../data/delfinSalongaClinicInfo';
import centerPhoto from '../assets/images/DELFIN.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, clinicOpen, clinicStatusError, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const clinicAddress = language === 'fil' ? siteContent.settings.clinicAddressFil : siteContent.settings.clinicAddress;
  const clinicHours = language === 'fil' ? siteContent.settings.clinicHoursFil : siteContent.settings.clinicHours;
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section-enter bg-[#0f4d3c] text-white">
      <div className="relative min-h-[250px] sm:min-h-[280px] flex items-center overflow-hidden border-b border-white/10">
        <img src={centerPhoto} alt="Delfin Salonga Health Center exterior" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0f4d3c]/88" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="max-w-2xl">
              <h1 className="hero-enter max-w-xl text-2xl sm:text-3xl lg:text-4xl font-bold leading-[1.08] text-white">
                Delfin Salonga Health Center
              </h1>
              <div className="hero-actions mt-4 flex flex-wrap gap-2.5">
                {bookingEnabled && <button onClick={() => setBookingModalOpen(true)} title="Request an appointment" className="inline-flex min-h-11 items-center gap-2 bg-white text-[#0f4d3c] px-4 py-2.5 text-sm font-bold rounded-sm border border-white hover:bg-[#eaf3ee] transition-colors">
                  <CalendarDays className="w-4 h-4" /> REQUEST AN APPOINTMENT
                </button>}
                <button onClick={() => handleScrollTo('services')} className="inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                  View services <ArrowDown className="w-4 h-4" />
                </button>
                <div className="min-w-0 max-w-[290px] space-y-1.5 text-xs leading-relaxed text-white/85 sm:ml-2">
                  <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{clinicAddress || CLINIC_ADDRESS}</span></p>
                  <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{clinicHours}</span></p>
                </div>
              </div>
            </div>
            <div className={`flex min-h-16 min-w-48 items-center justify-center gap-3 self-end rounded-md border px-5 py-3 text-base font-extrabold shadow-lg sm:min-h-20 sm:min-w-56 sm:self-center sm:px-6 sm:text-xl ${clinicStatusError || clinicOpen === null ? 'border-slate-200/50 bg-slate-950/45' : clinicOpen ? 'border-emerald-200/50 bg-emerald-950/50' : 'border-rose-200/60 bg-rose-950/55'}`} role="status" aria-live="polite">
              <span className={`h-4 w-4 shrink-0 rounded-full ring-4 ${clinicStatusError || clinicOpen === null ? 'bg-slate-400 ring-slate-300/20' : clinicOpen ? 'bg-emerald-400 ring-emerald-300/20' : 'bg-rose-400 ring-rose-300/20'}`} />
              {clinicStatusError || clinicOpen === null
                ? (language === 'fil' ? 'Hindi available ang status' : 'Status unavailable')
                : clinicOpen
                  ? (language === 'fil' ? 'BUKAS NGAYON' : 'OPEN NOW')
                  : (language === 'fil' ? 'SARADO NGAYON' : 'CLOSED NOW')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
