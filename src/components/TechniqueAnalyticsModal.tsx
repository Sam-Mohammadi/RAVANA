import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  X, 
  ShieldCheck, 
  HeartHandshake, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  MessageSquareQuote,
  Sparkles,
  Award
} from 'lucide-react';
import type { SimulationMessage, ClinicalCase } from '../types';

interface TechniqueAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SimulationMessage[];
  currentCase: ClinicalCase;
}

export const TechniqueAnalyticsModal: React.FC<TechniqueAnalyticsModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentCase,
}) => {
  if (!isOpen) return null;

  // Filter therapist messages that received supervisor feedback
  const therapistInterventions = messages.filter(
    (m) => m.role === 'therapist' && m.supervisorFeedback
  );

  // Technique frequencies & categories
  const techniqueCounts: Record<string, { count: number; totalScore: number; lastCategory?: string }> = {};
  let totalEmpathy = 0;
  let totalAllianceDelta = 0;
  let trapsCount = 0;
  const trapsList: string[] = [];

  therapistInterventions.forEach((m) => {
    const fb = m.supervisorFeedback!;
    const tech = fb.techniqueCategory || fb.techniqueUsed || 'کاوش بالینی';
    
    if (!techniqueCounts[tech]) {
      techniqueCounts[tech] = { count: 0, totalScore: 0, lastCategory: fb.techniqueCategory };
    }
    techniqueCounts[tech].count += 1;
    techniqueCounts[tech].totalScore += fb.empathyScore || 7;
    
    totalEmpathy += fb.empathyScore || 7;
    totalAllianceDelta += fb.allianceDelta || 0;

    if (fb.identifiedTrap && fb.identifiedTrap !== 'هیچ') {
      trapsCount += 1;
      if (!trapsList.includes(fb.identifiedTrap)) {
        trapsList.push(fb.identifiedTrap);
      }
    }
  });

  const totalInterventions = therapistInterventions.length;
  const avgEmpathy = totalInterventions > 0 ? (totalEmpathy / totalInterventions).toFixed(1) : '۰';

  // Word count balance (Therapist vs Patient)
  let therapistWords = 0;
  let patientWords = 0;
  messages.forEach((m) => {
    const words = m.content.trim().split(/\s+/).length;
    if (m.role === 'therapist') therapistWords += words;
    if (m.role === 'patient') patientWords += words;
  });
  const totalWords = therapistWords + patientWords || 1;
  const therapistWordPct = Math.round((therapistWords / totalWords) * 100);
  const patientWordPct = 100 - therapistWordPct;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>ماتریس تحلیل تکنیک‌ها و تعاملات زنده</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  تحلیل بلادرنگ
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                پایش لحظه‌ای مداخلات بالینی در تعامل با {currentCase.patientName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-stone-800 text-xs">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-center">
              <span className="text-[11px] text-stone-500 block mb-1">تعداد مداخلات درمانگر</span>
              <span className="text-xl font-bold font-mono text-stone-900">{totalInterventions}</span>
              <span className="text-[10px] text-stone-400 block mt-0.5">نوبت سخن</span>
            </div>

            <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/80 text-center">
              <span className="text-[11px] text-teal-700 block mb-1">میانگین نمره همدلی</span>
              <span className="text-xl font-bold font-mono text-teal-900">{avgEmpathy} <span className="text-xs font-normal">از ۱۰</span></span>
              <span className="text-[10px] text-teal-600 block mt-0.5">شاخص درک تجربه</span>
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200/80 text-center">
              <span className="text-[11px] text-indigo-700 block mb-1">تغییر تجمعی اتحاد درمانی</span>
              <span className="text-xl font-bold font-mono text-indigo-900">
                {totalAllianceDelta > 0 ? `+${totalAllianceDelta}` : totalAllianceDelta}
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">همکاری و اعتماد</span>
            </div>

            <div className={`p-3.5 rounded-2xl border text-center ${
              trapsCount === 0 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <span className="text-[11px] block mb-1">دام‌های بالینی ثبت‌شده</span>
              <span className="text-xl font-bold font-mono">{trapsCount}</span>
              <span className="text-[10px] block mt-0.5">
                {trapsCount === 0 ? 'عدم وقوع خطا ✓' : 'نیازمند تعدیل'}
              </span>
            </div>

          </div>

          {/* Dialogue Balance (Speaking Time Ratio) */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-stone-600" />
                <span>تعادل گفتگوی درمانی (سهم کلامی درمانگر در برابر مراجع):</span>
              </span>
              <span className="text-[11px] text-stone-500 font-normal">
                {patientWordPct >= 60 ? '✓ نسبت طلایی گوش‌دادن فعال رعایت شده است' : 'هشدار: سهم کلامی درمانگر بالاست'}
              </span>
            </div>

            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${patientWordPct}%` }}
                className="h-full bg-teal-600 transition-all duration-500"
                title={`مراجع: ${patientWordPct}%`}
              />
              <div 
                style={{ width: `${therapistWordPct}%` }}
                className="h-full bg-indigo-600 transition-all duration-500"
                title={`درمانگر: ${therapistWordPct}%`}
              />
            </div>

            <div className="flex justify-between text-[11px] pt-1 text-stone-600 font-medium">
              <span className="flex items-center gap-1.5 text-teal-800">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                <span>مراجع: {patientWordPct}٪ ({patientWords} کلمه)</span>
              </span>
              <span className="flex items-center gap-1.5 text-indigo-800">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>درمانگر: {therapistWordPct}٪ ({therapistWords} کلمه)</span>
              </span>
            </div>
          </div>

          {/* Technique Distribution Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>فراوانی تکنیک‌های به کار رفته در این جلسه:</span>
            </h4>

            {Object.keys(techniqueCounts).length === 0 ? (
              <p className="text-stone-400 italic py-4 text-center">
                هنوز مداخله‌ای ثبت نشده است. با ارسال اولین پیام، تحلیل تکنیک‌ها اینجا ظاهر می‌شود.
              </p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(techniqueCounts).map(([techName, data], idx) => {
                  const pct = Math.round((data.count / totalInterventions) * 100);
                  const avgScore = (data.totalScore / data.count).toFixed(1);
                  return (
                    <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">{techName}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-stone-200 text-stone-700 font-mono">
                            {data.count} بار ({pct}٪)
                          </span>
                        </div>
                        <span className="text-[11px] text-teal-700 font-medium">
                          میانگین همدلی: <span className="font-mono font-bold">{avgScore}</span>/۱۰
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-600 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Traps Encountered */}
          {trapsList.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>دام‌های بالینی شناسایی‌شده در طول جلسه:</span>
              </h4>
              <ul className="space-y-1 text-xs">
                {trapsList.map((trap, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                توصیه سوپروایزر: سعی کنید در نوبت‌های بعد به جای حل مسئله سریع، فضای بیشتری به احساس زیربنایی مراجع اختصاص دهید.
              </p>
            </div>
          )}

          {/* Timeline of Empathy across interventions */}
          {therapistInterventions.length > 1 && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>روند همدلی و عمق مداخله در طول گفتگو:</span>
              </h4>
              <div className="flex items-end gap-1.5 h-20 pt-4 px-2 border-b border-stone-200">
                {therapistInterventions.map((m, idx) => {
                  const score = m.supervisorFeedback?.empathyScore || 5;
                  const heightPct = Math.max(20, score * 10);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-stone-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {m.supervisorFeedback?.techniqueUsed || 'مداخله'}: {score}/10
                      </div>
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t transition-all ${
                          score >= 8 ? 'bg-teal-600' : score >= 6 ? 'bg-teal-400' : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-stone-400">#{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 pt-1">
                <span>شروع جلسه</span>
                <span>پایان/اکنون</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
          >
            بستن و بازگشت به جلسه
          </button>
        </div>

      </div>
    </div>
  );
};
