import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  BookmarkPlus, 
  Layers, 
  Tag, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  Stethoscope,
  Info,
  Loader2
} from 'lucide-react';
import { PsychologyGlossaryItem, ClinicalCase } from '../types';
import { PSYCHOLOGY_GLOSSARY_DATABASE, GLOSSARY_CATEGORIES } from '../data/psychologyGlossary';

interface PsychologyGlossaryWidgetProps {
  currentCase?: ClinicalCase;
  onInsertIntoNotes?: (text: string) => void;
  className?: string;
  initialSearchQuery?: string;
}

export const PsychologyGlossaryWidget: React.FC<PsychologyGlossaryWidgetProps> = ({
  currentCase,
  onInsertIntoNotes,
  className = '',
  initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [copiedTermId, setCopiedTermId] = useState<string | null>(null);
  const [insertedTermId, setInsertedTermId] = useState<string | null>(null);

  // Custom AI Lookup state for non-database or niche clinical terms
  const [aiLookupResult, setAiLookupResult] = useState<PsychologyGlossaryItem | null>(null);
  const [isLoadingAiLookup, setIsLoadingAiLookup] = useState(false);
  const [aiLookupError, setAiLookupError] = useState<string | null>(null);

  // Filter local database based on query & category
  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return PSYCHOLOGY_GLOSSARY_DATABASE.filter(item => {
      // Category filter
      const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      // Query filter
      if (!q) return true;

      const inFa = item.termFa.toLowerCase().includes(q);
      const inEn = item.termEn.toLowerCase().includes(q);
      const inDef = item.definition.toLowerCase().includes(q);
      const inEx = item.clinicalExample.toLowerCase().includes(q);
      const inApp = item.therapeuticApplication.toLowerCase().includes(q);
      const inTags = item.tags?.some(t => t.toLowerCase().includes(q)) ?? false;
      const inRelated = item.relatedTerms?.some(r => r.toLowerCase().includes(q)) ?? false;

      return inFa || inEn || inDef || inEx || inApp || inTags || inRelated;
    });
  }, [searchQuery, selectedCategory]);

  // Derive relevant terms for the active clinical case
  const caseRelevantTerms = useMemo(() => {
    if (!currentCase) return [];
    const keywords: string[] = [];

    if (currentCase.diagnosis) keywords.push(currentCase.diagnosis);
    if (currentCase.chiefComplaint) keywords.push(currentCase.chiefComplaint);
    if (Array.isArray(currentCase.defenseMechanisms)) {
      keywords.push(...currentCase.defenseMechanisms);
    }

    const matches: PsychologyGlossaryItem[] = [];
    PSYCHOLOGY_GLOSSARY_DATABASE.forEach(item => {
      const isMatch = keywords.some(kw => {
        const k = kw.toLowerCase();
        return item.termFa.includes(k) || 
               item.termEn.toLowerCase().includes(k) || 
               item.tags?.some(t => t.toLowerCase().includes(k));
      });
      if (isMatch && !matches.some(m => m.id === item.id)) {
        matches.push(item);
      }
    });

    return matches.slice(0, 4);
  }, [currentCase]);

  // Copy handler
  const handleCopyTerm = (item: PsychologyGlossaryItem) => {
    const textToCopy = `【${item.termFa} (${item.termEn})】\nدسته: ${item.category}\nتعریف: ${item.definition}\nنمونه بالینی: ${item.clinicalExample}\nکاربرد درمانی: ${item.therapeuticApplication}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTermId(item.id);
    setTimeout(() => setCopiedTermId(null), 2000);
  };

  // Insert to notes handler
  const handleInsertToNotes = (item: PsychologyGlossaryItem) => {
    if (!onInsertIntoNotes) return;
    const formattedNote = `\n[واژه‌نامه تخصصی - ${item.termFa} (${item.termEn})]:\n${item.definition}\nکاربرد بالینی: ${item.therapeuticApplication}\n`;
    onInsertIntoNotes(formattedNote);
    setInsertedTermId(item.id);
    setTimeout(() => setInsertedTermId(null), 2000);
  };

  // AI Lookup handler
  const handlePerformAiLookup = async (termToLookup?: string) => {
    const term = (termToLookup || searchQuery).trim();
    if (!term) return;

    setIsLoadingAiLookup(true);
    setAiLookupError(null);
    setAiLookupResult(null);

    try {
      const res = await fetch('/api/glossary-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiLookupResult(data.data);
        setExpandedTermId(data.data.id);
      } else {
        setAiLookupError(data.error || 'تعریفی برای این اصطلاح یافت نشد.');
      }
    } catch (err: any) {
      setAiLookupError('خطا در برقراری ارتباط با واژه‌نامه هوشمند.');
    } finally {
      setIsLoadingAiLookup(false);
    }
  };

  return (
    <div 
      id="widget-psychology-glossary"
      className={`flex flex-col h-full bg-white rounded-xl border border-stone-200 overflow-hidden text-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="p-3.5 border-b border-stone-200 bg-stone-50/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                واژه‌نامه تخصصی روانشناسی بالینی
              </h3>
              <p className="text-[11px] text-stone-500">
                مرجع سریع مفاهیم، مکاتب، اصطلاحات DSM-5 و فنون درمانی
              </p>
            </div>
          </div>

          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
            {filteredTerms.length} اصطلاح
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
          <input
            id="input-glossary-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredTerms.length === 0) {
                handlePerformAiLookup();
              }
            }}
            placeholder="جستجوی اصطلاح بالینی (مثلاً: اعتبارسنجی، انتقال، گسلش، فاجعه‌سازی)..."
            className="w-full pr-8 pl-8 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              id="btn-clear-glossary-search"
              onClick={() => {
                setSearchQuery('');
                setAiLookupResult(null);
              }}
              className="absolute left-2.5 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2.5 scrollbar-none">
          {GLOSSARY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`pill-glossary-cat-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'bg-white hover:bg-stone-200/70 text-stone-600 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Case Relevant Concepts Quick Bar */}
      {caseRelevantTerms.length > 0 && !searchQuery && (
        <div className="px-3.5 py-2 bg-amber-50/70 border-b border-amber-200/70 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="font-bold text-amber-900 shrink-0 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-amber-700" />
            <span>مرتبط با پرونده جاری:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {caseRelevantTerms.map(term => (
              <button
                key={term.id}
                onClick={() => {
                  setSearchQuery(term.termFa);
                  setExpandedTermId(term.id);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-[10px] transition-colors cursor-pointer shadow-2xs"
              >
                {term.termFa}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-stone-50/50">
        
        {/* AI Dynamic Lookup Card (If generated) */}
        {aiLookupResult && (
          <div className="p-3 bg-gradient-to-br from-indigo-50/90 to-purple-50/60 border-2 border-indigo-300 rounded-xl shadow-xs space-y-2 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-indigo-950 text-xs sm:text-sm">
                    {aiLookupResult.termFa}
                  </span>
                  <span className="font-mono text-[11px] text-indigo-700 dir-ltr">
                    ({aiLookupResult.termEn})
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.2 rounded-full inline-block mt-1">
                  استعلام هوشمند: {aiLookupResult.category}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyTerm(aiLookupResult)}
                  title="کپی تعریف"
                  className="p-1 rounded hover:bg-white text-stone-500 hover:text-indigo-600 transition-colors"
                >
                  {copiedTermId === aiLookupResult.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {onInsertIntoNotes && (
                  <button
                    onClick={() => handleInsertToNotes(aiLookupResult)}
                    title="درج در یادداشت‌های جلسه"
                    className="p-1 rounded hover:bg-white text-stone-500 hover:text-amber-600 transition-colors"
                  >
                    {insertedTermId === aiLookupResult.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <p className="text-stone-800 leading-relaxed text-[11px]">
              {aiLookupResult.definition}
            </p>

            {aiLookupResult.clinicalExample && (
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-100 text-[11px]">
                <strong className="text-indigo-900 block mb-0.5">نمونه در اتاق درمان:</strong>
                <span className="text-stone-700 italic">{aiLookupResult.clinicalExample}</span>
              </div>
            )}

            {aiLookupResult.therapeuticApplication && (
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-[11px]">
                <strong className="text-emerald-900 block mb-0.5">کاربرد درمانی:</strong>
                <span className="text-emerald-950 font-medium">{aiLookupResult.therapeuticApplication}</span>
              </div>
            )}
          </div>
        )}

        {/* Database Matches */}
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item) => {
            const isExpanded = expandedTermId === item.id;

            return (
              <div
                key={item.id}
                id={`glossary-item-${item.id}`}
                className="bg-white border border-stone-200/90 rounded-xl p-3 shadow-2xs hover:border-indigo-300 transition-all space-y-2"
              >
                {/* Top Title & Category Line */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        {item.termFa}
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 dir-ltr">
                        {item.termEn}
                      </span>
                      {item.dsmReference && (
                        <span className="text-[10px] font-mono font-semibold bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.2 rounded">
                          {item.dsmReference}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Top Action Buttons (Copy, Insert Note, Expand) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`btn-copy-term-${item.id}`}
                      onClick={() => handleCopyTerm(item)}
                      title="کپی تعریف این اصطلاح"
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      {copiedTermId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onInsertIntoNotes && (
                      <button
                        id={`btn-insert-note-${item.id}`}
                        onClick={() => handleInsertToNotes(item)}
                        title="درج در یادداشت‌های بالینی جلسه"
                        className="p-1 rounded-md text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        {insertedTermId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      id={`btn-toggle-expand-${item.id}`}
                      onClick={() => setExpandedTermId(isExpanded ? null : item.id)}
                      title={isExpanded ? 'بستن جزئیات' : 'مشاهده نمونه بالینی و کاربرد درمانی'}
                      className="p-1 rounded-md text-stone-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Definition */}
                <p className="text-stone-700 leading-relaxed text-[11px] font-normal">
                  {item.definition}
                </p>

                {/* Expandable Details: Clinical Example & Therapeutic Application */}
                {isExpanded && (
                  <div className="pt-2 border-t border-stone-100 space-y-2 animate-fadeIn">
                    
                    {/* Clinical Vignette / Example in Session */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                        <Brain className="w-3.5 h-3.5 text-amber-700" />
                        <span>نمونه در اتاق درمان:</span>
                      </div>
                      <p className="text-stone-800 leading-relaxed text-[11px] italic bg-white/70 p-2 rounded border border-amber-100">
                        {item.clinicalExample}
                      </p>
                    </div>

                    {/* Therapeutic Action Application */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                        <span>توصیه و کاربرد برای درمانگر:</span>
                      </div>
                      <p className="text-emerald-950 leading-relaxed text-[11px] font-medium">
                        {item.therapeuticApplication}
                      </p>
                    </div>

                    {/* Related Terms & Tags */}
                    {item.relatedTerms && item.relatedTerms.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                        <span className="text-stone-400 font-semibold">مفاهیم مرتبط:</span>
                        {item.relatedTerms.map((rt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(rt);
                              const match = PSYCHOLOGY_GLOSSARY_DATABASE.find(dbItem => dbItem.termFa.includes(rt) || rt.includes(dbItem.termFa));
                              if (match) setExpandedTermId(match.id);
                            }}
                            className="px-2 py-0.5 rounded bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 transition-colors cursor-pointer"
                          >
                            #{rt}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty Search State with AI Instant Lookup Callout */
          <div className="py-8 px-4 text-center space-y-3 bg-white rounded-xl border border-stone-200">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-stone-800 text-xs sm:text-sm">
                موردی در واژه‌نامه پایه برای «{searchQuery}» یافت نشد
              </h4>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                می‌توانید با استفاده از هوش مصنوعی، تعریف تخصصی بالینی و نمونه‌های عملی این اصطلاح را مستقیماً دریافت کنید.
              </p>
            </div>

            {searchQuery && (
              <div className="pt-2">
                <button
                  id="btn-ai-glossary-lookup"
                  onClick={() => handlePerformAiLookup()}
                  disabled={isLoadingAiLookup}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoadingAiLookup ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال استخراج تعریف و تحلیل بالینی...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>استعلام برخط «{searchQuery}» از واژه‌نامه هوشمند</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {aiLookupError && (
              <p className="text-[11px] text-rose-600 font-medium">
                {aiLookupError}
              </p>
            )}
          </div>
        )}

      </div>

      {/* Footer Helper Note */}
      <div className="p-2.5 bg-stone-100/80 border-t border-stone-200 text-[10px] text-stone-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-stone-400" />
          <span>مرجع بر اساس استانداردهای APA و DSM-5-TR</span>
        </span>
        <button
          onClick={() => {
            const random = PSYCHOLOGY_GLOSSARY_DATABASE[Math.floor(Math.random() * PSYCHOLOGY_GLOSSARY_DATABASE.length)];
            setSearchQuery(random.termFa);
            setExpandedTermId(random.id);
          }}
          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
        >
          اصطلاح تصادفی 🎲
        </button>
      </div>

    </div>
  );
};
