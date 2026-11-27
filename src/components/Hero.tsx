import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown, Clock3, MapPin, PhoneCall } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

const getPhoneLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `+63${digits.slice(1)}`;
  if (digits.startsWith('63')) return `+${digits}`;
  return `+632${digits}`;
};

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const clinicAddress = language === 'fil' ? siteContent.settings.clinicAddressFil : siteContent.settings.clinicAddress;
  const clinicHours = language === 'fil' ? siteContent.settings.clinicHoursFil : siteContent.settings.clinicHours;
  const clinicPhone = siteContent.settings.contactPhone;
  const clinicPhones = clinicPhone.split(/\s+(?:and|or)\s+|\/|,/i).map((phone) => phone.trim()).filter(Boolean).slice(0, 2);
  const bookingEnabled = appointmentRequestAvailability === 'available';
  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="overview" className="hero-section-enter bg-[#0f4d3c] text-white">
      <div className="relative flex min-h-[340px] items-center overflow-hidden border-b border-white/10 sm:min-h-[360px] lg:min-h-[320px]">
        <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0f4d3c]/88" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-16 lg:px-12 lg:py-12">
          <div className="absolute right-5 top-4 flex items-center gap-1.5 rounded-md border border-emerald-200/50 bg-emerald-950/60 px-2.5 py-1.5 text-[10px] font-bold leading-tight text-white shadow-lg sm:right-8 sm:top-6 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:right-12" role="status">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-300 sm:h-4 sm:w-4" />
            {language === 'fil' ? 'REQUEST NG APPOINTMENT 24/7' : 'APPOINTMENT REQUEST 24/7'}
          </div>
          <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)] lg:gap-12">
            <div className="mx-auto w-full max-w-3xl text-center lg:mx-0 lg:text-left">
              <h1 className="hero-enter mx-auto max-w-3xl text-3xl font-bold leading-[1.08] text-white sm:text-4xl lg:mx-0 lg:text-[40px]">
                Mayor Moises R. Flores Health Center
              </h1>
              <div className="hero-actions mt-5 grid grid-cols-1 gap-3 sm:flex sm:justify-center lg:justify-start">
                {bookingEnabled && <button onClick={() => setBookingModalOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-white bg-white px-5 py-3 text-sm font-bold text-[#0f4d3c] transition-colors hover:bg-[#eaf3ee] sm:w-auto">
                  <CalendarDays className="h-4 w-4" /> REQUEST APPOINTMENT
                </button>}
                <button onClick={() => handleScrollTo('services')} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto">
                  View services <ArrowDown className="w-4 h-4" />
                </button>
              </div>
              <div className="mx-auto mt-4 max-w-2xl space-y-2 text-center text-sm leading-relaxed text-white/90 lg:mx-0 lg:text-left">
                <p className="flex items-start justify-center gap-2 lg:justify-start"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{clinicAddress}</span></p>
                <p className="flex items-start justify-center gap-2 lg:justify-start"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><span>{clinicHours}</span></p>
              </div>
            </div>
            <aside aria-labelledby="contact-support-title" className="mx-auto w-full max-w-md rounded-lg border border-white/25 bg-emerald-950/35 p-4 text-left shadow-lg backdrop-blur-sm sm:p-5 lg:mx-0 lg:mt-10">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-emerald-100">
                  <PhoneCall className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    {language === 'fil' ? 'Suporta sa pakikipag-ugnayan' : 'Contact support'}
                  </p>
                  <h2 id="contact-support-title" className="mt-1 text-base font-bold text-white">
                    {language === 'fil' ? 'Kailangan ng tulong sa appointment?' : 'Need help booking?'}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                {language === 'fil'
                  ? 'Tumawag sa aming kawani para matulungan ka sa pag-book ng appointment.'
                  : 'Call our staff and we can help you book an appointment.'}
              </p>
              <div className="mt-4 rounded-md bg-white px-3 py-1 text-[#0f4d3c]">
                {clinicPhones.map((phone, index) => (
                  <React.Fragment key={phone}>
                    {index > 0 && (
                      <div className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-500">
                        <span className="h-px flex-1 bg-slate-200" />
                        {language === 'fil' ? 'o' : 'or'}
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}
                    <a
                      href={`tel:${getPhoneLink(phone)}`}
                      aria-label={`${language === 'fil' ? 'Tumawag sa' : 'Call'} ${phone}`}
                      className="flex min-h-9 items-center justify-center gap-2 px-1 text-sm font-bold transition-colors hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                    >
                      <PhoneCall className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {language === 'fil' ? 'Tumawag sa' : 'Call'} {phone}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};
