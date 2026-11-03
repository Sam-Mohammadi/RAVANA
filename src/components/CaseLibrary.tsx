import React, { useState } from 'react';
import { 
  Play, 
  BookOpen, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  User, 
  Filter, 
  Search, 
  PlusCircle, 
  CheckCircle2,
  ChevronLeft,
  Target,
  AlertTriangle,
  Stethoscope,
  GraduationCap,
  SlidersHorizontal
} from 'lucide-react';
import type { ClinicalCase, ClinicalDifficulty, TherapeuticApproach, PatientPersonaConfig } from '../types';
import { PersonaConfigModal } from './PersonaConfigModal';

interface CaseLibraryProps {
  cases: ClinicalCase[];
  onSelectCase: (c: ClinicalCase, persona?: PatientPersonaConfig) => void;
  onOpenCaseCreator: () => void;
}

export const CaseLibrary: React.FC<CaseLibraryProps> = ({
  cases,
  onSelectCase,
  onOpenCaseCreator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedApproach, setSelectedApproach] = useState<string>('all');
  const [inspectingCase, setInspectingCase] = useState<ClinicalCase | null>(null);
  const [configuringPersonaCase, setConfiguringPersonaCase] = useState<ClinicalCase | null>(null);

  const filteredCases = cases.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      c.patientName.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.dsmDiagnosis.toLowerCase().includes(query) ||
      c.chiefComplaint.toLowerCase().includes(query) ||
      (c.symptoms && c.symptoms.some(s => s.toLowerCase().includes(query))) ||
      (c.keyChallenges && c.keyChallenges.some(ch => ch.toLowerCase().includes(query))) ||
      (c.learningObjectives && c.learningObjectives.some(lo => lo.toLowerCase().includes(query)));

    const matchesDifficulty = selectedDifficulty === 'all' || c.difficulty === selectedDifficulty;
    const matchesApproach = selectedApproach === 'all' || c.recommendedApproach === selectedApproach;

    return matchesSearch && matchesDifficulty && matchesApproach;
  });

  const getDifficultyBadge = (diff: ClinicalDifficulty) => {
    switch (diff) {
      case 'beginner':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">سطح ۱: مراجع همکار (مبتدی)</span>;
      case 'intermediate':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">سطح ۲: مقاومت متوسط</span>;
      case 'advanced':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">سطح ۳: چالش بالا و مقاومت شدید</span>;
    }
  };

  const getApproachBadge = (approach: TherapeuticApproach) => {
    switch (approach) {
      case 'CBT':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">CBT شناختی-رفتاری</span>;
      case 'ACT':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200">ACT پذیرش و تعهد</span>;
      case 'SchemaTherapy':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">طرح‌واره‌درمانی</span>;
      case 'Psychodynamic':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">روان‌پویشی</span>;
      case 'PersonCentered':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">مراجع‌محور</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8 bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-md">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-medium mb-3 backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>سامانه بالینی روانا (Ravāna) • پرونده‌های تشخیصی DSM-5-TR</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            کتابخانه پرونده‌های شبیه‌سازی روان‌درمانی
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
            کیس درمانی مورد نظر خود را انتخاب کنید و در اتاق شبیه‌سازی با مراجع مجازی مکالمه بالینی داشته باشید. سوپروایزر هوشمند در هر لحظه تکنیک‌ها، نمره همدلی و خطاهای شما را بررسی می‌کند.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="btn-add-case-library"
            onClick={onOpenCaseCreator}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-teal-500 hover:bg-teal-400 text-stone-900 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>طراحی کیس سفارشی</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
          <input
            id="input-search-cases"
            type="text"
            placeholder="جستجوی نام بیمار، تشخیص، یا شکایت اصلی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-stone-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 ml-1">
            <Filter className="w-3.5 h-3.5" />
            <span>فیلترها:</span>
          </div>

          <select
            id="select-filter-difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            aria-label="فیلتر سطح دشواری پرونده بالینی"
            className="flex-1 sm:flex-none text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">همه سطوح سختی</option>
            <option value="beginner">مبتدی (همکار)</option>
            <option value="intermediate">متوسط (مردد)</option>
            <option value="advanced">پیشرفته (مقاوم و بحرانی)</option>
          </select>

          <select
            id="select-filter-approach"
            value={selectedApproach}
            onChange={(e) => setSelectedApproach(e.target.value)}
            aria-label="فیلتر رویکرد درمانی"
            className="flex-1 sm:flex-none text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">همه رویکردهای درمانی</option>
            <option value="CBT">شناختی-رفتاری (CBT)</option>
            <option value="ACT">پذیرش و تعهد (ACT)</option>
            <option value="SchemaTherapy">طرح‌واره‌درمانی</option>
            <option value="Psychodynamic">روان‌پویشی</option>
          </select>
        </div>
      </div>

      {/* Case Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            id={`case-card-${c.id}`}
            className="bg-white rounded-2xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
          >
            <div>
              {/* Card Header with Avatar Gradient */}
              <div className="p-5 pb-3 border-b border-stone-100 flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0`}>
                  {c.patientName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base font-bold text-stone-900 truncate">
                      {c.patientName}
                    </h3>
                    <span className="text-xs text-stone-400 font-mono shrink-0">
                      {c.age} ساله
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 truncate mt-0.5">{c.occupation} • {c.maritalStatus}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {getDifficultyBadge(c.difficulty)}
                    {getApproachBadge(c.recommendedApproach)}
                  </div>
                </div>
              </div>

              {/* Diagnosis & Quote */}
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                    تشخیص بالینی
                  </div>
                  <div className="text-xs font-medium text-stone-800 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                    {c.dsmDiagnosis}
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div className="text-[11px] font-semibold text-stone-500 mb-1">شکایت اصلی مراجع:</div>
                  <p className="text-xs text-stone-700 italic leading-relaxed line-clamp-2">
                    {c.chiefComplaint}
                  </p>
                </div>

                {/* Educational Highlights Pill Section */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-emerald-50/80 text-emerald-800 p-2 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">
                      {c.learningObjectives?.length || 4} هدف یادگیری بالینی
                    </span>
                  </div>
                  <div className="bg-rose-50/80 text-rose-800 p-2 rounded-lg border border-rose-200/60 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="font-semibold truncate">
                      {c.keyChallenges?.length || 3} چالش مقاومتی
                    </span>
                  </div>
                </div>

                {/* Symptoms Preview if available */}
                {c.symptoms && c.symptoms.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 mb-1 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-indigo-500" />
                      <span>علائم بالینی کلیدی:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.symptoms.slice(0, 2).map((sym, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[140px]">
                          {sym}
                        </span>
                      ))}
                      {c.symptoms.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-stone-400">+{c.symptoms.length - 2} علامت دیگر</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Schemas and Defense tags */}
                <div>
                  <div className="text-[11px] font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>سازوکارهای دفاعی و طرح‌واره‌ها:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.defenseMechanisms.slice(0, 2).map((def, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {def}
                      </span>
                    ))}
                    {c.defenseMechanisms.length > 2 && (
                      <span className="text-[11px] px-1.5 py-0.5 text-stone-400">+{c.defenseMechanisms.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 pt-3 border-t border-stone-100 bg-stone-50/50 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  id={`btn-inspect-case-${c.id}`}
                  onClick={() => setInspectingCase(c)}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
                >
                  مشاهده پرونده کامل
                </button>

                <button
                  id={`btn-quick-start-${c.id}`}
                  onClick={() => onSelectCase(c)}
                  title="شروع سریع با پرسونای پیش‌فرض پرونده"
                  className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 hover:underline px-2 py-1 flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>شروع سریع</span>
                </button>
              </div>

              <button
                id={`btn-persona-start-${c.id}`}
                onClick={() => setConfiguringPersonaCase(c)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-200" />
                <span>تنظیم لحن و پرسونا (شروع جلسه)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">پرونده‌ای مطابق با فیلترهای انتخابی یافت نشد.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDifficulty('all'); setSelectedApproach('all'); }}
            className="mt-3 text-xs text-indigo-600 hover:underline font-semibold"
          >
            پاکسازی فیلترها
          </button>
        </div>
      )}

      {/* Case Inspector Modal */}
      {inspectingCase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl p-4 sm:p-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 mb-5 gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${inspectingCase.avatarColor} text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-xs shrink-0`}>
                  {inspectingCase.patientName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      پرونده بالینی: {inspectingCase.patientName}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getDifficultyBadge(inspectingCase.difficulty)}
                      {getApproachBadge(inspectingCase.recommendedApproach)}
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {inspectingCase.age} ساله • {inspectingCase.occupation} • {inspectingCase.maritalStatus}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-inspect-case"
                onClick={() => setInspectingCase(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1 rounded-lg hover:bg-stone-100 shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-stone-700">
              
              {/* Diagnosis */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-indigo-900 block mb-1 text-sm">تشخیص راهنمای تشخیصی و آماری (DSM-5-TR):</span>
                  <span className="text-indigo-800 font-medium text-xs">{inspectingCase.dsmDiagnosis}</span>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-[10px] text-stone-500 block">اضطراب اولیه: {inspectingCase.initialAnxiety}٪</span>
                  <span className="text-[10px] text-stone-500 block">اتحاد درمانی اولیه: {inspectingCase.initialRapport}٪</span>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <span className="font-bold text-stone-900 block mb-1">شکایت اصلی مراجع (Chief Complaint):</span>
                <p className="bg-stone-50 p-3 rounded-lg border border-stone-200 italic text-stone-800 font-medium">{inspectingCase.chiefComplaint}</p>
              </div>

              {/* History of Present Illness */}
              <div>
                <span className="font-bold text-stone-900 block mb-1">تاریخچه بیماری فعلی و سیر بالینی (HPI):</span>
                <p className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-justify leading-relaxed">{inspectingCase.historyOfPresentIllness}</p>
              </div>

              {/* Symptoms Section */}
              {inspectingCase.symptoms && inspectingCase.symptoms.length > 0 && (
                <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/80">
                  <span className="font-bold text-blue-900 block mb-2 flex items-center gap-1.5 text-xs">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>نشانه‌ها و علائم بالینی مراجع (Clinical Symptoms):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inspectingCase.symptoms.map((sym, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-blue-100 text-blue-950 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Objectives Section */}
              {inspectingCase.learningObjectives && inspectingCase.learningObjectives.length > 0 && (
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80">
                  <span className="font-bold text-emerald-900 block mb-2 flex items-center gap-1.5 text-xs">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>اهداف یادگیری بالینی مشخص برای دانشجو (Learning Objectives):</span>
                  </span>
                  <div className="space-y-1.5">
                    {inspectingCase.learningObjectives.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-emerald-100 text-emerald-950 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Challenges during Treatment */}
              {inspectingCase.keyChallenges && inspectingCase.keyChallenges.length > 0 && (
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/80">
                  <span className="font-bold text-rose-900 block mb-2 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>چالش‌های کلیدی در طول درمان و مقاومت‌های بیمار (Key Clinical Challenges):</span>
                  </span>
                  <div className="space-y-1.5">
                    {inspectingCase.keyChallenges.map((ch, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-rose-100 text-rose-950 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schemas & Defense Mechanisms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1">طرح‌واره‌های ناسازگار اولیه (Schemas):</span>
                  <ul className="list-disc list-inside space-y-1">
                    {inspectingCase.coreSchemas.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1">مکانیسم‌های دفاعی و مقابله‌ای (Defenses):</span>
                  <ul className="list-disc list-inside space-y-1">
                    {inspectingCase.defenseMechanisms.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Questions */}
              <div>
                <span className="font-bold text-stone-900 block mb-1">نمونه سوالات اکتشافی و هدایت‌کننده پیشنهادی برای درمانگر:</span>
                <div className="space-y-1.5">
                  {inspectingCase.suggestedQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-emerald-900 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setInspectingCase(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                بستن
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="btn-quick-start-inspect"
                  onClick={() => {
                    const target = inspectingCase;
                    setInspectingCase(null);
                    onSelectCase(target);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  شروع سریع (پرسونای پیش‌فرض)
                </button>

                <button
                  id="btn-confirm-start-case"
                  onClick={() => {
                    const target = inspectingCase;
                    setConfiguringPersonaCase(target);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-200" />
                  <span>تنظیم لحن و پرسونا (Persona)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Persona Configuration Modal */}
      {configuringPersonaCase && (
        <PersonaConfigModal
          isOpen={!!configuringPersonaCase}
          onClose={() => setConfiguringPersonaCase(null)}
          targetCase={configuringPersonaCase}
          onConfirmStartSession={(selectedCase, persona) => {
            setConfiguringPersonaCase(null);
            setInspectingCase(null);
            onSelectCase(selectedCase, persona);
          }}
        />
      )}

    </div>
  );
};
