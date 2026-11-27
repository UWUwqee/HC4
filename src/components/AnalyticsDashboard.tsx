import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const AnalyticsDashboard: React.FC = () => {
  const { t, language } = useHealthCenter();

  return (
    <section id="analytics" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <span>{language === 'fil' ? 'Pampublikong Estadistika ng Kalusugan' : 'Public Health Statistics'}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
            {t.analyticsTitle}
          </h2>
          <p className="text-sm text-slate-600">{t.analyticsSubtitle}</p>
        </div>

        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {language === 'fil'
            ? 'Wala pang nailalathalang beripikadong datos pang-estadistika.'
            : 'No verified clinic statistics have been published.'}
        </p>
      </div>
    </section>
  );
};
