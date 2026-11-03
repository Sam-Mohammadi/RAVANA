import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  HeartHandshake, 
  Activity, 
  Filter, 
  Info, 
  Sparkles,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import type { SavedSession } from '../types';

interface PatientTrajectoryChartProps {
  sessions: SavedSession[];
}

interface ChartPoint {
  id: string;
  sessionIndex: number;
  sessionLabel: string;
  patientName: string;
  caseTitle: string;
  date: string;
  anxiety: number;
  rapport: number;
  openness?: number;
  finalScore?: number;
  isDemo?: boolean;
}

// Exemplary longitudinal clinical trajectory for demonstration if user has few sessions
const DEMO_TRAJECTORY_DATA: ChartPoint[] = [
  {
    id: 'demo-s1',
    sessionIndex: 1,
    sessionLabel: 'جلسه اول',
    patientName: 'سارا کیانی',
    caseTitle: 'اختلال اضطراب فراگیر و پانیک',
    date: '۱۴۰۳/۰۶/۰۱',
    anxiety: 78,
    rapport: 38,
    openness: 35,
    finalScore: 68,
    isDemo: true,
  },
  {
    id: 'demo-s2',
    sessionIndex: 2,
    sessionLabel: 'جلسه دوم',
    patientName: 'سارا کیانی',
    caseTitle: 'اختلال اضطراب فراگیر و پانیک',
    date: '۱۴۰۳/۰۶/۰۸',
    anxiety: 70,
    rapport: 52,
    openness: 48,
    finalScore: 74,
    isDemo: true,
  },
  {
    id: 'demo-s3',
    sessionIndex: 3,
    sessionLabel: 'جلسه سوم',
    patientName: 'سارا کیانی',
    caseTitle: 'اختلال اضطراب فراگیر و پانیک',
    date: '۱۴۰۳/۰۶/۱۵',
    anxiety: 58,
    rapport: 67,
    openness: 62,
    finalScore: 82,
    isDemo: true,
  },
  {
    id: 'demo-s4',
    sessionIndex: 4,
    sessionLabel: 'جلسه چهارم',
    patientName: 'سارا کیانی',
    caseTitle: 'اختلال اضطراب فراگیر و پانیک',
    date: '۱۴۰۳/۰۶/۲۲',
    anxiety: 44,
    rapport: 79,
    openness: 75,
    finalScore: 88,
    isDemo: true,
  },
  {
    id: 'demo-s5',
    sessionIndex: 5,
    sessionLabel: 'جلسه پنجم',
    patientName: 'سارا کیانی',
    caseTitle: 'اختلال اضطراب فراگیر و پانیک',
    date: '۱۴۰۳/۰۶/۲۹',
    anxiety: 32,
    rapport: 88,
    openness: 84,
    finalScore: 92,
    isDemo: true,
  },
];

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: ChartPoint = payload[0].payload;
    return (
      <div className="bg-stone-900/95 backdrop-blur-xs text-white p-3.5 rounded-2xl shadow-xl border border-stone-700 text-xs font-sans max-w-xs space-y-2 dir-rtl">
        <div className="border-b border-stone-800 pb-1.5 flex items-center justify-between gap-3">
          <div className="font-bold text-stone-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
            <span>{data.sessionLabel}</span>
            <span className="text-[10px] text-stone-400 font-normal">({data.patientName})</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">{data.date}</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>سطح اضطراب:</span>
            </span>
            <span className="font-mono font-bold text-rose-200">{data.anxiety}٪</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-teal-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              <span>رابطه درمانی (Rapport):</span>
            </span>
            <span className="font-mono font-bold text-teal-200">{data.rapport}٪</span>
          </div>

          {data.finalScore !== undefined && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-stone-800/80 text-[11px] text-stone-300">
              <span>نمره صلاحیت درمانگر (CTRS):</span>
              <span className="font-mono font-bold text-amber-300">{data.finalScore}/۱۰۰</span>
            </div>
          )}
        </div>

        {data.isDemo && (
          <div className="text-[9px] text-amber-400/90 pt-1 border-t border-stone-800 italic">
            * داده‌های استاندارد کارآموزی (سیر بالینی پروتکل ۵ جلسه‌ای)
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PatientTrajectoryChart: React.FC<PatientTrajectoryChartProps> = ({ sessions }) => {
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('all');
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(sessions.length < 2);

  // Extract unique patient names from saved sessions
  const availablePatients = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.patientName) set.add(s.patientName);
    });
    return Array.from(set);
  }, [sessions]);

  // Transform sessions into chart data points
  const rawChartData = useMemo<ChartPoint[]>(() => {
    if (useDemoFallback && sessions.length < 2) {
      return DEMO_TRAJECTORY_DATA;
    }

    // Sort sessions chronologically (oldest to newest)
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Apply patient filter if specific patient chosen
    const filtered = selectedPatientFilter === 'all'
      ? sorted
      : sorted.filter(s => s.patientName === selectedPatientFilter);

    if (filtered.length === 0 && sorted.length > 0) {
      return [];
    }

    return filtered.map((session, index) => {
      // Find anxiety & rapport from session messages or fallbacks
      let anxiety = 65;
      let rapport = 45;
      let openness = 40;

      // Extract from the last message with stateSnapshot
      if (session.messages && session.messages.length > 0) {
        const snapshots = session.messages
          .filter(m => m.stateSnapshot)
          .map(m => m.stateSnapshot!);
        
        if (snapshots.length > 0) {
          const lastSnapshot = snapshots[snapshots.length - 1];
          anxiety = lastSnapshot.anxiety;
          rapport = lastSnapshot.rapport;
          openness = lastSnapshot.openness;
        } else if (session.finalScore) {
          // Empirical derivation from final score
          anxiety = Math.max(20, Math.min(90, 85 - Math.round(session.finalScore * 0.45)));
          rapport = Math.max(25, Math.min(95, 30 + Math.round(session.finalScore * 0.55)));
        }
      }

      let dateFormatted = 'نامشخص';
      try {
        dateFormatted = new Date(session.createdAt).toLocaleDateString('fa-IR');
      } catch {
        dateFormatted = session.createdAt?.slice(0, 10) || '';
      }

      return {
        id: session.id,
        sessionIndex: index + 1,
        sessionLabel: `جلسه ${index + 1}`,
        patientName: session.patientName || 'مراجع',
        caseTitle: session.caseTitle || '',
        date: dateFormatted,
        anxiety,
        rapport,
        openness,
        finalScore: session.finalScore,
        isDemo: false,
      };
    });
  }, [sessions, selectedPatientFilter, useDemoFallback]);

  // Trajectory Analytics (Delta changes)
  const stats = useMemo(() => {
    if (rawChartData.length < 2) {
      return {
        anxietyDelta: 0,
        rapportDelta: 0,
        startAnxiety: rawChartData[0]?.anxiety ?? 0,
        currentAnxiety: rawChartData[0]?.anxiety ?? 0,
        startRapport: rawChartData[0]?.rapport ?? 0,
        currentRapport: rawChartData[0]?.rapport ?? 0,
      };
    }

    const first = rawChartData[0];
    const last = rawChartData[rawChartData.length - 1];

    return {
      anxietyDelta: last.anxiety - first.anxiety,
      rapportDelta: last.rapport - first.rapport,
      startAnxiety: first.anxiety,
      currentAnxiety: last.anxiety,
      startRapport: first.rapport,
      currentRapport: last.rapport,
    };
  }, [rawChartData]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden mb-8">
      
      {/* Header Bar */}
      <div className="p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              <span>سیر بالینی اضطراب و رابطه درمانی (Rapport) در طول جلسات</span>
              {rawChartData[0]?.isDemo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  نمونه آموزشی
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            نمودار خطی تغییرات پیوسته وضعیت روانی مراجع و همبستگی آن با تعمیق اتحاد درمانی
          </p>
        </div>

        {/* Filter and Mode Toggles */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-center">
          
          {/* Patient Selector Filter */}
          {availablePatients.length > 1 && !useDemoFallback && (
            <div className="relative">
              <select
                id="select-chart-patient-filter"
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer pl-7 appearance-none"
              >
                <option value="all">همه بیماران ({sessions.length} جلسه)</option>
                {availablePatients.map((name) => (
                  <option key={name} value={name}>مراجع: {name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Toggle Demo vs Real if user has < 2 sessions */}
          {sessions.length < 2 && (
            <button
              id="btn-toggle-demo-trajectory"
              onClick={() => setUseDemoFallback(!useDemoFallback)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 shadow-2xs ${
                useDemoFallback
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{useDemoFallback ? 'داده‌های نمونه ۵ جلسه‌ای' : 'داده‌های جلسات واقعی شما'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Chart Section */}
      <div className="p-5">
        {rawChartData.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            برای این مراجع هنوز داده‌ای ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Recharts Container */}
            <div className="w-full h-72 sm:h-80" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rawChartData}
                  margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e7e5e4" 
                    vertical={false} 
                  />
                  <XAxis 
                    dataKey="sessionLabel" 
                    stroke="#78716c"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#78716c"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
                    tickFormatter={(val) => `${val}٪`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    formatter={(value) => {
                      if (value === 'anxiety') return <span style={{ color: '#e11d48', fontWeight: 600 }}>سطح اضطراب مراجع (Anxiety)</span>;
                      if (value === 'rapport') return <span style={{ color: '#0d9488', fontWeight: 600 }}>رابطه درمانی و اتحاد کاری (Rapport)</span>;
                      return value;
                    }}
                  />
                  
                  {/* Anxiety Line (Rose) */}
                  <Line 
                    type="monotone" 
                    dataKey="anxiety" 
                    name="anxiety"
                    stroke="#e11d48" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#fda4af', strokeWidth: 3 }}
                    animationDuration={1000}
                  />

                  {/* Rapport Line (Teal) */}
                  <Line 
                    type="monotone" 
                    dataKey="rapport" 
                    name="rapport"
                    stroke="#0d9488" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#99f6e4', strokeWidth: 3 }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Longitudinal Indicators Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
              
              {/* Anxiety Shift Card */}
              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-rose-800 font-medium block mb-0.5">تغییر تجمعی سطح اضطراب:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold font-mono text-rose-900">
                      {stats.anxietyDelta > 0 ? `+${stats.anxietyDelta}` : stats.anxietyDelta}٪
                    </span>
                    <span className="text-[11px] text-rose-700">
                      ({stats.startAnxiety}٪ به {stats.currentAnxiety}٪)
                    </span>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stats.anxietyDelta <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              {/* Rapport Shift Card */}
              <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-teal-800 font-medium block mb-0.5">تغییر تجمعی رابطه درمانی:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold font-mono text-teal-900">
                      {stats.rapportDelta > 0 ? `+${stats.rapportDelta}` : stats.rapportDelta}٪
                    </span>
                    <span className="text-[11px] text-teal-700">
                      ({stats.startRapport}٪ به {stats.currentRapport}٪)
                    </span>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stats.rapportDelta >= 0 ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              {/* Clinical Insight / Therapeutic Alliance Ratio */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-600 font-medium block mb-0.5">وضعیت سیر بالینی مراجع:</span>
                  <div className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    {stats.anxietyDelta < 0 && stats.rapportDelta > 0 ? (
                      <span className="text-emerald-700">اثربخشی عالی (کاهش اضطراب + تحکیم اعتماد)</span>
                    ) : stats.rapportDelta > 0 ? (
                      <span className="text-teal-700">شکل‌گیری موفق پیوند درمانی</span>
                    ) : (
                      <span className="text-amber-700">نیازمند بازنگری در مدیریت مقاومت</span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-stone-200/70 text-stone-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-stone-600" />
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
