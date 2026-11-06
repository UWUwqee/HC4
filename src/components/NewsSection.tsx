import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { NewsUpdate } from '../types';
import { Newspaper, Search, ArrowRight, X } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { t, language, siteContent } = useHealthCenter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readingArticle, setReadingArticle] = useState<NewsUpdate | null>(null);

  const categories = ['all', 'Campaign', 'Schedule', 'Advisory', 'Meds'];

  const filteredNews = siteContent.news.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.titleFil.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.summaryFil.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="news" className="border-b border-slate-200 bg-[#f4f7f5] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2c7a5f]">
              {language === 'fil' ? 'Pampublikong Pabatid at Balita' : 'Public Health Advisories'}
            </div>
            <h2 className="text-3xl font-bold text-[#0f4d3c]" style={{ textWrap: 'balance' }}>
              {t.newsTitle}
            </h2>
            <p className="text-sm text-slate-600">
              {t.newsSubtitle}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.newsSearchPlaceholder}
              className="w-full rounded-md border border-[#d9e3dd] bg-white py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-[#2c7a5f] focus:ring-2 focus:ring-[#dcefe7]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto rounded-md bg-[#e7ece9] p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-[#0f4d3c] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-[#0f4d3c]'
              }`}
            >
              {cat === 'all' ? 'All Updates' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="flex flex-col justify-between border border-[#d9e3dd] bg-white p-6 transition-all hover:border-[#9bbdad]"
            >
              <div className="space-y-4">

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-950 leading-snug">
                    {language === 'fil' ? news.titleFil : news.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'fil' ? news.summaryFil : news.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {news.author}
                </span>

                <button
                  onClick={() => setReadingArticle(news)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.btnReadArticle}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>


      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xs sm:items-center sm:p-4">
          <div className="my-0 max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:my-5 sm:max-h-[90vh] sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {language === 'fil' ? readingArticle.titleFil : readingArticle.title}
                </h3>
                <div className="text-xs text-slate-500">
                  Published by {readingArticle.author} · Masikap Health Center
                </div>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-sm text-slate-700 leading-relaxed text-xs sm:text-sm">
              <p>
                {language === 'fil' ? readingArticle.contentFil : readingArticle.content}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                {t.btnCloseArticle}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
