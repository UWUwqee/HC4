import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown, Clock3, MapPin } from 'lucide-react';
import { CLINIC_ADDRESS } from '../data/delfinSalongaClinicInfo';
import centerPhoto from '../assets/images/DELFIN.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const clinicAddress = language === 'fil' ? siteContent.settings.clinicAddressFil : siteContent.settings.clinicAddress;
  const clinicHours = language === 'fil' ? siteContent.settings.clinicHoursFil : siteContent.settings.clinicHours;
  const bookingEnabled = appointmentRequestAvailability === 'available';

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="overview" className="hero-section-enter bg-[#0f4d3c] text-white">
      <div className="relative min-h-[300px] flex items-center overflow-hidden border-b border-white/10 sm:min-h-[340px]">
        <img src={centerPhoto} alt="Delfin Salonga Health Center exterior" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0f4d3c]/88" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-14 lg:px-12">
          <div className="absolute right-5 top-4 flex items-center gap-1.5 rounded-md border border-emerald-200/50 bg-emerald-950/60 px-2.5 py-1.5 text-[10px] font-bold leading-tight text-white shadow-lg sm:right-8 sm:top-6 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:right-12" role="status">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-300 sm:h-4 sm:w-4" aria-hidden="true" />
            {language === 'fil' ? 'REQUEST NG APPOINTMENT 24/7' : 'APPOINTMENT REQUEST 24/7'}
          </div>
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
            <h1 className="hero-enter mx-auto max-w-3xl text-3xl font-bold leading-[1.08] text-white sm:text-4xl lg:mx-0 lg:text-[46px]">
              Delfin Salonga Health Center
            </h1>
            <div className="hero-actions mt-7 grid grid-cols-1 gap-3 sm:flex">
              {bookingEnabled && <button onClick={() => setBookingModalOpen(true)} title="Request an appointment" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-white bg-white px-5 py-3 text-sm font-bold text-[#0f4d3c] transition-colors hover:bg-[#eaf3ee] sm:w-auto">
                <CalendarDays className="h-4 w-4" /> REQUEST AN APPOINTMENT
              </button>}
              <button onClick={() => handleScrollTo('services')} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto">
                View services <ArrowDown className="h-4 w-4" />
              </button>
            </div>
            <div className="mx-auto mt-5 max-w-2xl space-y-2 text-center text-sm leading-relaxed text-white/90 lg:mx-0 lg:text-left">
              <p className="flex items-start justify-center gap-2 lg:justify-start"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{clinicAddress || CLINIC_ADDRESS}</span></p>
              <p className="flex items-start justify-center gap-2 lg:justify-start"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><span>{clinicHours}</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
