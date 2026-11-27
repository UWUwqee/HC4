import React, { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { STAFF_ROSTER } from '../data/delfinSalongaClinicInfo';

export const StaffDirectory: React.FC = () => {
  const { t, language, setActiveSection } = useHealthCenter();
  const [searchQuery, setSearchQuery] = useState('');
  const query = searchQuery.toLowerCase().trim();
  const filteredStaff = STAFF_ROSTER.filter((staff) => (
    staff.name.toLowerCase().includes(query) || staff.role.toLowerCase().includes(query)
  ));

  return (
    <section id="staff" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-sm font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Pampublikong Serbisyong Medikal' : 'Official Public Health Roster'}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              {t.staffTitle}
            </h2>
            <p className="text-base leading-relaxed text-slate-600">{t.staffSubtitle}</p>
          </div>

          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.staffSearchPlaceholder}
              className="w-full pl-10 pr-4 py-3 text-base bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <article key={staff.name} className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-950 break-words">{staff.name}</h3>
              <p className="text-sm font-semibold text-teal-700 mt-1">{staff.role}</p>
            </article>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="text-base font-semibold text-slate-700">
              {language === 'fil' ? 'Walang nahanap na kawani' : 'No personnel found'}
            </div>
            <div className="text-sm text-slate-600">
              {language === 'fil' ? 'Subukang baguhin ang iyong paghahanap.' : 'Try adjusting your search criteria.'}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setActiveSection('contact');
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-sm font-semibold text-teal-800 hover:text-teal-900 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>{language === 'fil' ? 'Makipag-ugnayan sa klinika' : 'Contact the clinic'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
