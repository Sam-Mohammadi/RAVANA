import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Heart, 
  Unlock, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Brain, 
  Info,
  SlidersHorizontal,
  Flame,
  Lightbulb,
  Maximize2,
  Minimize2,
  UserCheck,
  LineChart as LineChartIcon,
  Layers,
  X
} from 'lucide-react';
import type { ClientState, ClinicalCase, SimulationMessage } from '../types';
import { LiveSessionMetricsChart } from './LiveSessionMetricsChart';

export interface PatientStateProgressCardProps {
  clientState: ClientState;
  currentCase: ClinicalCase;
  messages?: SimulationMessage[];
  lastPatientMessageTime?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const PatientStateProgressCard: React.FC<PatientStateProgressCardProps> = ({
  clientState,
  currentCase,
  messages = [],
  lastPatientMessageTime,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  className = '',
}) => {
  // View mode: 'combined' (chart + compact gauges), 'chart' (focused real-time trend chart), or 'bars' (detailed bars)
  const [viewMode, setViewMode] = useState<'combined' | 'chart' | 'bars'>(() => {
    try {
      const saved = localStorage.getItem('psychosim_state_card_view_mode');
      if (saved === 'chart' || saved === 'bars' || saved === 'combined') return saved;
    } catch {
      // ignore
    }
    return 'combined';
  });

  const [showChartModal, setShowChartModal] = useState(false);

  const handleSelectViewMode = (mode: 'combined' | 'chart' | 'bars') => {
    setViewMode(mode);
    try {
      localStorage.setItem('psychosim_state_card_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Internal collapse state if not controlled externally
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('psychosim_state_card_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('psychosim_state_card_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  // Track previous client state to show real-time delta indicators
  const prevStateRef = useRef<ClientState>(clientState);
  const [deltas, setDeltas] = useState<{
    openness: number;
    resistance: number;
    anxiety: number;
    rapport: number;
  }>({ openness: 0, resistance: 0, anxiety: 0, rapport: 0 });

  useEffect(() => {
    const prev = prevStateRef.current;
    if (
      prev.openness !== clientState.openness ||
      prev.resistance !== clientState.resistance ||
      prev.anxiety !== clientState.anxiety ||
      prev.rapport !== clientState.rapport
    ) {
      setDeltas({
        openness: clientState.openness - prev.openness,
        resistance: clientState.resistance - prev.resistance,
        anxiety: clientState.anxiety - prev.anxiety,
        rapport: clientState.rapport - prev.rapport,
      });
      prevStateRef.current = clientState;
    }
  }, [clientState]);

  // Openness level descriptor
  const getOpennessLabel = (val: number) => {
    if (val < 25) return { text: 'بسته و محتاط', color: 'text-stone-600', badgeBg: 'bg-stone-100 text-stone-700' };
    if (val < 50) return { text: 'محافظت‌شده', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-800' };
    if (val < 75) return { text: 'پذیرا و همکار', color: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-800' };
    return { text: 'کاملاً باز و شفاف', color: 'text-teal-700', badgeBg: 'bg-teal-100 text-teal-800' };
  };

  // Resistance level descriptor
  const getResistanceLabel = (val: number) => {
    if (val < 25) return { text: 'مقاومت ناچیز', color: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-800' };
    if (val < 50) return { text: 'مقاومت خفیف', color: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-800' };
    if (val < 75) return { text: 'مقاومت فعال و دفاعی', color: 'text-rose-700', badgeBg: 'bg-rose-100 text-rose-800' };
    return { text: 'مقاومت شدید و انسداد', color: 'text-rose-900', badgeBg: 'bg-rose-200 text-rose-900' };
  };

  // Anxiety level descriptor
  const getAnxietyLabel = (val: number) => {
    if (val < 30) return { text: 'آرام و مسلط', color: 'text-emerald-700' };
    if (val < 60) return { text: 'برانگیختگی خفیف', color: 'text-amber-700' };
    if (val < 80) return { text: 'اضطراب مشهود', color: 'text-rose-600' };
    return { text: 'بحرانی / پنیک', color: 'text-rose-700 font-bold' };
  };

  // Alliance level descriptor
  const getRapportLabel = (val: number) => {
    if (val < 35) return { text: 'شکننده', color: 'text-stone-600' };
    if (val < 65) return { text: 'در حال رشد', color: 'text-teal-700' };
    return { text: 'مطلوب و عمیق', color: 'text-emerald-700 font-bold' };
  };

  const opennessInfo = getOpennessLabel(clientState.openness);
  const resistanceInfo = getResistanceLabel(clientState.resistance);
  const anxietyInfo = getAnxietyLabel(clientState.anxiety);
  const rapportInfo = getRapportLabel(clientState.rapport);

  // Micro Clinical Advice based on moment-to-moment interplay
  const getSupervisionHint = () => {
    if (clientState.resistance > 65) {
      return 'مقاومت بالاست؛ از به چالش کشیدن شتابزده پرهیز کنید و بر همدلی با ترس مراجع تمرکز کنید.';
    }
    if (clientState.openness > 65 && clientState.rapport > 60) {
      return 'بستر عالی برای ورود به هیجانات عمیق و طرحواره‌های بنیادین فراهم است.';
    }
    if (clientState.anxiety > 75) {
      return 'اضطراب بیمار بالاست؛ با فنون بازگشت به زمین (Grounding) سرعت جلسه را تعدیل کنید.';
    }
    return 'تعادل نسبی برقرار است؛ پاسخ‌های بازتابی و اعتبارسنجی را ادامه دهید.';
  };

  // Render Delta Pill
  const renderDelta = (delta: number, invertedGood = false) => {
    if (delta === 0) return null;
    const isPositiveChange = invertedGood ? delta < 0 : delta > 0;
    const Icon = delta > 0 ? TrendingUp : TrendingDown;
    const colorClass = isPositiveChange 
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
      : 'text-rose-700 bg-rose-50 border-rose-200';
    
    return (
      <span 
        title={`تغییر در این دور گفتگو: ${delta > 0 ? `+${delta}%` : `${delta}%`}`}
        className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${colorClass} animate-pulse`}
      >
        <Icon className="w-2.5 h-2.5 shrink-0" />
        <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
      </span>
    );
  };

  // COLLAPSED MINI-VIEW (Sleek vertical strip beside dialogue)
  if (isCollapsed) {
    return (
      <div
        id="patient-state-card-collapsed"
        className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-2 flex flex-col items-center justify-between gap-3 w-12 sm:w-13 shrink-0 select-none transition-all duration-300 hover:border-indigo-300 ${className}`}
      >
        {/* Top Expand Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          title="گسترش کارت وضعیت لحظه‌ای بیمار"
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180 sm:rotate-0" />
        </button>

        {/* Vertical Title & Live Pulse */}
        <div className="flex flex-col items-center gap-1 my-1">
          <div className="relative">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-stone-700 [writing-mode:vertical-rl] tracking-wider py-1">
            وضعیت بیمار
          </span>
        </div>

        {/* Mini Vertical Progress Indicators */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Mini Openness Bar */}
          <div 
            title={`میزان باز بودن: ${clientState.openness}% (${opennessInfo.text})`}
            className="flex flex-col items-center gap-1 w-full cursor-help"
          >
            <Unlock className="w-3 h-3 text-emerald-600" />
            <div className="w-2 h-9 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70 p-0.2 flex flex-col justify-end">
              <div 
                className="w-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ height: `${clientState.openness}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-emerald-700">{clientState.openness}%</span>
          </div>

          {/* Mini Resistance Bar */}
          <div 
            title={`مقاومت در برابر درمان: ${clientState.resistance}% (${resistanceInfo.text})`}
            className="flex flex-col items-center gap-1 w-full cursor-help"
          >
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            <div className="w-2 h-9 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70 p-0.2 flex flex-col justify-end">
              <div 
                className="w-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ height: `${clientState.resistance}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-rose-600">{clientState.resistance}%</span>
          </div>

          {/* Mini Anxiety Bar */}
          <div 
            title={`اضطراب: ${clientState.anxiety}%`}
            className="flex flex-col items-center gap-1 w-full cursor-help"
          >
            <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <div className="w-2 h-9 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70 p-0.2 flex flex-col justify-end">
              <div 
                className="w-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ height: `${clientState.anxiety}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-rose-600">{clientState.anxiety}%</span>
          </div>

          {/* Mini Rapport Indicator */}
          <div 
            title={`رابطه درمانی: ${clientState.rapport}%`}
            className="flex flex-col items-center gap-1 w-full cursor-help"
          >
            <Heart className="w-3.5 h-3.5 text-teal-600" />
            <div className="w-2 h-9 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70 p-0.2 flex flex-col justify-end">
              <div 
                className="w-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ height: `${clientState.rapport}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-teal-700">{clientState.rapport}%</span>
          </div>
        </div>

        {/* Bottom Expand Toggle */}
        <button
          type="button"
          onClick={toggleCollapse}
          title="گسترش نمودار و وضعیت لحظه‌ای مراجع"
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // EXPANDED FULL CARD VIEW
  return (
    <>
      <div
        id="patient-state-card-expanded"
        role="region"
        aria-label="کارت وضعیت روان‌شناختی لحظه‌ای بیمار و نمودار پایش جلسه"
        className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col overflow-hidden w-72 sm:w-80 lg:w-84 xl:w-92 shrink-0 transition-all duration-300 select-none ${className}`}
      >
        {/* Card Top Header */}
        <div className="p-3 bg-gradient-to-r from-stone-50 via-teal-50/25 to-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative p-1.5 rounded-xl bg-teal-100/70 text-teal-700 border border-teal-200/80 shrink-0">
              <Brain className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                <span>پایش وضعیت مراجع</span>
              </h3>
              <p className="text-[10px] text-stone-500 truncate">
                {currentCase.patientName} • {currentCase.title}
              </p>
            </div>
          </div>

          {/* Action buttons: expand modal & collapse */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowChartModal(true)}
              title="مشاهده نمودار بزرگ در پنجره مجزا"
              className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapse}
              title="جمع کردن کارت برای افزایش فضای چت"
              className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="px-2.5 py-1.5 bg-stone-50/90 border-b border-stone-200/70 flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleSelectViewMode('chart')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
            title="نمایش متمرکز نمودار خطی روند اضطراب و رابطه درمانی"
          >
            <LineChartIcon className="w-3 h-3" />
            <span>نمودار زنده</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectViewMode('combined')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
            title="نمایش همزمان نمودار و شاخص‌های روان‌شناختی"
          >
            <Layers className="w-3 h-3" />
            <span>ترکیبی</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectViewMode('bars')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'bars'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
            title="نمایش شاخص‌های تفکیکی گشودگی، مقاومت و اضطراب"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>شاخص‌ها</span>
          </button>
        </div>

        {/* Main Body with Dynamic Views */}
        <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
          
          {/* VIEW MODE 1: CHART FOCUSED VIEW */}
          {viewMode === 'chart' && (
            <div className="space-y-2">
              <LiveSessionMetricsChart
                messages={messages}
                clientState={clientState}
                currentCase={currentCase}
                height={220}
                onExpandModal={() => setShowChartModal(true)}
              />

              {/* Active Defense Mechanism Badge */}
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>مکانیسم دفاعی فعال:</span>
                  </span>
                </div>
                <div className="text-[11px] font-medium text-stone-800 bg-white/90 px-2 py-1 rounded-lg border border-amber-200/60 truncate" title={clientState.currentDefense || currentCase.defenseMechanisms[0]}>
                  {clientState.currentDefense || currentCase.defenseMechanisms[0]}
                </div>
              </div>

              {/* Live Supervisory Tip Box */}
              <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-[10px] text-indigo-950 flex items-start gap-1.5 leading-relaxed">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{getSupervisionHint()}</span>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: COMBINED VIEW (Chart at Top + Compact Indicators Below) */}
          {viewMode === 'combined' && (
            <div className="space-y-2.5">
              <LiveSessionMetricsChart
                messages={messages}
                clientState={clientState}
                currentCase={currentCase}
                height={165}
                onExpandModal={() => setShowChartModal(true)}
              />

              {/* Compact Indicators Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Openness */}
                <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>گشودگی</span>
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700">
                      {clientState.openness}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${clientState.openness}%` }}
                    />
                  </div>
                </div>

                {/* 2. Resistance */}
                <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>مقاومت</span>
                    </span>
                    <span className="font-mono font-extrabold text-rose-600">
                      {clientState.resistance}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${clientState.resistance}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Active Defense Mechanism Badge */}
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>مکانیسم دفاعی فعال:</span>
                  </span>
                </div>
                <div className="text-[11px] font-medium text-stone-800 bg-white/90 px-2 py-1 rounded-lg border border-amber-200/60 truncate" title={clientState.currentDefense || currentCase.defenseMechanisms[0]}>
                  {clientState.currentDefense || currentCase.defenseMechanisms[0]}
                </div>
              </div>

              {/* Live Supervisory Tip Box */}
              <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-[10px] text-indigo-950 flex items-start gap-1.5 leading-relaxed">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{getSupervisionHint()}</span>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: DETAILED PROGRESS BARS VIEW */}
          {viewMode === 'bars' && (
            <div className="space-y-3">
              {/* 1. Openness Progress Bar */}
              <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                      <Unlock className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-stone-800 text-xs">میزان باز بودن</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderDelta(deltas.openness)}
                    <span className="font-mono font-extrabold text-emerald-700 text-xs">
                      {clientState.openness}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-200/50">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${clientState.openness}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-500">پذیرش درمان:</span>
                  <span className={`font-semibold ${opennessInfo.color}`}>
                    {opennessInfo.text}
                  </span>
                </div>
              </div>

              {/* 2. Resistance Progress Bar */}
              <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-stone-800 text-xs">مقاومت به درمان</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderDelta(deltas.resistance, true)}
                    <span className="font-mono font-extrabold text-rose-600 text-xs">
                      {clientState.resistance}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-200/50">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${clientState.resistance}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-500">حالت تدافعی:</span>
                  <span className={`font-semibold ${resistanceInfo.color}`}>
                    {resistanceInfo.text}
                  </span>
                </div>
              </div>

              {/* 3. Anxiety Progress Bar */}
              <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                    </span>
                    <span className="font-bold text-stone-800 text-xs">سطح اضطراب</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderDelta(deltas.anxiety, true)}
                    <span className="font-mono font-extrabold text-rose-600 text-xs">
                      {clientState.anxiety}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-200/50">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${clientState.anxiety}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-500">برانگیختگی عاطفی:</span>
                  <span className={`font-semibold ${anxietyInfo.color}`}>
                    {anxietyInfo.text}
                  </span>
                </div>
              </div>

              {/* 4. Therapeutic Rapport */}
              <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-teal-100 text-teal-700">
                      <Heart className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-stone-800 text-xs">اتحاد درمانی</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderDelta(deltas.rapport)}
                    <span className="font-mono font-extrabold text-teal-700 text-xs">
                      {clientState.rapport}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-200/50">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${clientState.rapport}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-500">پیوند درمانگر-مراجع:</span>
                  <span className={`font-semibold ${rapportInfo.color}`}>
                    {rapportInfo.text}
                  </span>
                </div>
              </div>

              {/* Active Defense Mechanism Badge */}
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>مکانیسم دفاعی فعال:</span>
                  </span>
                </div>
                <div className="text-[11px] font-medium text-stone-800 bg-white/90 px-2 py-1 rounded-lg border border-amber-200/60 truncate" title={clientState.currentDefense || currentCase.defenseMechanisms[0]}>
                  {clientState.currentDefense || currentCase.defenseMechanisms[0]}
                </div>
              </div>

              {/* Live Supervisory Tip Box */}
              <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-[10px] text-indigo-950 flex items-start gap-1.5 leading-relaxed">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{getSupervisionHint()}</span>
              </div>
            </div>
          )}

        </div>

        {/* Card Footer: Real-time update stamp */}
        <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>پایش لحظه‌ای اضطراب و رابطه</span>
          </span>
          <button
            type="button"
            onClick={toggleCollapse}
            className="text-stone-500 hover:text-teal-700 font-semibold cursor-pointer"
          >
            کوچک‌سازی
          </button>
        </div>
      </div>

      {/* Expanded Chart Modal Dialog */}
      <AnimatePresence>
        {showChartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="fixed inset-0" 
              onClick={() => setShowChartModal(false)} 
            />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-stone-50 via-teal-50/30 to-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-100 text-teal-800 border border-teal-200">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      نمودار تحلیلی لحظه‌ای جلسه: اضطراب و رابطه درمانی
                    </h3>
                    <p className="text-xs text-stone-500">
                      مراجع: {currentCase.patientName} • {currentCase.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChartModal(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body with Large Chart */}
              <div className="p-4 overflow-y-auto space-y-4">
                <LiveSessionMetricsChart
                  messages={messages}
                  clientState={clientState}
                  currentCase={currentCase}
                  height={300}
                />

                {/* Auxiliary Guidelines */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>راهنمای بالینی تفسیر منحنی جلسه:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px] pr-2">
                    <li><strong className="text-rose-700">خط سرخ (اضطراب):</strong> نشان‌دهنده برانگیختگی شناختی-هیجانی مراجع است. کاهش تدریجی آن نشان‌دهنده اثربخشی بازتنظیم هیجانی است.</li>
                    <li><strong className="text-teal-700">خط فیروزه‌ای (رابطه درمانی):</strong> نشان‌دهنده استحکام اتحاد کاری (Therapeutic Alliance) است. صعود آن پیش‌شرط ورود به مداخلات چالش‌برانگیز است.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
