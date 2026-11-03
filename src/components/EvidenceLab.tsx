import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Bookmark,
  Layers
} from 'lucide-react';

export const EvidenceLab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    groundingMetadata?: any;
  } | null>(null);

  const presetQueries = [
    {
      title: 'پروتکل درمان شناختی-رفتاری برای حملات پانیک',
      category: 'CBT Protocol',
      query: 'پروتکل استاندارد درمان شناختی رفتاری CBT برای حملات پانیک و اضطراب فراگیر طبق گایدلاین NICE'
    },
    {
      title: 'معیارهای تشخیصی اختلال شخصیت مرزی در DSM-5-TR',
      category: 'DSM-5-TR',
      query: 'معیارهای تشخیصی رسمی DSM-5-TR برای اختلال شخصیت مرزی BPD و تمایز آن با دو قطبی نوع ۲'
    },
    {
      title: 'تکنیک مواجهه و بازداری از پاسخ (ERP) در وسواس',
      category: 'OCD Intervention',
      query: 'مراحل اجرای تکنیک مواجهه و جلوگیری از پاسخ Exposure and Response Prevention برای OCD'
    },
    {
      title: 'غربالگری افسردگی اساسی با پرسشنامه PHQ-9',
      category: 'Psychometrics',
      query: 'نمره‌دهی و راهنمای تفسیر بالینی پرسشنامه افسردگی بیمار PHQ-9 و سطوح اقدام درمانی'
    }
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/clinical-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({
          answer: data.answer,
          groundingMetadata: data.groundingMetadata
        });
      } else {
        setResult({
          answer: 'متاسفانه در دریافت شواهد بالینی خطایی رخ داد: ' + (data.error || 'خطای ناشناخته')
        });
      }
    } catch (err: any) {
      setResult({
        answer: 'خطا در برقراری ارتباط با سرور پژوهش بالینی: ' + err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-indigo-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-md mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold mb-3">
          <Globe className="w-3.5 h-3.5" />
          <span>پایگاه شواهد زنده (Google Search Grounding + Gemini 3.5 Flash)</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          آزمایشگاه شواهد بالینی و راهنماهای درمانی
        </h2>
        <p className="text-stone-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
          دسترسی مستقیم و متصل به منابع به‌روز روانپزشکی و روانشناسی بالینی (DSM-5-TR، راهنماهای APA و NICE). پروتکل‌های درمانی، پرسشنامه‌ها و فرمولاسیون‌های علمی را بی‌درنگ بررسی کنید.
        </p>

        {/* Search Input Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            <input
              id="input-clinical-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="جستجوی پروتکل مداخله، معیارهای تشخیصی، آزمون بالینی یا داروشناسی..."
              className="w-full pr-10 pl-4 py-3 bg-white text-stone-900 rounded-xl text-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-teal-400 shadow-xs"
            />
          </div>
          <button
            id="btn-run-clinical-search"
            onClick={() => handleSearch(query)}
            disabled={!query.trim() || isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-stone-900 font-bold text-sm rounded-xl transition-all shadow-xs shrink-0"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>جستجوی شواهد</span>
          </button>
        </div>
      </div>

      {/* Preset Query Cards */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-stone-600 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>موضوعات بالینی پرکاربرد برای ارتقای مهارت درمانگری:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(pq.query);
                handleSearch(pq.query);
              }}
              className="text-right p-3.5 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200 hover:border-teal-300 transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 inline-block mb-2">
                  {pq.category}
                </span>
                <h4 className="text-xs font-bold text-stone-800 group-hover:text-indigo-600 leading-snug">
                  {pq.title}
                </h4>
              </div>
              <span className="text-[11px] text-stone-400 font-medium mt-3 flex items-center gap-1">
                مشاهده شواهد ↵
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Result Display */}
      {result && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>پاسخ مستند و تحلیل شواهد بالینی</span>
            </div>
            <span className="text-[11px] text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
              متصل به وب و راهنماهای معتبر بین‌المللی
            </span>
          </div>

          <div className="prose prose-stone max-w-none text-xs leading-relaxed text-stone-800 whitespace-pre-wrap">
            {result.answer}
          </div>

          {/* Search Grounding Sources (if available) */}
          {result.groundingMetadata?.groundingChunks && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <h5 className="text-[11px] font-bold text-stone-500 mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-teal-600" />
                <span>منابع معتبر استناد شده:</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                  const web = chunk.web;
                  if (!web?.uri) return null;
                  return (
                    <a
                      key={i}
                      href={web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{web.title || web.uri}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
