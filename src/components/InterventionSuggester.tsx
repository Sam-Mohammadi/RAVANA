import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  HeartHandshake, 
  Search, 
  ShieldAlert, 
  Copy, 
  Check, 
  ArrowDownToLine, 
  RefreshCw, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  X,
  Compass,
  Volume2
} from 'lucide-react';
import type { ClinicalCase, ClientState, ClinicalInterventionOption, InterventionSuggesterResult } from '../types';
import { 
  detectSilenceOrHelplessness, 
  generateLocalClinicalInterventions, 
  fetchInterventionSuggestions 
} from '../utils/interventionSuggesterUtils';

interface InterventionSuggesterProps {
  currentCase: ClinicalCase;
  clientState: ClientState;
  lastPatientMessage?: { content: string; nonVerbalCue?: string; stateSnapshot?: ClientState };
  onApplyIntervention: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const InterventionSuggester: React.FC<InterventionSuggesterProps> = ({
  currentCase,
  clientState,
  lastPatientMessage,
  onApplyIntervention,
  isOpen,
  onClose,
  onToggleCollapse,
  isCollapsed = false
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState<'silence' | 'helplessness' | 'resistance' | 'general'>('silence');
  const [suggesterData, setSuggesterData] = useState<InterventionSuggesterResult>(() => 
    generateLocalClinicalInterventions(currentCase, lastPatientMessage?.content || '', 'silence')
  );
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Synchronize detected state when last message changes
  useEffect(() => {
    const detection = detectSilenceOrHelplessness(lastPatientMessage, clientState);
    setSelectedTrigger(detection.trigger);
    const initial = generateLocalClinicalInterventions(
      currentCase, 
      lastPatientMessage?.content || '', 
      detection.trigger
    );
    setSuggesterData(initial);
    if (initial.interventions.length > 0) {
      setActiveTabId(initial.interventions[0].id);
    }
  }, [lastPatientMessage?.content, lastPatientMessage?.nonVerbalCue, currentCase.id]);

  if (!isOpen) return null;

  const handleTriggerChange = (trigger: 'silence' | 'helplessness' | 'resistance' | 'general') => {
    setSelectedTrigger(trigger);
    const updated = generateLocalClinicalInterventions(
      currentCase, 
      lastPatientMessage?.content || '', 
      trigger
    );
    setSuggesterData(updated);
    if (updated.interventions.length > 0) {
      setActiveTabId(updated.interventions[0].id);
    }
  };

  const handleFetchAiSuggestions = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetchInterventionSuggestions(
        currentCase,
        lastPatientMessage?.content || '',
        clientState,
        selectedTrigger
      );
      setSuggesterData(res);
      if (res.interventions.length > 0) {
        setActiveTabId(res.interventions[0].id);
      }
    } catch (err) {
      console.error('Error refreshing interventions via AI:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reflection':
        return <HeartHandshake className="w-4 h-4 text-purple-600" />;
      case 'clarification':
        return <Search className="w-4 h-4 text-amber-600" />;
      case 'confrontation':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Compass className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryBadgeStyles = (category: string) => {
    switch (category) {
      case 'reflection':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'clarification':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confrontation':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div 
      id="intervention-suggester-widget"
      className="bg-white border-t-2 border-indigo-500 shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Widget Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-stone-50 via-indigo-50/40 to-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Title & Trigger Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                ویجت پیشنهادی مداخلات بالینی (Intervention Suggester)
              </h4>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                ۳ مداخله تأیید شده
              </span>
            </div>
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
              {suggesterData.triggerDescription}
            </p>
          </div>
        </div>

        {/* Right: Controls (AI Refresh, Mode Selector, Collapse, Close) */}
        <div className="flex items-center gap-1.5">
          
          {/* AI Refresh Button */}
          <button
            id="btn-refresh-interventions-ai"
            onClick={handleFetchAiSuggestions}
            disabled={isLoadingAi}
            title="تولید مجدد پیشنهادات بالینی شخصی‌سازی‌شده با هوش مصنوعی"
            className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden md:inline">به‌روزرسانی با AI</span>
          </button>

          {/* Collapse/Expand toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'گسترش ویجت' : 'جمع‌کردن ویجت'}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            title="بستن ویجت پیشنهادی"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body (hidden when collapsed) */}
      {!isCollapsed && (
        <div className="p-4 bg-stone-50/50 space-y-3">
          
          {/* Mode / Trigger Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-stone-200/80">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-stone-500 ml-1">سناریوی بالینی:</span>
              <button
                type="button"
                onClick={() => handleTriggerChange('silence')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer text-xs inline-flex items-center gap-1 ${
                  selectedTrigger === 'silence'
                    ? 'bg-purple-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>وقفه و سکوت مراجع</span>
                <span className="font-mono text-[10px] opacity-75">(Silence)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerChange('helplessness')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer text-xs inline-flex items-center gap-1 ${
                  selectedTrigger === 'helplessness'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>درماندگی مراجع</span>
                <span className="font-mono text-[10px] opacity-75">(Helplessness)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerChange('resistance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer text-xs inline-flex items-center gap-1 ${
                  selectedTrigger === 'resistance'
                    ? 'bg-rose-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>مقاومت تدافعی</span>
                <span className="font-mono text-[10px] opacity-75">(Resistance)</span>
              </button>
            </div>

            {/* Context Note */}
            <div className="text-[11px] text-stone-500 font-medium">
              مراجع: <strong className="text-stone-800">{currentCase.patientName}</strong>
            </div>
          </div>

          {/* 3 Clinical Intervention Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {suggesterData.interventions.map((option, idx) => {
              const isSelected = activeTabId === option.id;
              return (
                <div
                  key={option.id || idx}
                  id={`card-intervention-${option.category}`}
                  onClick={() => setActiveTabId(option.id)}
                  className={`bg-white rounded-xl border transition-all duration-200 p-3.5 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-200/70 shadow-xs'
                      : 'border-stone-200 hover:border-indigo-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Card Header: Category & School */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className={`px-2 py-0.5 rounded-md border text-[11px] font-bold flex items-center gap-1.5 ${getCategoryBadgeStyles(option.category)}`}>
                        {getCategoryIcon(option.category)}
                        <span>{option.shortCategory}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium">
                        {option.therapeuticSchool}
                      </span>
                    </div>

                    {/* Clinical Objective */}
                    <div className="text-xs font-bold text-stone-800 mb-2">
                      {option.clinicalObjective}
                    </div>

                    {/* Ready Phrasing Card (The exact sentence to utter) */}
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs leading-relaxed text-stone-900 font-medium mb-3 relative group">
                      <div className="text-[10px] text-indigo-700 font-bold mb-1 flex items-center justify-between">
                        <span>جمله پیشنهادی برای بیان به مراجع:</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-normal">
                          {option.expectedAllianceImpact}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap italic text-stone-800">
                        {option.suggestedPhrasing}
                      </p>
                    </div>

                    {/* Rationale & Supervisor Watchout */}
                    <div className="space-y-1.5 text-[11px] text-stone-600 mb-3">
                      <p>
                        <strong className="text-stone-700">علت انتخاب: </strong>
                        {option.rationale}
                      </p>
                      {option.watchOutWarning && (
                        <div className="flex items-start gap-1 text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200/50 text-[10px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>هشدار سوپروایزر: </strong>{option.watchOutWarning}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer: Apply to input or Copy */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      id={`btn-apply-intervention-${option.category}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyIntervention(option.suggestedPhrasing);
                      }}
                      className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>درج در متن پیام</span>
                    </button>

                    <button
                      id={`btn-copy-intervention-${option.category}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(option.suggestedPhrasing, option.id);
                      }}
                      title="کپی در حافظه"
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedId === option.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Note footer */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>مداخلات بر اساس DSM-5 و شواهد درمانی CBT، EFT و روان‌پویشی کوتاه‌مدت کالیبره شده‌اند.</span>
            </span>
            <span className="text-[10px] text-stone-400">
              کلیک روی «درج در متن پیام» جمله را مستقیماً در کادر پیام شما قرار می‌دهد.
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
