import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Lightbulb, 
  Compass, 
  HelpCircle,
  X,
  ArrowRightLeft,
  Zap,
  RotateCcw
} from 'lucide-react';
import type { SupervisorFeedback, SimulationMessage } from '../types';
import { SupervisorEmpathyValidationWidget } from './SupervisorEmpathyValidationWidget';
import { TypewriterText } from './TypewriterText';

interface LiveSupervisorCopilotWidgetProps {
  latestSupervisorFeedback: SupervisorFeedback | null;
  isLoadingSupervisor: boolean;
  lastTherapistMessage?: SimulationMessage;
  onApplyText?: (text: string) => void;
  onClose?: () => void;
}

export const LiveSupervisorCopilotWidget: React.FC<LiveSupervisorCopilotWidgetProps> = ({
  latestSupervisorFeedback,
  isLoadingSupervisor,
  lastTherapistMessage,
  onApplyText,
  onClose,
}) => {
  const [activeAlternativeSchool, setActiveAlternativeSchool] = useState<'cbt' | 'act' | 'relational'>('cbt');
  const [enableTypewriter, setEnableTypewriter] = useState<boolean>(true);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Generate unique feedback key to re-trigger typewriter on fresh evaluation
  const feedbackKey = latestSupervisorFeedback 
    ? `${latestSupervisorFeedback.techniqueUsed}_${latestSupervisorFeedback.empathyScore}_${latestSupervisorFeedback.clinicalComment?.slice(0, 15)}_${replayKey}`
    : `none_${replayKey}`;

  return (
    <div 
      id="widget-live-supervisor-copilot" 
      className="flex-1 flex flex-col min-h-0 bg-stone-50/50"
    >
      {/* Widget Header bar */}
      <div className="px-3.5 py-2 bg-teal-50/80 border-b border-teal-100 flex items-center justify-between text-xs text-teal-900">
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>ویجت سوپروایزر بالینی هوشمند</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Replay / Retype Button */}
          {latestSupervisorFeedback && (
            <button
              type="button"
              id="btn-replay-supervisor-typing"
              onClick={() => setReplayKey(prev => prev + 1)}
              title="پخش مجدد تایپ زنده بازخورد سوپروایزر"
              className="p-1 text-teal-700 hover:text-teal-950 hover:bg-teal-100 rounded-md transition-colors cursor-pointer text-[10px] flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Toggle Typewriter Effect */}
          <button
            type="button"
            id="btn-toggle-typewriter-mode"
            onClick={() => setEnableTypewriter(prev => !prev)}
            title={enableTypewriter ? 'غیرفعال‌سازی تایپرایتر (نمایش فوری متن)' : 'فعال‌سازی افکت تایپرایتر بازخورد سوپروایزر'}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              enableTypewriter 
                ? 'bg-teal-600 text-white border-teal-700 shadow-2xs' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
            }`}
          >
            <Zap className={`w-2.5 h-2.5 ${enableTypewriter ? 'text-amber-300' : 'text-stone-400'}`} />
            <span>{enableTypewriter ? 'تایپرایتر: فعال' : 'تایپرایتر: فوری'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              id="btn-close-supervisor-widget"
              onClick={onClose}
              title="بستن ویجت سوپروایزر"
              className="p-1 text-teal-700 hover:text-teal-950 hover:bg-teal-100 rounded-md transition-colors cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs text-stone-700">
        {isLoadingSupervisor ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="text-center py-10 space-y-2.5"
          >
            <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-stone-600 text-xs font-medium">سوپروایزر در حال تحلیل پاسخ بالینی شما...</p>
            <span className="text-[11px] text-stone-400">سنجش همدلی، خلوص تکنیک و دام‌های درمانی</span>
          </motion.div>
        ) : latestSupervisorFeedback ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={feedbackKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-3.5"
            >
              {/* 5-Star Empathy & Validation Dedicated Breakdown Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <SupervisorEmpathyValidationWidget
                  latestFeedback={latestSupervisorFeedback}
                  isLoading={isLoadingSupervisor}
                  lastTherapistMessageText={lastTherapistMessage?.content}
                  defaultExpanded={true}
                />
              </motion.div>

              {/* Instant Clinical Nudge (High Priority Coaching) - Rendered with high visual prominence */}
              {latestSupervisorFeedback.instantClinicalNudge && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="bg-gradient-to-r from-teal-900 via-stone-900 to-indigo-950 text-white p-3.5 rounded-xl shadow-xs border border-teal-600/70 space-y-1.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-teal-200">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
                      <span>نکته طلایی و فوری سوپروایزر برای نوبت بعد:</span>
                    </div>
                    {enableTypewriter && (
                      <span className="text-[9px] text-teal-300/80 font-normal">کلیک برای تکمیل</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-100 leading-relaxed font-medium">
                    {enableTypewriter ? (
                      <TypewriterText
                        text={latestSupervisorFeedback.instantClinicalNudge}
                        speed={14}
                        delay={80}
                        triggerKey={feedbackKey}
                        cursorClassName="inline-block w-1.5 h-3 bg-amber-400 rounded-xs mx-0.5 align-middle shadow-xs"
                      />
                    ) : (
                      latestSupervisorFeedback.instantClinicalNudge
                    )}
                  </p>
                </motion.div>
              )}

              {/* Technique & Empathy Score Card */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 font-medium block">تکنیک بالینی شناسایی‌شده:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs inline-block mt-0.5">
                      {latestSupervisorFeedback.techniqueUsed}
                    </span>
                  </div>
                  {latestSupervisorFeedback.techniqueCategory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                      {latestSupervisorFeedback.techniqueCategory}
                    </span>
                  )}
                </div>

                {/* Technique Purity & Depth Badges */}
                <div className="flex items-center gap-2 text-[11px] text-stone-600 pt-1.5 border-t border-stone-100 flex-wrap">
                  {latestSupervisorFeedback.techniquePurityScore !== undefined && (
                    <span>
                      خلوص تکنیک: <strong className="text-indigo-800 font-mono">{latestSupervisorFeedback.techniquePurityScore}</strong>/۱۰
                    </span>
                  )}
                  {latestSupervisorFeedback.depthLevel && (
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      latestSupervisorFeedback.depthLevel === 'عمیق' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : latestSupervisorFeedback.depthLevel === 'متوسط' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      عمق: {latestSupervisorFeedback.depthLevel}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-stone-500">نمره همدلی و درک بالینی:</span>
                    <span className="font-bold text-teal-700 font-mono">{latestSupervisorFeedback.empathyScore} از ۱۰</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-teal-600 transition-all duration-300"
                      style={{ width: `${latestSupervisorFeedback.empathyScore * 10}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100">
                  <span className="text-stone-500">اثر بر اتحاد درمانی:</span>
                  <div className="flex items-center gap-1.5">
                    {latestSupervisorFeedback.allianceDelta !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        latestSupervisorFeedback.allianceDelta > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : latestSupervisorFeedback.allianceDelta < 0 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {latestSupervisorFeedback.allianceDelta > 0 ? `+${latestSupervisorFeedback.allianceDelta}` : latestSupervisorFeedback.allianceDelta}
                      </span>
                    )}
                    <span className="font-semibold text-emerald-700">
                      {latestSupervisorFeedback.allianceImpact}
                    </span>
                  </div>
                </div>

                {/* Bordin's Working Alliance Triad (Bond, Task, Goal) */}
                {latestSupervisorFeedback.workingAllianceTriad && (
                  <div className="pt-2 border-t border-stone-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                      <span>ابعاد سه‌گانه اتحاد درمانی بوردین (WAI):</span>
                      {latestSupervisorFeedback.workingAllianceTriad.ruptureState && latestSupervisorFeedback.workingAllianceTriad.ruptureState !== 'none' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {latestSupervisorFeedback.workingAllianceTriad.ruptureState === 'withdrawal_detected' ? 'گسست انصرافی (Withdrawal)' :
                           latestSupervisorFeedback.workingAllianceTriad.ruptureState === 'confrontation_detected' ? 'گسست رویارویی (Confrontation)' :
                           latestSupervisorFeedback.workingAllianceTriad.ruptureState === 'repair_attempt' ? 'تلاش برای ترمیم (Repair Attempt)' : 'ترمیم موفق (Repaired)'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-stone-50 p-1 rounded border border-stone-200/70">
                        <span className="text-stone-500 block text-[9px]">پیوند عاطفی (Bond)</span>
                        <strong className="text-indigo-800 font-mono text-xs">{latestSupervisorFeedback.workingAllianceTriad.bondScore}/۱۰</strong>
                      </div>
                      <div className="bg-stone-50 p-1 rounded border border-stone-200/70">
                        <span className="text-stone-500 block text-[9px]">توافق تکالیف (Task)</span>
                        <strong className="text-teal-800 font-mono text-xs">{latestSupervisorFeedback.workingAllianceTriad.taskAgreementScore}/۱۰</strong>
                      </div>
                      <div className="bg-stone-50 p-1 rounded border border-stone-200/70">
                        <span className="text-stone-500 block text-[9px]">همسویی هدف (Goal)</span>
                        <strong className="text-amber-800 font-mono text-xs">{latestSupervisorFeedback.workingAllianceTriad.goalAgreementScore}/۱۰</strong>
                      </div>
                    </div>
                    {latestSupervisorFeedback.workingAllianceTriad.ruptureAnalysis && (
                      <p className="text-[10px] text-stone-500 italic bg-stone-50/70 p-1.5 rounded border border-stone-200/60 leading-tight">
                        {enableTypewriter ? (
                          <TypewriterText
                            text={latestSupervisorFeedback.workingAllianceTriad.ruptureAnalysis}
                            speed={12}
                            delay={100}
                            triggerKey={feedbackKey}
                          />
                        ) : (
                          latestSupervisorFeedback.workingAllianceTriad.ruptureAnalysis
                        )}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Deliberate Practice Micro-Skill Guide */}
              {latestSupervisorFeedback.deliberatePracticeGuide && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-gradient-to-br from-indigo-50 via-white to-teal-50/40 p-3 rounded-xl border border-indigo-200/80 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>تمرین هدایت‌شده بالینی (Deliberate Practice):</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {latestSupervisorFeedback.deliberatePracticeGuide.coreMicroSkill}
                    </span>
                  </div>
                  <p className="text-stone-700 text-xs leading-relaxed">
                    {enableTypewriter ? (
                      <TypewriterText
                        text={latestSupervisorFeedback.deliberatePracticeGuide.immediateDrill}
                        speed={14}
                        delay={120}
                        triggerKey={feedbackKey}
                        cursorClassName="inline-block w-1.5 h-3 bg-indigo-600 rounded-xs mx-0.5 align-middle"
                      />
                    ) : (
                      latestSupervisorFeedback.deliberatePracticeGuide.immediateDrill
                    )}
                  </p>
                  <div className="text-[10px] text-stone-500 pt-1 border-t border-indigo-100 flex items-center gap-1">
                    <span className="font-semibold text-indigo-700">مبنای شواهد:</span>
                    <span>{latestSupervisorFeedback.deliberatePracticeGuide.clinicalRationale}</span>
                  </div>
                </motion.div>
              )}

              {/* Supervisor Clinical Comment */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/80 shadow-2xs space-y-1"
              >
                <div className="font-bold text-teal-900 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>تحلیل تشخیصی و آموزشی سوپروایزر:</span>
                  </div>
                  {enableTypewriter && (
                    <span className="text-[9px] text-teal-600 font-normal">کلیک برای نمایش کامل</span>
                  )}
                </div>
                <p className="text-teal-950 leading-relaxed text-xs">
                  {enableTypewriter ? (
                    <TypewriterText
                      text={latestSupervisorFeedback.clinicalComment}
                      speed={13}
                      delay={150}
                      triggerKey={feedbackKey}
                      cursorClassName="inline-block w-1.5 h-3.5 bg-teal-600 rounded-xs mx-0.5 align-middle"
                    />
                  ) : (
                    latestSupervisorFeedback.clinicalComment
                  )}
                </p>
              </motion.div>

              {/* Identified Clinical Trap & Countertransference */}
              {((latestSupervisorFeedback.identifiedTrap && latestSupervisorFeedback.identifiedTrap !== 'هیچ') || latestSupervisorFeedback.countertransferenceMarker) && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900 shadow-2xs space-y-1.5"
                >
                  <div className="font-bold flex items-center justify-between gap-1.5 mb-1 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>دام بالینی یا انتقال متقابل درمانگر:</span>
                    </div>
                    {latestSupervisorFeedback.trapSeverity && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        latestSupervisorFeedback.trapSeverity === 'high' 
                          ? 'bg-rose-200 text-rose-900' 
                          : latestSupervisorFeedback.trapSeverity === 'medium' 
                          ? 'bg-amber-200 text-amber-900' 
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        شدت: {latestSupervisorFeedback.trapSeverity === 'high' ? 'بالا' : latestSupervisorFeedback.trapSeverity === 'medium' ? 'متوسط' : 'خفیف'}
                      </span>
                    )}
                  </div>
                  {latestSupervisorFeedback.identifiedTrap && latestSupervisorFeedback.identifiedTrap !== 'هیچ' && (
                    <p className="text-xs leading-relaxed font-medium">
                      {enableTypewriter ? (
                        <TypewriterText
                          text={latestSupervisorFeedback.identifiedTrap}
                          speed={14}
                          delay={180}
                          triggerKey={feedbackKey}
                          cursorClassName="inline-block w-1.5 h-3 bg-rose-500 rounded-xs mx-0.5 align-middle"
                        />
                      ) : (
                        latestSupervisorFeedback.identifiedTrap
                      )}
                    </p>
                  )}
                  {latestSupervisorFeedback.countertransferenceMarker && (
                    <div className="text-[11px] text-rose-950 bg-white/70 p-2 rounded border border-rose-200/70">
                      <span className="font-bold text-rose-800 block text-[10px]">ردپای انتقال متقابل:</span>
                      {enableTypewriter ? (
                        <TypewriterText
                          text={latestSupervisorFeedback.countertransferenceMarker}
                          speed={14}
                          delay={220}
                          triggerKey={feedbackKey}
                          cursorClassName="inline-block w-1.5 h-3 bg-rose-600 rounded-xs mx-0.5 align-middle"
                        />
                      ) : (
                        latestSupervisorFeedback.countertransferenceMarker
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Multi-Approach Alternatives */}
              {latestSupervisorFeedback.multiApproachAlternatives ? (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900 flex items-center gap-1 text-xs">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>جایگزین‌های مکاتب درمانی:</span>
                    </div>
                    <span className="text-[10px] text-stone-400">یک کلیک برای درج</span>
                  </div>

                  {/* School tabs */}
                  <div className="flex gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold border border-stone-200/80">
                    <button
                      type="button"
                      onClick={() => setActiveAlternativeSchool('cbt')}
                      className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                        activeAlternativeSchool === 'cbt'
                          ? 'bg-white text-indigo-800 shadow-2xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      CBT (شناختی)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAlternativeSchool('act')}
                      className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                        activeAlternativeSchool === 'act'
                          ? 'bg-white text-teal-800 shadow-2xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      ACT (پذیرش)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAlternativeSchool('relational')}
                      className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                        activeAlternativeSchool === 'relational'
                          ? 'bg-white text-rose-800 shadow-2xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      رابطه‌ای
                    </button>
                  </div>

                  {/* Selected alternative text */}
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs italic text-stone-800 leading-relaxed min-h-[44px]">
                    «
                    {enableTypewriter ? (
                      <TypewriterText
                        text={
                          activeAlternativeSchool === 'cbt' 
                            ? (latestSupervisorFeedback.multiApproachAlternatives.cbt || '') 
                            : activeAlternativeSchool === 'act' 
                            ? (latestSupervisorFeedback.multiApproachAlternatives.act || '') 
                            : (latestSupervisorFeedback.multiApproachAlternatives.relational || '')
                        }
                        speed={13}
                        delay={60}
                        triggerKey={`${activeAlternativeSchool}_${feedbackKey}`}
                        cursorClassName="inline-block w-1.5 h-3.5 bg-indigo-500 rounded-xs mx-0.5 align-middle"
                      />
                    ) : (
                      <>
                        {activeAlternativeSchool === 'cbt' && latestSupervisorFeedback.multiApproachAlternatives.cbt}
                        {activeAlternativeSchool === 'act' && latestSupervisorFeedback.multiApproachAlternatives.act}
                        {activeAlternativeSchool === 'relational' && latestSupervisorFeedback.multiApproachAlternatives.relational}
                      </>
                    )}
                    »
                  </div>

                  {onApplyText && (
                    <button
                      type="button"
                      onClick={() => {
                        const text = 
                          activeAlternativeSchool === 'cbt' ? latestSupervisorFeedback.multiApproachAlternatives?.cbt :
                          activeAlternativeSchool === 'act' ? latestSupervisorFeedback.multiApproachAlternatives?.act :
                          latestSupervisorFeedback.multiApproachAlternatives?.relational;
                        if (text) onApplyText(text);
                      }}
                      className="text-[11px] font-bold text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>استفاده از این نسخه در ورودی ↵</span>
                    </button>
                  )}
                </motion.div>
              ) : latestSupervisorFeedback.suggestedAlternative ? (
                /* Fallback: Single Gold Standard Alternative */
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs"
                >
                  <div className="font-bold text-amber-900 mb-1.5 flex items-center gap-1 text-xs">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>نمونه پاسخ استادانه (جایگزین طلایی):</span>
                  </div>
                  <div className="text-amber-950 italic text-xs leading-relaxed bg-white p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
                    «
                    {enableTypewriter ? (
                      <TypewriterText
                        text={latestSupervisorFeedback.suggestedAlternative}
                        speed={14}
                        delay={80}
                        triggerKey={feedbackKey}
                        cursorClassName="inline-block w-1.5 h-3.5 bg-amber-500 rounded-xs mx-0.5 align-middle"
                      />
                    ) : (
                      latestSupervisorFeedback.suggestedAlternative
                    )}
                    »
                  </div>
                  {onApplyText && (
                    <button
                      type="button"
                      onClick={() => onApplyText(latestSupervisorFeedback.suggestedAlternative)}
                      className="mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>استفاده از این جمله در ورودی ↵</span>
                    </button>
                  )}
                </motion.div>
              ) : null}

              {/* Next Strategic Step */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 shadow-2xs"
              >
                <div className="font-bold text-indigo-900 mb-1 text-xs flex items-center justify-between">
                  <span>گام مداخله‌ای پیشنهادی بعدی:</span>
                  {enableTypewriter && (
                    <span className="text-[9px] text-indigo-500 font-normal">کلیک برای نمایش سریع</span>
                  )}
                </div>
                <p className="text-indigo-950 text-xs leading-relaxed">
                  {enableTypewriter ? (
                    <TypewriterText
                      text={latestSupervisorFeedback.recommendedNextStep}
                      speed={13}
                      delay={240}
                      triggerKey={feedbackKey}
                      cursorClassName="inline-block w-1.5 h-3 bg-indigo-600 rounded-xs mx-0.5 align-middle"
                    />
                  ) : (
                    latestSupervisorFeedback.recommendedNextStep
                  )}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-12 px-4 text-stone-400 space-y-3">
            <HelpCircle className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs leading-relaxed">
              با ارسال اولین پیام به مراجع، تحلیل زنده سوپروایزر شامل نمره همدلی، دام‌های بالینی و راهنمایی‌های مداخله در اینجا نمایش داده می‌شود.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

