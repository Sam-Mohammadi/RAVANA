import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  BrainCircuit, 
  RefreshCw,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  Layers
} from 'lucide-react';
import type { ClinicalCase } from '../types';

interface PreflightSandboxProps {
  isOpen: boolean;
  onClose: () => void;
  draftText: string;
  patientPreviousUtterance: string;
  currentCase: ClinicalCase;
  onApplyRewrite: (text: string) => void;
}

interface SandboxResult {
  predictedEmpathy: number;
  predictedAllianceChange: string;
  detectedTechniques: string[];
  potentialTraps: string;
  optimizedRewrite: string;
  multiApproachRewrites: {
    cbt: string;
    act: string;
    relational: string;
  };
}

export const PreflightSandbox: React.FC<PreflightSandboxProps> = ({
  isOpen,
  onClose,
  draftText,
  patientPreviousUtterance,
  currentCase,
  onApplyRewrite,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [selectedTab, setSelectedTab] = useState<'optimized' | 'cbt' | 'act' | 'relational'>('optimized');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    if (!draftText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/preflight-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftUtterance: draftText,
          patientPreviousUtterance,
          caseProfile: currentCase,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Preflight analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyOrApply = (text: string, key: string) => {
    onApplyRewrite(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>آزمایشگاه سنجش پیش‌ارسال تکنیک (Pre-Flight Sandbox)</span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                تست و بازنویسی جمله پیش از ارسال نهایی به {currentCase.patientName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-stone-800">

          {/* Context: Patient previous speech */}
          {patientPreviousUtterance && (
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
              <span className="font-bold text-[11px] text-stone-500 block mb-1">
                سخن قبلی مراجع ({currentCase.patientName}):
              </span>
              <p className="italic text-stone-800 bg-white p-2 rounded-lg border border-stone-200/60">
                «{patientPreviousUtterance}»
              </p>
            </div>
          )}

          {/* Therapist current draft */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>پیش‌نویس شما برای ارسال:</span>
              <span className="text-[11px] text-stone-400 font-normal">
                {draftText.length} کاراکتر
              </span>
            </div>
            <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200/80 text-teal-950 font-medium">
              {draftText.trim() ? (
                <span>{draftText}</span>
              ) : (
                <span className="text-stone-400 italic">هنوز متنی در کادر پیام ننوشته‌اید. لطفاً ابتدا جمله‌ای بنویسید سپس آزمایشگاه را باز کنید.</span>
              )}
            </div>
          </div>

          {/* Trigger Analysis Button */}
          {!result && (
            <div className="text-center py-3">
              <button
                id="btn-run-preflight-test"
                onClick={handleRunAnalysis}
                disabled={!draftText.trim() || analyzing}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                    <span>در حال آزمایش هوشمند اثر بالینی و شبیه‌سازی واکنش مراجع...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>آغاز سنجش بالینی و دریافت نسخه‌های بازنویسی‌شده</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Analysis Results Display */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Prediction Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 block mb-0.5">پیش‌بینی نمره همدلی</span>
                  <span className="text-lg font-bold font-mono text-teal-800">
                    {result.predictedEmpathy} <span className="text-xs font-normal">از ۱۰</span>
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 block mb-0.5">اثر بر اتحاد درمانی</span>
                  <span className="text-lg font-bold font-mono text-indigo-700">
                    {result.predictedAllianceChange}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center col-span-2">
                  <span className="text-[10px] text-stone-500 block mb-0.5">تکنیک‌های شناسایی‌شده</span>
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                    {result.detectedTechniques?.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Potential Traps Warning */}
              {result.potentialTraps && result.potentialTraps !== 'هیچ' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-amber-900 block mb-0.5">هشدار سوپروایزر در مورد دام احتمالی:</span>
                    <p className="text-xs leading-relaxed">{result.potentialTraps}</p>
                  </div>
                </div>
              )}

              {/* Multi-School Rewrites Section */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>بازنویسی‌های حرفه‌ای متناسب با مکاتب درمانی:</span>
                  </h4>
                  <span className="text-[10px] text-stone-400">یک کلیک برای جایگزینی</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-stone-200/70 p-1 rounded-xl">
                  <button
                    onClick={() => setSelectedTab('optimized')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTab === 'optimized'
                        ? 'bg-white text-teal-800 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    بازنویسی بهینه
                  </button>
                  <button
                    onClick={() => setSelectedTab('cbt')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTab === 'cbt'
                        ? 'bg-white text-indigo-800 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    رویکرد CBT (سقراطی)
                  </button>
                  <button
                    onClick={() => setSelectedTab('act')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTab === 'act'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    رویکرد ACT (پذیرش)
                  </button>
                  <button
                    onClick={() => setSelectedTab('relational')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTab === 'relational'
                        ? 'bg-white text-rose-800 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    رویکرد رابطه‌ای و هیجانی
                  </button>
                </div>

                {/* Selected Tab Content */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200/90 space-y-2">
                  <p className="text-xs leading-relaxed text-stone-800 font-sans">
                    {selectedTab === 'optimized' && result.optimizedRewrite}
                    {selectedTab === 'cbt' && result.multiApproachRewrites?.cbt}
                    {selectedTab === 'act' && result.multiApproachRewrites?.act}
                    {selectedTab === 'relational' && result.multiApproachRewrites?.relational}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">
                      {selectedTab === 'optimized' && 'بهینه‌سازی‌شده برای تعادل همدلی و هدایتگری'}
                      {selectedTab === 'cbt' && 'تاکید بر بررسی شواهد و بازسازی شناختی'}
                      {selectedTab === 'act' && 'تاکید بر حضور در لحظه، گسلش و پذیرش تجربی'}
                      {selectedTab === 'relational' && 'تاکید بر اتحاد درمانی و نام‌گذاری هیجان'}
                    </span>

                    <button
                      onClick={() => {
                        const targetText = 
                          selectedTab === 'optimized' ? result.optimizedRewrite :
                          selectedTab === 'cbt' ? result.multiApproachRewrites?.cbt :
                          selectedTab === 'act' ? result.multiApproachRewrites?.act :
                          result.multiApproachRewrites?.relational;
                        handleCopyOrApply(targetText || '', selectedTab);
                      }}
                      className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{copiedKey === selectedTab ? 'اعمال شد ✓' : 'اعمال این متن در ورودی چت'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Re-analyze action */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>آزمایش مجدد</span>
                </button>

                <button
                  onClick={onClose}
                  className="text-[11px] text-teal-700 hover:underline font-bold"
                >
                  بستن پنجره
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
