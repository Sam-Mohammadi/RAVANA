import React, { useRef, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { RavanaLogo } from './RavanaLogo';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Printer, 
  Download, 
  Layers, 
  Activity, 
  Sparkles, 
  ArrowRight,
  Target,
  BrainCircuit,
  FileCheck,
  FileText,
  BarChart3,
  Milestone,
  HelpCircle,
  GraduationCap,
  Scale,
  Copy,
  Check,
  Building2,
  ChevronDown,
  ChevronUp,
  Share2,
  UserCheck,
  HeartHandshake,
  FileDown,
  Image as ImageIcon,
  Loader2,
  TrendingDown,
  TrendingUp,
  Heart,
  Minus,
  Clock,
} from 'lucide-react';
import type { DeepEvaluationReport, ClinicalCase, SimulationMessage } from '../types';
import { generateClinicalReportText, downloadTextFile, copyToClipboard } from '../utils/reportExport';
import { extractSessionMetricPoints, calculateSessionMetricsStats, type SessionMetricPoint } from '../utils/sessionMetrics';
import { downloadVisualPdfReport, downloadVisualReportImage } from '../utils/sessionPdfReport';

// Tooltip for the Recharts line chart in the evaluation dossier
const ModalChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: SessionMetricPoint = payload[0].payload;
    return (
      <div 
        dir="rtl"
        className="bg-stone-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-stone-700/80 text-xs font-sans max-w-[240px] space-y-1.5 select-none z-50 pointer-events-none"
      >
        <div className="border-b border-stone-700/70 pb-1 flex items-center justify-between gap-2">
          <span className="font-bold text-stone-100">{data.label}</span>
          <span className="text-[10px] text-stone-400 font-mono">{data.timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-rose-300">
          <span>اضطراب مراجع:</span>
          <span className="font-mono font-bold text-rose-200">{data.anxiety}٪</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-teal-300">
          <span>اتحاد درمانی:</span>
          <span className="font-mono font-bold text-teal-200">{data.rapport}٪</span>
        </div>
        {data.therapistTechnique && (
          <div className="pt-1 border-t border-stone-800 text-[10px] text-stone-300 truncate">
            <span className="text-stone-400">تکنیک: </span>
            <span>{data.therapistTechnique}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface DeepEvaluationModalProps {
  report: DeepEvaluationReport;
  currentCase: ClinicalCase;
  sessionDuration: number;
  messageCount: number;
  messages?: SimulationMessage[];
  onClose: () => void;
  onSaveToPortfolio: () => void;
  isSaved?: boolean;
  clinicalNotes?: string;
  defaultStudentName?: string;
  onOpenReflectiveJournal?: () => void;
}

export const DeepEvaluationModal: React.FC<DeepEvaluationModalProps> = ({
  report,
  currentCase,
  sessionDuration,
  messageCount,
  messages,
  onClose,
  onSaveToPortfolio,
  isSaved,
  clinicalNotes,
  defaultStudentName,
  onOpenReflectiveJournal,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [userReflection, setUserReflection] = useState('');
  
  // Academic submission metadata
  const [studentName, setStudentName] = useState(defaultStudentName || 'دانشجوی کارورزی روان‌شناسی بالینی');
  const [studentId, setStudentId] = useState('');
  const [professorName, setProfessorName] = useState('استاد راهنما / سوپروایزر بالینی');
  const [showAcademicSettings, setShowAcademicSettings] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Trajectory points and stats
  const metricPoints = useMemo(() => {
    return extractSessionMetricPoints(messages || [], undefined, currentCase);
  }, [messages, currentCase]);

  const trajectoryStats = useMemo(() => {
    return calculateSessionMetricsStats(metricPoints);
  }, [metricPoints]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleDownloadVisualPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadVisualPdfReport({
        currentCase,
        messages: messages && messages.length > 0 ? messages : [],
        sessionDuration,
        report,
        studentName,
        studentId,
        professorName,
        clinicalNotes,
      });
    } catch (err) {
      console.error('Error downloading visual PDF report:', err);
      alert('خطا در تولید گزارش تصویری PDF. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadVisualImage = async () => {
    try {
      setIsGeneratingImage(true);
      await downloadVisualReportImage({
        currentCase,
        messages: messages && messages.length > 0 ? messages : [],
        sessionDuration,
        report,
        studentName,
        studentId,
        professorName,
        clinicalNotes,
      });
    } catch (err) {
      console.error('Error downloading visual report image:', err);
      alert('خطا در دانلود تصویر نمودار.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const reportText = generateClinicalReportText({
      report,
      currentCase,
      sessionDuration,
      messageCount,
      clinicalNotes,
      userReflection,
      studentName,
      studentId,
      professorName,
    });
    const cleanPatient = currentCase.patientName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadTextFile(`گزارش_جلسه_بالینی_${cleanPatient}_${dateStr}.txt`, reportText);
  };

  const handleCopyReport = async () => {
    const reportText = generateClinicalReportText({
      report,
      currentCase,
      sessionDuration,
      messageCount,
      clinicalNotes,
      userReflection,
      studentName,
      studentId,
      professorName,
    });
    const ok = await copyToClipboard(reportText);
    if (ok) {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } else {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-teal-600 bg-teal-50 border-teal-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins} دقیقه و ${remainingSecs} ثانیه`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:overflow-visible">
      <div 
        ref={printRef}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-stone-200 shadow-2xl flex flex-col print:border-none print:shadow-none print:max-h-none print:overflow-visible print:rounded-none"
      >
        
        {/* Academic Print Header (Only visible on paper / PDF print) */}
        <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-6 text-stone-900">
          <div className="flex items-center justify-between border-b border-stone-300 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <RavanaLogo variant="icon" size="sm" />
              <div className="text-right">
                <span className="text-xs font-black text-stone-900">سامانه بالینی روانا (Ravāna)</span>
                <span className="text-[10px] text-stone-600 block">شبیه‌ساز هوشمند آموزش و نظارت روان‌درمانی</span>
              </div>
            </div>
            <div className="text-center font-black text-sm text-stone-900">
              فرم رسمی ارزیابی سوپرویژن و گزارش بالینی
            </div>
            <div className="text-left text-[11px] text-stone-600">
              <div>تاریخ جلسه: {new Date().toLocaleDateString('fa-IR')}</div>
              <div>شماره پرونده: CLN-{currentCase.id.slice(0, 6).toUpperCase()}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs border border-stone-300 rounded-lg p-3 bg-stone-50">
            <div><strong>درمانگر / کارورز:</strong> {studentName} {studentId ? `(${studentId})` : ''}</div>
            <div><strong>استاد راهنما / سوپروایزر:</strong> {professorName}</div>
            <div><strong>مراجع:</strong> {currentCase.patientName} ({currentCase.age} ساله)</div>
            <div><strong>تشخیص DSM-5-TR:</strong> {currentCase.dsmDiagnosis}</div>
            <div><strong>مدت زمان جلسه:</strong> {formatTime(sessionDuration)}</div>
            <div><strong>نمره صلاحیت کل:</strong> {report.overallScore}/۱۰۰ ({report.clinicalGrade})</div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs border border-stone-300 rounded-lg p-2.5 bg-stone-50 mt-2">
            <div><strong>اضطراب اولیه:</strong> {trajectoryStats.initialAnxiety}٪</div>
            <div><strong>اضطراب پایانی:</strong> {trajectoryStats.finalAnxiety}٪ ({trajectoryStats.anxietyDelta <= 0 ? `${trajectoryStats.anxietyDelta}٪` : `+${trajectoryStats.anxietyDelta}٪`})</div>
            <div><strong>اتحاد درمانی اولیه:</strong> {trajectoryStats.initialRapport}٪</div>
            <div><strong>اتحاد پایانی:</strong> {trajectoryStats.finalRapport}٪ ({trajectoryStats.rapportDelta >= 0 ? `+${trajectoryStats.rapportDelta}٪` : `${trajectoryStats.rapportDelta}٪`})</div>
          </div>
        </div>

        {/* Modal Header (Screen view) */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-1 rounded-2xl bg-white shadow-md shrink-0">
              <RavanaLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ارزیابی سوپروایزر هوشمند روانا (Ravāna)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                کارنامه رسمی سوپرویژن و نظارت بالینی
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                پرونده: {currentCase.patientName} ({currentCase.dsmDiagnosis.split('(')[0]}) • مدت زمان: {formatTime(sessionDuration)} • تبادلات: {messageCount} پیام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-center">
              <div className="text-[11px] text-stone-300">نمره صلاحیت کل</div>
              <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">
                {report.overallScore}<span className="text-sm text-stone-300 font-normal">/۱۰۰</span>
              </div>
              <div className="text-xs font-bold text-teal-200">{report.clinicalGrade}</div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-stone-800 text-xs">
          
          {/* Executive Summary */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-1.5">
            <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-indigo-700" />
              <span>جمع‌بندی تحلیلی سوپروایزر (Executive Clinical Formulation):</span>
            </h4>
            <p className="text-xs text-indigo-950 leading-relaxed text-justify">
              {report.executiveSummary}
            </p>
          </div>

          {/* Session Trajectory: Anxiety & Therapeutic Alliance Visual Card */}
          <div id="session-trajectory-card" className="bg-gradient-to-br from-stone-50 via-white to-teal-50/20 p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100/80 text-rose-700 border border-rose-200 shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>نمودار سیر جلسه: تغییرات اضطراب و رابطه درمانی</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      {metricPoints.length} نوبت ثبت‌شده
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    سنجش پیوسته سطح برانگیختگی هیجانی مراجع (سرخ) در برابر استحکام پیوند درمانی (فیروزه‌ای)
                  </p>
                </div>
              </div>

              {/* Dedicated Download Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-download-visual-pdf-report"
                  type="button"
                  onClick={handleDownloadVisualPdf}
                  disabled={isGeneratingPdf}
                  title="دانلود گزارش تصویری رسمی با نمودار کامل به صورت فایل PDF"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-700 hover:from-indigo-700 hover:to-teal-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال تولید PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>دانلود گزارش تصویری PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadVisualImage}
                  disabled={isGeneratingImage}
                  title="دانلود تصویر باکیفیت نمودار (PNG)"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  )}
                  <span className="hidden sm:inline">تصویر نمودار</span>
                </button>
              </div>
            </div>

            {/* Real-time Trajectory Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Anxiety Delta */}
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-rose-800">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>اضطراب مراجع</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    {trajectoryStats.anxietyDelta <= 0 ? `${trajectoryStats.anxietyDelta}٪` : `+${trajectoryStats.anxietyDelta}٪`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black font-mono text-rose-900">
                    {trajectoryStats.finalAnxiety}٪
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    شروع: {trajectoryStats.initialAnxiety}٪
                  </span>
                </div>
              </div>

              {/* Rapport Delta */}
              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>اتحاد درمانی</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                    {trajectoryStats.rapportDelta >= 0 ? `+${trajectoryStats.rapportDelta}٪` : `${trajectoryStats.rapportDelta}٪`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black font-mono text-teal-900">
                    {trajectoryStats.finalRapport}٪
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    شروع: {trajectoryStats.initialRapport}٪
                  </span>
                </div>
              </div>

              {/* Peak Anxiety */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-600" />
                    <span>اوج اضطراب</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    نوبت {trajectoryStats.peakAnxietyTurn}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black font-mono text-amber-900">
                    {trajectoryStats.peakAnxiety}٪
                  </span>
                  <span className="text-[10px] text-stone-500">حداکثر تنش</span>
                </div>
              </div>

              {/* Alliance Stability */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-800">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-indigo-600" />
                    <span>پایداری اتحاد</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    {trajectoryStats.allianceStability}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black font-mono text-indigo-900">
                    {trajectoryStats.finalOpenness}٪
                  </span>
                  <span className="text-[10px] text-stone-500">گشودگی پایانی</span>
                </div>
              </div>
            </div>

            {/* Visual Chart Canvas / Recharts */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-stone-500 mb-2 px-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-bold text-rose-700">
                    <span className="w-3 h-1 bg-rose-500 rounded-full inline-block" />
                    <span>اضطراب مراجع (Anxiety)</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-teal-700">
                    <span className="w-3 h-1 bg-teal-500 rounded-full inline-block" />
                    <span>اتحاد درمانی (Alliance / Rapport)</span>
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  محور افقی: تبادلات کلامی جلسه • محور عمودی: شدت شاخص (۰-۱۰۰٪)
                </span>
              </div>

              <div className="w-full h-52 sm:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricPoints} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      stroke="#d6d3d1"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      stroke="#d6d3d1"
                      tickLine={false}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <RechartsTooltip content={<ModalChartTooltip />} />
                    <ReferenceLine
                      y={50}
                      stroke="#cbd5e1"
                      strokeDasharray="4 4"
                      label={{ value: 'میانه بالینی (۵۰٪)', fill: '#94a3b8', fontSize: 9, position: 'insideTopLeft' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="anxiety"
                      stroke="#e11d48"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#be123c' }}
                      name="اضطراب مراجع"
                    />
                    <Line
                      type="monotone"
                      dataKey="rapport"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#0f766e' }}
                      name="اتحاد درمانی"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Supervisory Clinical Interpretation of the Trajectory */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900 block text-xs">تحلیل بالینی سیر نمودار توسط سوپروایزر:</span>
                <p className="text-stone-600 text-xs leading-relaxed text-justify">
                  {trajectoryStats.clinicalInterpretation}
                </p>
              </div>
            </div>
          </div>

          {/* Competency Ratings (CTRS Standards) */}
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-600" />
              <span>ارزیابی مقیاس شایستگی‌های درمان شناختی-رفتاری (CTRS Competencies):</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { label: 'همدلی و درک بالینی (Empathy)', score: report.competencyScores.empathy },
                { label: 'اتحاد و رابطه درمانی (Alliance)', score: report.competencyScores.therapeuticAlliance },
                { label: 'کشف هدایت‌شده و سوالات سقراطی', score: report.competencyScores.guidedDiscovery },
                { label: 'ساختاربندی و مدیریت زمان جلسه', score: report.competencyScores.sessionStructuring },
                { label: 'مدیریت مقاومت و دفاع‌های روانی', score: report.competencyScores.resistanceManagement },
                { label: 'خلوص و تناسب مداخلات بالینی', score: report.competencyScores.interventionsPurity },
              ].map((item, idx) => (
                <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-200/90">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-stone-700 text-xs">{item.label}</span>
                    <span className="font-mono font-bold text-stone-900 text-xs">{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        item.score >= 80 ? 'bg-emerald-500' : item.score >= 65 ? 'bg-teal-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed 11-Item CTRS Rating Scale */}
            {report.ctrsDetailedScores && (
              <div className="mt-3.5 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>تفکیک ۱۱ مهارت تخصصی مقیاس رتبه‌بندی بک (Beck CTRS Itemized):</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">استاندارد بین‌المللی صلاحیت CBT</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
                  {[
                    { name: 'تنظیم دستور جلسه (Agenda)', val: report.ctrsDetailedScores.agendaSetting },
                    { name: 'دریافت بازخورد (Feedback)', val: report.ctrsDetailedScores.feedback },
                    { name: 'درک بالینی (Understanding)', val: report.ctrsDetailedScores.understanding },
                    { name: 'اثربخشی بین‌فردی', val: report.ctrsDetailedScores.interpersonalEffectiveness },
                    { name: 'همکاری درمانی (Collaboration)', val: report.ctrsDetailedScores.collaboration },
                    { name: 'سرعت و ریتم (Pacing)', val: report.ctrsDetailedScores.pacing },
                    { name: 'کشف هدایت‌شده (Guided Discovery)', val: report.ctrsDetailedScores.guidedDiscovery },
                    { name: 'تمرکز بر شناخت‌های کلیدی', val: report.ctrsDetailedScores.focusOnKeyCognitions },
                    { name: 'راهبرد برای تغییر (Strategy)', val: report.ctrsDetailedScores.strategyForChange },
                    { name: 'اجرای فنون (Technique Application)', val: report.ctrsDetailedScores.techniqueApplication },
                    { name: 'طراحی تکلیف خانگی (Homework)', val: report.ctrsDetailedScores.homework },
                  ].map((ctrsItem, cIdx) => (
                    <div key={cIdx} className="bg-white p-2 rounded-lg border border-stone-200/80 flex items-center justify-between">
                      <span className="text-stone-700 font-medium truncate">{ctrsItem.name}</span>
                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        (ctrsItem.val ?? 0) >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        (ctrsItem.val ?? 0) >= 65 ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {ctrsItem.val ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Biopsychosocial & 5P Clinical Formulation */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>فرمولاسیون موردی جامع زیستی-روانی-اجتماعی و مدل 5P:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
                  <span className="font-bold text-rose-900 block mb-1 text-xs">عوامل زیستی (Biological):</span>
                  <p className="text-rose-950 text-xs leading-relaxed">{report.biopsychosocialFormulation.biological}</p>
                </div>

                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1 text-xs">عوامل روانی و شناختی (Psychological):</span>
                  <p className="text-indigo-950 text-xs leading-relaxed">{report.biopsychosocialFormulation.psychological}</p>
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1 text-xs">عوامل اجتماعی و محیطی (Social):</span>
                  <p className="text-emerald-950 text-xs leading-relaxed">{report.biopsychosocialFormulation.social}</p>
                </div>
              </div>
            </div>

            {/* The 5 Ps Case Formulation */}
            {report.fivePsFormulation && (
              <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/90 space-y-2">
                <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>فرمولاسیون موردی پنج‌گانه (The 5 Ps Case Formulation Framework):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-rose-700 block text-[11px]">۱. مشکل کنونی (Presenting)</strong>
                    <p className="text-stone-700 text-[11px] leading-relaxed">{report.fivePsFormulation.presentingProblem}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-amber-700 block text-[11px]">۲. عوامل مستعدکننده (Predisposing)</strong>
                    <p className="text-stone-700 text-[11px] leading-relaxed">{report.fivePsFormulation.predisposingFactors}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-indigo-700 block text-[11px]">۳. عوامل تسریع‌کننده (Precipitating)</strong>
                    <p className="text-stone-700 text-[11px] leading-relaxed">{report.fivePsFormulation.precipitatingFactors}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-purple-700 block text-[11px]">۴. عوامل تداوم‌بخش (Perpetuating)</strong>
                    <p className="text-stone-700 text-[11px] leading-relaxed">{report.fivePsFormulation.perpetuatingFactors}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-emerald-700 block text-[11px]">۵. عوامل محافظت‌کننده (Protective)</strong>
                    <p className="text-stone-700 text-[11px] leading-relaxed">{report.fivePsFormulation.protectiveFactors}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alliance Rupture and Repair Analysis */}
            {report.allianceRuptureRepairAnalysis && (
              <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-200/80 space-y-1">
                <span className="font-bold text-teal-900 text-xs block flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
                  <span>تحلیل سیر گسست و ترمیم اتحاد درمانی (Safran & Muran Alliance Rupture/Repair):</span>
                </span>
                <p className="text-teal-950 text-xs leading-relaxed text-justify">
                  {report.allianceRuptureRepairAnalysis}
                </p>
              </div>
            )}
          </div>

          {/* Key Turning Points */}
          {report.keyTurningPoints && report.keyTurningPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>نقاط عطف و لحظات سرنوشت‌ساز جلسه (Key Turning Points):</span>
              </h4>

              <div className="space-y-2">
                {report.keyTurningPoints.map((tp, idx) => (
                  <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between font-bold text-stone-900 mb-1 text-xs">
                      <span>لحظه: {tp.moment}</span>
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {tp.impact}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{tp.supervisorAnalysis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traps & Missed Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70">
              <h4 className="font-bold text-amber-900 text-xs mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>فرصت‌های از دست رفته و دام‌های بالینی:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {report.trapsAndMissedOpportunities.map((trap, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200/70">
              <h4 className="font-bold text-teal-900 text-xs mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-700" />
                <span>برنامه راهبردی جلسه بعد و تکلیف مراجع:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-teal-950 mb-3">
                {report.recommendationsForNextSession.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              {report.suggestedHomeworkForClient && (
                <div className="bg-white/80 p-2 rounded-lg border border-teal-200 text-xs text-teal-900">
                  <span className="font-bold block mb-0.5">تکلیف خانگی پیشنهادی به مراجع:</span>
                  <span>{report.suggestedHomeworkForClient}</span>
                </div>
              )}
            </div>

          </div>

          {/* Technique Distribution Matrix */}
          {report.techniqueDistribution && report.techniqueDistribution.length > 0 && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>ماتریس توزیع و عیارسنجی فنون درمانی (Technique Distribution Matrix):</span>
              </h4>

              <div className="space-y-2">
                {report.techniqueDistribution.map((tech, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{tech.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-mono">
                          فراوانی: {tech.frequency} بار ({tech.percentage}٪)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500">کیفیت اجرا:</span>
                        <span className="font-mono font-bold text-teal-700 text-xs">{tech.qualityScore}/۱۰</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${tech.percentage}%` }}
                      />
                    </div>

                    {tech.recommendation && (
                      <p className="text-[11px] text-stone-600 leading-relaxed pt-0.5">
                        <strong className="text-teal-800 font-semibold">توصیه ارتقا:</strong> {tech.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Targeted Clinical Skill Improvement Roadmap */}
          {report.skillImprovementRoadmap && report.skillImprovementRoadmap.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/50 via-teal-50/40 to-stone-50 p-4 rounded-2xl border border-indigo-200/70 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Milestone className="w-4 h-4 text-indigo-700" />
                <span>نقشه راه اختصاصی تقویت مهارت‌های بالینی (Clinical Growth Roadmap):</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.skillImprovementRoadmap.map((item, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                      <span className="font-bold text-stone-900 text-xs">{item.skillName}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          اکنون: {item.currentLevel}
                        </span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                          هدف: {item.targetLevel}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-teal-800 block mb-0.5">تمرین بالینی هدفمند:</span>
                      <p className="text-xs text-stone-700 leading-relaxed">{item.targetedExercise}</p>
                    </div>

                    {item.recommendedReading && (
                      <div className="pt-1 border-t border-stone-100 text-[10px] text-stone-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate">منبع مطالعاتی: {item.recommendedReading}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Self-Assessment Calibration */}
          {report.studentSelfAssessmentCalibration && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>کالیبراسیون و انطباق خودارزیابی درمانگر با سوپروایزر:</span>
              </h4>

              <div className="bg-white p-3 rounded-xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-around text-center py-1">
                  <div>
                    <span className="text-[10px] text-stone-400 block mb-0.5">برآورد اولیه شما</span>
                    <span className="text-lg font-bold font-mono text-stone-800">
                      {report.studentSelfAssessmentCalibration.studentSelfRating}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-stone-200" />
                  <div>
                    <span className="text-[10px] text-teal-600 block mb-0.5">نمره ارزیابی سوپروایزر</span>
                    <span className="text-lg font-bold font-mono text-teal-700">
                      {report.studentSelfAssessmentCalibration.supervisorRating}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                  <strong className="text-stone-900 font-bold block mb-0.5">تحلیل بینش و فراشناخت بالینی:</strong>
                  {report.studentSelfAssessmentCalibration.calibrationInsight}
                </p>
              </div>
            </div>
          )}

          {/* Metacognitive Reflection Prompt */}
          {report.metacognitiveReflection && (
            <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/80 space-y-2">
              <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-700" />
                <span>پرسش تأملی خودسنجی (Metacognitive Clinical Reflection):</span>
              </h4>

              <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2">
                <p className="text-xs font-semibold text-teal-950 leading-relaxed">
                  ❓ {report.metacognitiveReflection.promptQuestion}
                </p>

                <textarea
                  rows={2}
                  value={userReflection}
                  onChange={(e) => setUserReflection(e.target.value)}
                  placeholder="تأمل و بازخورد درونی خود را درباره این جلسه و تجربه هیجانی‌تان با مراجع اینجا بنویسید..."
                  className="w-full resize-none bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 print:hidden"
                />

                {userReflection && (
                  <div className="hidden print:block p-2.5 bg-stone-50 rounded-lg border border-stone-300 text-xs text-stone-900">
                    <strong>تأمل و خودسنجی ثبت‌شده کارورز:</strong>
                    <p className="mt-1 leading-relaxed whitespace-pre-wrap">{userReflection}</p>
                  </div>
                )}

                {report.metacognitiveReflection.suggestedTherapistResponse && (
                  <div className="text-[11px] text-stone-500 bg-teal-50/50 p-2 rounded-lg">
                    <span className="font-bold text-teal-800 block mb-0.5">زاویه دید تکمیلی سوپروایزر:</span>
                    <span>{report.metacognitiveReflection.suggestedTherapistResponse}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Therapist's Clinical Notes (if recorded during session) */}
          {clinicalNotes && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-2 print:border-stone-400 print:bg-stone-50">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 print:text-black" />
                <span>یادداشت‌ها و مشاهدات بالینی ثبت‌شده توسط شما در طول جلسه:</span>
              </h4>
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans print:border-stone-300">
                {clinicalNotes}
              </div>
            </div>
          )}

          {/* Academic Export & Submission Panel */}
          <div className="bg-gradient-to-br from-stone-50 to-indigo-50/40 p-4 rounded-2xl border border-stone-200/90 space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>ارسال گزارش به استاد و دریافت نسخه مکتوب / PDF:</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  شامل کارنامه کامل سوپرویژن، مقیاس CTRS، فرمولاسیون بالینی، یادداشت‌های جلسه و تأمل فراشناختی
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAcademicSettings(!showAcademicSettings)}
                className="flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 font-medium self-start sm:self-auto cursor-pointer"
              >
                <span>{showAcademicSettings ? 'بستن مشخصات دانشگاهی' : 'تنظیم نام دانشجو و استاد'}</span>
                {showAcademicSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Optional metadata customization */}
            {showAcademicSettings && (
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-stone-600 mb-1">نام دانشجو / درمانگر:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-stone-800"
                    placeholder="مثال: سارا محمدی"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-stone-600 mb-1">شماره دانشجویی / نظام (اختیاری):</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-stone-800"
                    placeholder="مثال: ۹۹۱۲۰۴۵"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-stone-600 mb-1">نام استاد راهنما / سوپروایزر:</label>
                  <input
                    type="text"
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-stone-800"
                    placeholder="مثال: دکتر علوی"
                  />
                </div>
              </div>
            )}

            {/* Export buttons row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleDownloadVisualPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-700 hover:from-indigo-700 hover:to-teal-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال تولید PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>دانلود گزارش تصویری PDF (با نمودار کامل)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadVisualImage}
                disabled={isGeneratingImage}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-stone-500" />
                )}
                <span>تصویر نمودار (PNG)</span>
              </button>

              <button
                onClick={handleDownloadText}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دریافت فایل متنی گزارش (.TXT)</span>
              </button>

              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs transition-colors cursor-pointer"
              >
                {copyStatus === 'copied' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">متن گزارش کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-500" />
                    <span>کپی متن گزارش (جهت Word یا ایمیل به استاد)</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-500" />
                <span>چاپ رسمی دانشگاهی / خروجی PDF</span>
              </button>
            </div>
          </div>

          {/* Academic Signatures & Verification (Only in print / PDF) */}
          <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-stone-400 text-xs text-stone-900">
            <div className="space-y-6">
              <div><strong>امضا و تاریخ دانشجو / کارورز:</strong></div>
              <div className="text-stone-600 font-mono text-[11px]">{studentName}</div>
              <div className="border-b border-dashed border-stone-400 w-48 pt-6"></div>
            </div>
            <div className="space-y-6">
              <div><strong>امضا، نمره نهایی و تأیید استاد راهنما / سوپروایزر:</strong></div>
              <div className="text-stone-600 font-mono text-[11px]">{professorName}</div>
              <div className="border-b border-dashed border-stone-400 w-48 pt-6"></div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadVisualPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-700 hover:from-indigo-700 hover:to-teal-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="دانلود گزارش جامع تصویری با نمودار کامل اضطراب و رابطه درمانی به صورت فایل PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ایجاد PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>دانلود PDF تصویری</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود (.TXT)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ (PDF)</span>
            </button>

            <button
              onClick={onSaveToPortfolio}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSaved ? 'ذخیره شد ✓' : 'ذخیره در پرونده'}</span>
            </button>

            {onOpenReflectiveJournal && (
              <button
                onClick={onOpenReflectiveJournal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                title="ثبت اندیشه‌ها و احساسات این جلسه در ژورنال رشد فردی"
              >
                <BookOpen className="w-4 h-4" />
                <span>ثبت در ژورنال تأملی</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <span>بازگشت به کتابخانه کیس‌ها</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
