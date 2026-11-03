import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Minus,
  Maximize2,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  FileDown,
  Loader2,
} from 'lucide-react';
import type { SimulationMessage, ClientState, ClinicalCase } from '../types';
import { downloadVisualPdfReport } from '../utils/sessionPdfReport';

export interface LiveSessionMetricsChartProps {
  messages: SimulationMessage[];
  clientState: ClientState;
  currentCase: ClinicalCase;
  sessionDuration?: number;
  height?: number;
  className?: string;
  onExpandModal?: () => void;
  showControls?: boolean;
}

export interface SessionMetricPoint {
  turnIndex: number;
  label: string;
  timestamp: string;
  anxiety: number;
  rapport: number;
  openness: number;
  resistance: number;
  therapistTechnique?: string;
  patientExcerpt?: string;
  isLatest?: boolean;
}

// Custom Persian Tooltip for the in-session real-time chart
const CustomSessionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: SessionMetricPoint = payload[0].payload;
    return (
      <div 
        dir="rtl"
        className="bg-stone-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-stone-700/80 text-xs font-sans max-w-[220px] sm:max-w-[250px] space-y-2 select-none z-50 pointer-events-none"
      >
        <div className="border-b border-stone-700/70 pb-1.5 flex items-center justify-between gap-2">
          <div className="font-bold text-stone-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>{data.label}</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {data.timestamp}
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>اضطراب مراجع:</span>
            </span>
            <span className="font-mono font-extrabold text-rose-200">{data.anxiety}٪</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-teal-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              <span>رابطه درمانی (Rapport):</span>
            </span>
            <span className="font-mono font-extrabold text-teal-200">{data.rapport}٪</span>
          </div>

          {data.therapistTechnique && (
            <div className="pt-1 border-t border-stone-800 text-[10px] text-stone-300 truncate">
              <span className="text-stone-400">تکنیک پیشین: </span>
              <span className="text-indigo-300 font-semibold">{data.therapistTechnique}</span>
            </div>
          )}

          {data.patientExcerpt && (
            <div className="pt-1 border-t border-stone-800 text-[10px] text-stone-300 italic line-clamp-2">
              «{data.patientExcerpt}»
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const LiveSessionMetricsChart: React.FC<LiveSessionMetricsChartProps> = ({
  messages,
  clientState,
  currentCase,
  sessionDuration = 60,
  height = 190,
  className = '',
  onExpandModal,
  showControls = true,
}) => {
  const [showAnxiety, setShowAnxiety] = useState(true);
  const [showRapport, setShowRapport] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadVisualPdfReport({
        currentCase,
        messages,
        sessionDuration,
      });
    } catch (err) {
      console.error('Failed to generate visual PDF report:', err);
      alert('خطا در تولید فایل PDF گزارش تصویری.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Compile real-time trajectory data points from messages history + current state
  const chartPoints: SessionMetricPoint[] = useMemo(() => {
    const points: SessionMetricPoint[] = [];
    const initialAnxiety = currentCase.initialAnxiety ?? 70;
    const initialRapport = currentCase.initialRapport ?? 30;

    // 1. Initial baseline point (Turn 0)
    const firstMsg = messages[0];
    points.push({
      turnIndex: 0,
      label: 'شروع',
      timestamp: firstMsg?.timestamp || '۰۰:۰۰',
      anxiety: firstMsg?.stateSnapshot?.anxiety ?? initialAnxiety,
      rapport: firstMsg?.stateSnapshot?.rapport ?? initialRapport,
      openness: firstMsg?.stateSnapshot?.openness ?? 40,
      resistance: firstMsg?.stateSnapshot?.resistance ?? 50,
      patientExcerpt: firstMsg ? (firstMsg.content.slice(0, 40) + (firstMsg.content.length > 40 ? '...' : '')) : 'آغاز ارزیابی بالینی',
      therapistTechnique: undefined,
    });

    // 2. Track patient messages after the initial greeting
    let turnCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'patient') {
        turnCount++;
        // Find preceding therapist utterance
        const precedingTherapistMsg = messages.slice(0, i).reverse().find(m => m.role === 'therapist');

        const prevPoint = points[points.length - 1];
        points.push({
          turnIndex: turnCount,
          label: `نوبت ${turnCount}`,
          timestamp: msg.timestamp || `۰${turnCount}:۰۰`,
          anxiety: msg.stateSnapshot?.anxiety ?? prevPoint.anxiety,
          rapport: msg.stateSnapshot?.rapport ?? prevPoint.rapport,
          openness: msg.stateSnapshot?.openness ?? prevPoint.openness,
          resistance: msg.stateSnapshot?.resistance ?? prevPoint.resistance,
          patientExcerpt: msg.content ? (msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')) : '',
          therapistTechnique: precedingTherapistMsg?.supervisorFeedback?.techniqueUsed,
        });
      }
    }

    // 3. Ensure the final point always matches live clientState if state has changed dynamically
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.anxiety !== clientState.anxiety || lastPoint.rapport !== clientState.rapport) {
        lastPoint.anxiety = clientState.anxiety;
        lastPoint.rapport = clientState.rapport;
        lastPoint.openness = clientState.openness;
        lastPoint.resistance = clientState.resistance;
      }
      lastPoint.isLatest = true;
    }

    return points;
  }, [messages, clientState, currentCase]);

  // Statistical calculations (deltas, minimums, maximums)
  const stats = useMemo(() => {
    if (chartPoints.length === 0) {
      return {
        anxietyDelta: 0,
        rapportDelta: 0,
        startAnxiety: clientState.anxiety,
        currentAnxiety: clientState.anxiety,
        startRapport: clientState.rapport,
        currentRapport: clientState.rapport,
        peakAnxiety: clientState.anxiety,
        lowestAnxiety: clientState.anxiety,
      };
    }

    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const anxietyVals = chartPoints.map(p => p.anxiety);

    return {
      anxietyDelta: last.anxiety - first.anxiety,
      rapportDelta: last.rapport - first.rapport,
      startAnxiety: first.anxiety,
      currentAnxiety: last.anxiety,
      startRapport: first.rapport,
      currentRapport: last.rapport,
      peakAnxiety: Math.max(...anxietyVals),
      lowestAnxiety: Math.min(...anxietyVals),
    };
  }, [chartPoints, clientState]);

  // Clinical interpretation text based on dynamic trajectory
  const clinicalInterpretation = useMemo(() => {
    const { anxietyDelta, rapportDelta, currentAnxiety, currentRapport } = stats;
    
    if (chartPoints.length <= 1) {
      return 'در انتظار پیشبرد دیالوگ؛ نقطه شروع ارزیابی ثبت شده است.';
    }

    if (anxietyDelta <= -15 && rapportDelta >= 15) {
      return 'سیر بسیار مطلوب: کاهش معنادار اضطراب همراه با تعمیق چشمگیر پیوند درمانی.';
    }
    if (anxietyDelta < 0 && rapportDelta > 0) {
      return 'جهت‌گیری مثبت: مداخلات درمانگر منجر به آرامش مراجع و اعتماد بیشتر شده است.';
    }
    if (anxietyDelta > 15 && rapportDelta < 0) {
      return 'هشدار بالینی: افزایش تنش و گسست در رابطه؛ نیاز به اعتبارسنجی هیجانی و همدلی عمیق‌تر.';
    }
    if (anxietyDelta > 10) {
      return 'برانگیختگی هیجانی فعال؛ بررسی فعال شدن طرحواره یا مواجهه با موضوع حساس.';
    }
    if (rapportDelta > 15) {
      return 'پیوند درمانی مستحکم؛ آمادگی مراجع برای ورود به لایه‌های تعارض عمیق‌تر.';
    }
    if (currentAnxiety > 75) {
      return 'اضطراب بیمار در محدوده حاد است؛ تکنیک‌های بازگشت به زمین (Grounding) توصیه می‌شود.';
    }
    return 'تعادل پایدار میان سطح اضطراب و پذیرش رابطه درمانی در جریان است.';
  }, [stats, chartPoints.length]);

  return (
    <div
      id="live-session-metrics-chart-container"
      role="region"
      aria-label="نمودار لحظه‌ای تغییرات اضطراب و رابطه درمانی در طول جلسه"
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col overflow-hidden select-none ${className}`}
    >
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-stone-50 via-teal-50/20 to-stone-50 border-b border-stone-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-teal-100/80 text-teal-700 border border-teal-200/80 shrink-0">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
              <span>روند لحظه‌ای جلسه</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>زنده</span>
              </span>
            </h4>
            <p className="text-[10px] text-stone-500 truncate">
              تغییرات اضطراب و اتحاد درمانی ({chartPoints.length} مقطع ثبت‌شده)
            </p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            title="دانلود گزارش تصویری PDF روند جلسه (اضطراب و رابطه درمانی)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
            ) : (
              <FileDown className="w-3 h-3 text-indigo-600" />
            )}
            <span className="hidden sm:inline">گزارش PDF</span>
          </button>

          {onExpandModal && (
            <button
              type="button"
              onClick={onExpandModal}
              title="مشاهده نمودار در نمای بزرگ"
              className="p-1 rounded-lg hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Indicator Score Pills */}
      <div className="px-3 pt-2.5 pb-1 grid grid-cols-2 gap-2">
        {/* Current Anxiety Stat */}
        <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-rose-800 block truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>اضطراب مراجع</span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-black font-mono text-rose-900">
                {stats.currentAnxiety}٪
              </span>
              <span className="text-[9px] text-stone-400 font-mono">
                (شروع: {stats.startAnxiety}٪)
              </span>
            </div>
          </div>
          <div className="text-left shrink-0">
            {stats.anxietyDelta !== 0 ? (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold border ${
                  stats.anxietyDelta < 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
                title={`تغییر اضطراب: ${stats.anxietyDelta > 0 ? `+${stats.anxietyDelta}` : stats.anxietyDelta}٪`}
              >
                {stats.anxietyDelta < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{stats.anxietyDelta > 0 ? `+${stats.anxietyDelta}` : stats.anxietyDelta}٪</span>
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5">
                <Minus className="w-3 h-3" />
                <span>بدون تغییر</span>
              </span>
            )}
          </div>
        </div>

        {/* Current Rapport Stat */}
        <div className="p-2 rounded-xl bg-teal-50/70 border border-teal-200/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-teal-800 block truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
              <span>رابطه درمانی (Rapport)</span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-black font-mono text-teal-900">
                {stats.currentRapport}٪
              </span>
              <span className="text-[9px] text-stone-400 font-mono">
                (شروع: {stats.startRapport}٪)
              </span>
            </div>
          </div>
          <div className="text-left shrink-0">
            {stats.rapportDelta !== 0 ? (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold border ${
                  stats.rapportDelta > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
                title={`تغییر رابطه درمانی: ${stats.rapportDelta > 0 ? `+${stats.rapportDelta}` : stats.rapportDelta}٪`}
              >
                {stats.rapportDelta > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{stats.rapportDelta > 0 ? `+${stats.rapportDelta}` : stats.rapportDelta}٪</span>
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5">
                <Minus className="w-3 h-3" />
                <span>بدون تغییر</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Line Visibility Controls */}
      {showControls && (
        <div className="px-3 pt-1 pb-1 flex items-center justify-between text-[10px] text-stone-500">
          <div className="flex items-center gap-2">
            {/* Anxiety Toggle */}
            <button
              type="button"
              onClick={() => setShowAnxiety(!showAnxiety)}
              className={`px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer font-medium ${
                showAnxiety
                  ? 'bg-rose-100/80 border-rose-300 text-rose-800 font-bold'
                  : 'bg-stone-100 border-stone-200 text-stone-400 opacity-60'
              }`}
              title="نمایش / عدم‌نمایش خط اضطراب"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>اضطراب</span>
            </button>

            {/* Rapport Toggle */}
            <button
              type="button"
              onClick={() => setShowRapport(!showRapport)}
              className={`px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer font-medium ${
                showRapport
                  ? 'bg-teal-100/80 border-teal-300 text-teal-800 font-bold'
                  : 'bg-stone-100 border-stone-200 text-stone-400 opacity-60'
              }`}
              title="نمایش / عدم‌نمایش خط رابطه درمانی"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>رابطه درمانی</span>
            </button>
          </div>

          <span className="text-[9px] text-stone-400 font-mono">
            مقیاس: ۰ تا ۱۰۰٪
          </span>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="px-2 pt-1 pb-2">
        <div 
          className="w-full relative rounded-xl bg-stone-50/40 p-1 border border-stone-100" 
          style={{ height: `${height}px` }} 
          dir="ltr"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartPoints}
              margin={{ top: 12, right: 14, left: -22, bottom: 2 }}
            >
              <CartesianGrid 
                strokeDasharray="2 3" 
                stroke="#e7e5e4" 
                vertical={false} 
              />
              
              <ReferenceLine 
                y={50} 
                stroke="#d6d3d1" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'نقطه تعادل (۵۰٪)', 
                  fill: '#a8a29e', 
                  fontSize: 8, 
                  position: 'insideBottomRight' 
                }} 
              />

              <XAxis 
                dataKey="label" 
                stroke="#a8a29e"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
                dy={3}
              />

              <YAxis 
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#a8a29e"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
                tickFormatter={(val) => `${val}٪`}
              />

              <Tooltip 
                content={<CustomSessionTooltip />} 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '2 2' }}
              />

              {/* Anxiety Line (Rose) */}
              {showAnxiety && (
                <Line 
                  type="monotone" 
                  dataKey="anxiety" 
                  name="anxiety"
                  stroke="#e11d48" 
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#e11d48', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5.5, stroke: '#fca5a5', strokeWidth: 2, fill: '#e11d48' }}
                  animationDuration={600}
                  isAnimationActive={true}
                />
              )}

              {/* Rapport Line (Teal) */}
              {showRapport && (
                <Line 
                  type="monotone" 
                  dataKey="rapport" 
                  name="rapport"
                  stroke="#0d9488" 
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#0d9488', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5.5, stroke: '#99f6e4', strokeWidth: 2, fill: '#0d9488' }}
                  animationDuration={700}
                  isAnimationActive={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Supervisory Interpretation Banner */}
      <div className="px-3 py-2 bg-stone-50 border-t border-stone-200/80 text-[10px] text-stone-700 flex items-start gap-1.5 leading-relaxed">
        <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <span className="font-medium">{clinicalInterpretation}</span>
      </div>
    </div>
  );
};
