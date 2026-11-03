import React, { useState } from 'react';
import { 
  Award, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  User, 
  ChevronLeft,
  ChevronDown,
  Layers,
  Sparkles,
  Printer,
  BookHeart
} from 'lucide-react';
import type { SavedSession, DeepEvaluationReport } from '../types';
import { PatientTrajectoryChart } from './PatientTrajectoryChart';

interface ProgressDashboardProps {
  sessions: SavedSession[];
  onOpenReport: (report: DeepEvaluationReport, session: SavedSession) => void;
  onStartNewSession: () => void;
  onOpenReflectiveJournal?: (session?: SavedSession) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  sessions,
  onOpenReport,
  onStartNewSession,
  onOpenReflectiveJournal,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  );
  const averageScore = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.finalScore || 0), 0) / totalSessions)
    : 0;

  const getClinicalBadge = (avg: number) => {
    if (avg >= 85) return { text: 'درمانگر ارشد بالینی (صلاحیت پیشرفته)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (avg >= 70) return { text: 'کارآموز واجد صلاحیت (متوسط)', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    if (avg >= 50) return { text: 'در حال ارتقای مهارت‌های پایه', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { text: 'شروع کارآموزی', color: 'bg-stone-50 text-stone-600 border-stone-200' };
  };

  const badge = getClinicalBadge(averageScore);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8">
      
      {/* Header & Stats Cards */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              کارنامه و پرونده آموزشی بالینی
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              ثبت تاریخچه جلسات، ارزیابی مقیاس CTRS و سیر تحول شایستگی‌های بالینی در پایگاه داده ابری Firestore
            </p>
          </div>

          <div className={`px-3 sm:px-4 py-2 rounded-2xl border text-xs font-bold ${badge.color} inline-flex items-center gap-2 self-start sm:self-auto`}>
            <Award className="w-4 h-4 shrink-0" />
            <span>سطح بالینی: {badge.text}</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium text-stone-600">میانگین نمره صلاحیت (CTRS)</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
              {averageScore}<span className="text-base font-normal text-stone-400"> /۱۰۰</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">بر اساس تمام جلسات تکمیل‌شده</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium text-stone-600">جلسات شبیه‌سازی‌شده</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
              {totalSessions}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">جلسه ارزیابی با سوپروایزر</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium text-stone-600">مجموع ساعات تمرین بالینی</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
              {totalMinutes} <span className="text-sm font-normal text-stone-500">دقیقه</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">تعامل زنده در اتاق درمان مجازی</div>
          </div>
        </div>

        {/* Reflective Journal Callout Banner */}
        {onOpenReflectiveJournal && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-indigo-50 to-teal-50 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <BookHeart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  ردیابی رشد فردی و مدیریت انتقال متقابل در «ژورنال تأملی»
                </h4>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  شایستگی بالینی شما تنها در نمره خلاصه نمی‌شود؛ خودآگاهی، شفقت به خود و کشف احساسات درونی حین جلسات را مستند کنید.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenReflectiveJournal()}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              مشاهده ژورنال تأملی
            </button>
          </div>
        )}
      </div>

      {/* Longitudinal Anxiety & Rapport Recharts Line Chart */}
      <PatientTrajectoryChart sessions={sessions} />

      {/* Historical Sessions List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>سوابق و ترانسکریپت جلسات درمانی شما:</span>
          </h3>
          <button
            onClick={onStartNewSession}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            + شروع جلسه جدید
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <FileText className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="text-sm font-bold text-stone-700">هنوز هیچ جلسه‌ای ثبت نشده است</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              یکی از پرونده‌های بالینی را از کتابخانه کیس‌ها انتخاب کرده و اولین جلسه شبیه‌سازی خود را آغاز نمایید.
            </p>
            <button
              onClick={onStartNewSession}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              رفتن به کتابخانه کیس‌ها
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              return (
                <div key={s.id} className="p-5 hover:bg-stone-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {s.patientName?.slice(0, 1) || 'ک'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">{s.caseTitle || s.patientName}</h4>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          مراجع: {s.patientName} • تشخیص: {s.dsmDiagnosis}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-sm font-bold text-stone-900 font-mono">
                          نمره: {s.finalScore}/۱۰۰
                        </div>
                        <div className="text-[11px] text-teal-700 font-medium">
                          رتبه: {s.clinicalGrade}
                        </div>
                      </div>

                      {s.evaluationReport && (
                        <button
                          onClick={() => onOpenReport(s.evaluationReport!, s)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>کارنامه و دریافت نسخه PDF/متن</span>
                        </button>
                      )}

                      {onOpenReflectiveJournal && (
                        <button
                          onClick={() => onOpenReflectiveJournal(s)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="ثبت تأمل و رشد فردی درباره این جلسه در ژورنال"
                        >
                          <BookHeart className="w-3.5 h-3.5 text-rose-600" />
                          <span>تأمل در ژورنال</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
                        title={isExpanded ? 'بستن گفتگو' : 'مشاهده گفتگوی جلسه'}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                  </div>

                  {/* Expanded Transcript & Notes View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-200/80 bg-stone-50 p-4 rounded-xl space-y-3">
                      
                      {/* Therapist's Clinical Notes (if available) */}
                      {s.clinicalNotes && (
                        <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900">
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>یادداشت‌های بالینی ثبت‌شده در طول جلسه:</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-stone-800 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 font-sans">
                            {s.clinicalNotes}
                          </p>
                        </div>
                      )}

                      <div className="text-xs font-bold text-stone-700 mb-2 flex items-center justify-between">
                        <span>متن پیاده‌سازی‌شده جلسه (Transcript):</span>
                        <span className="text-[11px] text-stone-500">{s.messages.length} پیام تبادل‌شده</span>
                      </div>
                      
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {s.messages.map((m, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                              m.role === 'therapist' 
                                ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 ml-6' 
                                : 'bg-white border border-stone-200 text-stone-800 mr-6'
                            }`}
                          >
                            <span className="font-bold block text-[10px] text-stone-500 mb-0.5">
                              {m.role === 'therapist' ? 'دانشجوی درمانگر' : s.patientName}:
                            </span>
                            <p>{m.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
