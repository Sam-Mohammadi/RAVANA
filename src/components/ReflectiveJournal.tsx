import React, { useState, useMemo } from 'react';
import { 
  BookHeart, 
  PlusCircle, 
  Sparkles, 
  HeartHandshake, 
  Brain, 
  Compass, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Trash2, 
  Edit3, 
  Award, 
  TrendingUp, 
  Smile, 
  ShieldAlert, 
  Lightbulb, 
  ArrowRight,
  Printer,
  Tag,
  Share2,
  RefreshCw,
  FolderKanban,
  FileText
} from 'lucide-react';
import type { 
  ReflectiveJournalEntry, 
  ReflectiveMoodType, 
  ClinicalCase, 
  SavedSession,
  AIReflectiveInsight 
} from '../types';
import { DEFAULT_REFLECTIVE_JOURNALS } from '../data/defaultJournals';

interface ReflectiveJournalProps {
  entries: ReflectiveJournalEntry[];
  onSaveEntry: (entry: ReflectiveJournalEntry) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  cases: ClinicalCase[];
  savedSessions: SavedSession[];
  activeCase?: ClinicalCase;
  currentUserId?: string;
  currentUserEmail?: string;
  onNavigateToSimulator?: () => void;
  prefillFromSession?: SavedSession | null;
}

const MOOD_OPTIONS: { type: ReflectiveMoodType; label: string; color: string; desc: string }[] = [
  { type: 'reflective', label: 'تأمل‌گر و بیدار', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'جستجوگر، پذیرا و هوشیار به فرآیند درمان' },
  { type: 'confident', label: 'مطمئن و استوار', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'تسلط خوب بر ابزارها و حضور مؤثر' },
  { type: 'vulnerable', label: 'آسیب‌پذیر اما پویا', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'احساس مواجهه با محدودیت‌ها و میل به رشد' },
  { type: 'anxious', label: 'مضطرب و تحت فشار', color: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'تنیدگی ناشی از ترس از اشتباه یا شدت علائم مراجع' },
  { type: 'empathetic', label: 'همدل و متصل', color: 'bg-teal-100 text-teal-800 border-teal-200', desc: 'پیوند عاطفی عمیق و طنین انسانی مشترک' },
  { type: 'inspired', label: 'پرانرژی و الهام‌بخش', color: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'انگیزه بالا پس از گره‌گشایی بالینی' },
  { type: 'fatigued', label: 'خسته و نیازمند بازیابی', color: 'bg-stone-200 text-stone-700 border-stone-300', desc: 'احساس تخلیه روانی و ضرورت خودشفقت‌ورزی' },
];

export const ReflectiveJournal: React.FC<ReflectiveJournalProps> = ({
  entries,
  onSaveEntry,
  onDeleteEntry,
  cases,
  savedSessions,
  activeCase,
  currentUserId,
  currentUserEmail,
  onNavigateToSimulator,
  prefillFromSession,
}) => {
  // Main view navigation tab
  const [subTab, setSubTab] = useState<'entries' | 'create' | 'analytics'>(
    prefillFromSession ? 'create' : 'entries'
  );

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    prefillFromSession?.caseId || activeCase?.id || cases[0]?.id || ''
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>(prefillFromSession?.id || '');
  const [entryTitle, setEntryTitle] = useState<string>(
    prefillFromSession ? `تأمل بر جلسه بالینی ${prefillFromSession.patientName}` : ''
  );
  const [selectedMood, setSelectedMood] = useState<ReflectiveMoodType>('reflective');
  
  const [innerEmotionalState, setInnerEmotionalState] = useState<string>('');
  const [countertransferenceAwareness, setCountertransferenceAwareness] = useState<string>('');
  const [momentsOfBreakthrough, setMomentsOfBreakthrough] = useState<string>('');
  const [momentsOfStruggle, setMomentsOfStruggle] = useState<string>('');
  const [personalGrowthLesson, setPersonalGrowthLesson] = useState<string>('');
  const [nextSessionCommitment, setNextSessionCommitment] = useState<string>('');

  const [selfRatings, setSelfRatings] = useState({
    personalConfidence: 7,
    emotionalGroundedness: 7,
    selfCompassion: 7.5,
    therapeuticPresence: 7,
  });

  const [tagsInput, setTagsInput] = useState<string>('انتقال متقابل، رشد فردی');

  // AI Reflective Insight loading & result
  const [isLoadingAIInsight, setIsLoadingAIInsight] = useState(false);
  const [tempAIInsight, setTempAIInsight] = useState<AIReflectiveInsight | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(
    entries[0]?.id || DEFAULT_REFLECTIVE_JOURNALS[0]?.id || null
  );

  // Effective entries (user entries or fallback to rich default seed entries)
  const effectiveEntries = useMemo(() => {
    if (entries && entries.length > 0) return entries;
    return DEFAULT_REFLECTIVE_JOURNALS;
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return effectiveEntries.filter(entry => {
      const matchesSearch = 
        !searchQuery ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.innerEmotionalState.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.countertransferenceAwareness.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.personalGrowthLesson.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMood = filterMood === 'all' || entry.overallMood === filterMood;
      const matchesCase = filterCase === 'all' || entry.caseId === filterCase;

      return matchesSearch && matchesMood && matchesCase;
    });
  }, [effectiveEntries, searchQuery, filterMood, filterCase]);

  // Analytics & Summary Metrics
  const analyticsSummary = useMemo(() => {
    const count = effectiveEntries.length;
    if (count === 0) {
      return {
        count: 0,
        avgConfidence: 0,
        avgGroundedness: 0,
        avgSelfCompassion: 0,
        avgPresence: 0,
        overallInnerGrowthScore: 0,
      };
    }

    const sumConf = effectiveEntries.reduce((acc, e) => acc + (e.selfRatings?.personalConfidence || 7), 0);
    const sumGround = effectiveEntries.reduce((acc, e) => acc + (e.selfRatings?.emotionalGroundedness || 7), 0);
    const sumComp = effectiveEntries.reduce((acc, e) => acc + (e.selfRatings?.selfCompassion || 7), 0);
    const sumPres = effectiveEntries.reduce((acc, e) => acc + (e.selfRatings?.therapeuticPresence || 7), 0);

    const avgConfidence = Number((sumConf / count).toFixed(1));
    const avgGroundedness = Number((sumGround / count).toFixed(1));
    const avgSelfCompassion = Number((sumComp / count).toFixed(1));
    const avgPresence = Number((sumPres / count).toFixed(1));

    const overallInnerGrowthScore = Math.round(
      ((avgConfidence + avgGroundedness + avgSelfCompassion + avgPresence) / 4) * 10
    );

    return {
      count,
      avgConfidence,
      avgGroundedness,
      avgSelfCompassion,
      avgPresence,
      overallInnerGrowthScore,
    };
  }, [effectiveEntries]);

  // Average Clinical CTRS score from simulations (to demonstrate Dual Growth)
  const averageClinicalScore = useMemo(() => {
    if (!savedSessions || savedSessions.length === 0) return 78;
    const sum = savedSessions.reduce((acc, s) => acc + (s.finalScore || 70), 0);
    return Math.round(sum / savedSessions.length);
  }, [savedSessions]);

  // Handle opening entry in edit mode
  const handleStartEdit = (entry: ReflectiveJournalEntry) => {
    setEditingId(entry.id);
    setSelectedCaseId(entry.caseId || cases[0]?.id || '');
    setSelectedSessionId(entry.sessionId || '');
    setEntryTitle(entry.title);
    setSelectedMood(entry.overallMood);
    setInnerEmotionalState(entry.innerEmotionalState);
    setCountertransferenceAwareness(entry.countertransferenceAwareness);
    setMomentsOfBreakthrough(entry.momentsOfBreakthrough);
    setMomentsOfStruggle(entry.momentsOfStruggle);
    setPersonalGrowthLesson(entry.personalGrowthLesson);
    setNextSessionCommitment(entry.nextSessionCommitment);
    setSelfRatings(entry.selfRatings || {
      personalConfidence: 7,
      emotionalGroundedness: 7,
      selfCompassion: 7,
      therapeuticPresence: 7,
    });
    setTagsInput((entry.tags || []).join('، '));
    setTempAIInsight(entry.aiReflectiveInsight || null);
    setSubTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const handleResetForm = () => {
    setEditingId(null);
    setEntryTitle('');
    setSelectedMood('reflective');
    setInnerEmotionalState('');
    setCountertransferenceAwareness('');
    setMomentsOfBreakthrough('');
    setMomentsOfStruggle('');
    setPersonalGrowthLesson('');
    setNextSessionCommitment('');
    setSelfRatings({
      personalConfidence: 7,
      emotionalGroundedness: 7,
      selfCompassion: 7.5,
      therapeuticPresence: 7,
    });
    setTagsInput('انتقال متقابل، رشد فردی');
    setTempAIInsight(null);
  };

  // Request AI Reflective Insight
  const handleRequestAIInsight = async () => {
    const chosenCase = cases.find(c => c.id === selectedCaseId);
    
    if (!innerEmotionalState && !countertransferenceAwareness && !personalGrowthLesson) {
      alert('لطفاً حداقل یکی از بخش‌های احساسات درونی یا درس‌های رشد فردی را پر کنید تا هوش مصنوعی بتواند بازخورد اختصاصی صادر کند.');
      return;
    }

    setIsLoadingAIInsight(true);
    try {
      const res = await fetch('/api/reflective-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseTitle: chosenCase?.title,
          patientName: chosenCase?.patientName,
          dsmDiagnosis: chosenCase?.dsmDiagnosis,
          overallMood: selectedMood,
          innerEmotionalState,
          countertransferenceAwareness,
          momentsOfBreakthrough,
          momentsOfStruggle,
          personalGrowthLesson,
          nextSessionCommitment,
          selfRatings,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTempAIInsight(data.data);
      } else {
        alert('خطا در دریافت بینش سوپروایزر: ' + (data.error || 'خطای سرور'));
      }
    } catch (e: any) {
      console.error('Reflective insight error:', e);
      alert('خطا در ارتباط با سرور: ' + e.message);
    } finally {
      setIsLoadingAIInsight(false);
    }
  };

  // Submit Form
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entryTitle.trim()) {
      alert('لطفاً عنوانی برای این یادداشت تأملی وارد کنید.');
      return;
    }

    const chosenCase = cases.find(c => c.id === selectedCaseId);
    const chosenMoodObj = MOOD_OPTIONS.find(m => m.type === selectedMood);

    const tags = tagsInput
      .split(/[,،]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newEntry: ReflectiveJournalEntry = {
      id: editingId || `journal-${Date.now()}`,
      userId: currentUserId || 'guest',
      userEmail: currentUserEmail || 'guest@psychosim.local',
      createdAt: editingId 
        ? (effectiveEntries.find(e => e.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId: selectedSessionId || undefined,
      caseId: chosenCase?.id,
      caseTitle: chosenCase?.title,
      patientName: chosenCase?.patientName,
      dsmDiagnosis: chosenCase?.dsmDiagnosis,
      title: entryTitle.trim(),
      overallMood: selectedMood,
      moodLabel: chosenMoodObj?.label || 'تأمل‌گر',
      innerEmotionalState: innerEmotionalState.trim(),
      countertransferenceAwareness: countertransferenceAwareness.trim(),
      momentsOfBreakthrough: momentsOfBreakthrough.trim(),
      momentsOfStruggle: momentsOfStruggle.trim(),
      personalGrowthLesson: personalGrowthLesson.trim(),
      nextSessionCommitment: nextSessionCommitment.trim(),
      selfRatings,
      aiReflectiveInsight: tempAIInsight || undefined,
      tags,
    };

    await onSaveEntry(newEntry);
    handleResetForm();
    setSubTab('entries');
    setExpandedEntryId(newEntry.id);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8 space-y-6">
      
      {/* Top Banner & Orientation */}
      <div className="bg-gradient-to-r from-stone-900 via-indigo-950 to-teal-950 text-white p-5 sm:p-7 rounded-3xl shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
              <BookHeart className="w-3.5 h-3.5" />
              <span>ژورنال تأمل بالینی و رشد فردی درمانگر</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              دفترچه تأمل درونی و تکامل شایستگی‌های روان‌درمانگر
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              مهارت تکنیکی بدون خودآگاهی درونی، منجر به فرسودگی و تعارضات ناپیدا در اتاق درمان می‌شود. در این فضا احساسات، انتقال متقابل (Countertransference)، نقاط عطف و درس‌های انسانی حاصل از جلسات شبیه‌سازی را ثبت کنید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <button
              id="btn-journal-new-entry"
              onClick={() => {
                handleResetForm();
                setSubTab('create');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تأمل درباره جلسه جدید</span>
            </button>
            <button
              id="btn-journal-view-analytics"
              onClick={() => setSubTab('analytics')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all border border-white/20 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>سیر رشد دوگانه</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-white/10 text-stone-200">
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-stone-400">یادداشت‌های تأملی ثبت‌شده</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-0.5">
              {analyticsSummary.count} <span className="text-xs font-normal text-stone-400">مورد</span>
            </div>
          </div>
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-stone-400">شاخص رشد درونی و هوشیاری</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-teal-300 mt-0.5">
              {analyticsSummary.overallInnerGrowthScore}٪
            </div>
          </div>
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-stone-400">میانگین شفقت به خود در نقص‌ها</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-amber-300 mt-0.5">
              {analyticsSummary.avgSelfCompassion} <span className="text-xs font-normal text-stone-400">از ۱۰</span>
            </div>
          </div>
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/10">
            <div className="text-[10px] text-stone-400">میانگین مهارت فنی (CTRS)</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-indigo-300 mt-0.5">
              {averageClinicalScore} <span className="text-xs font-normal text-stone-400">از ۱۰۰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            id="tab-btn-entries"
            onClick={() => setSubTab('entries')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subTab === 'entries'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
            }`}
          >
            <BookHeart className="w-4 h-4 text-teal-500" />
            <span>یادداشت‌های تأملی من ({filteredEntries.length})</span>
          </button>

          <button
            id="tab-btn-create"
            onClick={() => {
              if (subTab !== 'create') handleResetForm();
              setSubTab('create');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subTab === 'create'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
            }`}
          >
            <Edit3 className="w-4 h-4 text-amber-500" />
            <span>{editingId ? 'ویرایش تأمل بالینی' : 'ثبت تأمل جدید'}</span>
          </button>

          <button
            id="tab-btn-analytics"
            onClick={() => setSubTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subTab === 'analytics'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>رشد فردی در مقایسه با مهارت بالینی</span>
          </button>
        </div>

        {onNavigateToSimulator && (
          <button
            onClick={onNavigateToSimulator}
            className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
          >
            <span>ورود به اتاق شبیه‌سازی</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: ENTRIES TIMELINE & LIST */}
      {/* ========================================================= */}
      {subTab === 'entries' && (
        <div className="space-y-4">
          
          {/* Search & Filters */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-journal-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، انتقال متقابل، احساسات یا درس‌های رشد فردی..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span>حالت روحی:</span>
                <select
                  id="select-filter-mood"
                  value={filterMood}
                  onChange={e => setFilterMood(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:outline-hidden"
                >
                  <option value="all">همه حالات</option>
                  {MOOD_OPTIONS.map(m => (
                    <option key={m.type} value={m.type}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span>کیس بالینی:</span>
                <select
                  id="select-filter-case"
                  value={filterCase}
                  onChange={e => setFilterCase(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:outline-hidden max-w-[150px] truncate"
                >
                  <option value="all">همه کیس‌ها</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.patientName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {filteredEntries.length === 0 && (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
              <BookHeart className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">هیچ یادداشت تأملی یافت نشد</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                هیچ موردی مطابق فیلترهای جاری پیدا نشد یا هنوز یادداشتی ثبت نکرده‌اید. با کلیک بر روی دکمه زیر، اولین تأمل بالینی خود را بنویسید.
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setSubTab('create');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                ثبت اولین تأمل بالینی
              </button>
            </div>
          )}

          {/* Entries Cards */}
          <div className="space-y-4">
            {filteredEntries.map(entry => {
              const isExpanded = expandedEntryId === entry.id;
              const moodObj = MOOD_OPTIONS.find(m => m.type === entry.overallMood);
              const dateStr = new Date(entry.createdAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                >
                  {/* Card Header & Preview */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${moodObj?.color || 'bg-stone-100 text-stone-800'}`}>
                            {entry.moodLabel || moodObj?.label}
                          </span>
                          
                          {entry.patientName && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                              کیس: {entry.patientName}
                            </span>
                          )}

                          {entry.dsmDiagnosis && (
                            <span className="text-[10px] text-stone-400 hidden md:inline">
                              ({entry.dsmDiagnosis})
                            </span>
                          )}

                          <span className="text-[11px] text-stone-400 mr-auto sm:mr-0 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{dateStr}</span>
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                          {entry.title}
                        </h3>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="p-1.5 text-stone-400 hover:text-indigo-600 rounded-lg hover:bg-stone-100 transition-colors"
                          title="ویرایش یادداشت"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('آیا از حذف این یادداشت تأملی مطمئن هستید؟')) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="حذف یادداشت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'بستن جزئیات' : 'مشاهده عمیق'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Compact preview quote when collapsed */}
                    {!isExpanded && (
                      <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 line-clamp-2">
                        <strong className="text-stone-700 font-semibold">درس رشد فردی: </strong>
                        {entry.personalGrowthLesson || entry.innerEmotionalState || 'تأمل بالینی ثبت شده است.'}
                      </div>
                    )}

                    {/* Ratings Mini Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-stone-100 text-stone-600 text-[11px]">
                      <div className="flex items-center justify-between bg-stone-50 px-2.5 py-1 rounded-lg">
                        <span>اعتمادبه‌نفس:</span>
                        <strong className="text-indigo-700 font-mono">{entry.selfRatings?.personalConfidence || 7}/۱۰</strong>
                      </div>
                      <div className="flex items-center justify-between bg-stone-50 px-2.5 py-1 rounded-lg">
                        <span>ثبات هیجانی:</span>
                        <strong className="text-teal-700 font-mono">{entry.selfRatings?.emotionalGroundedness || 7}/۱۰</strong>
                      </div>
                      <div className="flex items-center justify-between bg-stone-50 px-2.5 py-1 rounded-lg">
                        <span>شفقت به خود:</span>
                        <strong className="text-amber-700 font-mono">{entry.selfRatings?.selfCompassion || 7}/۱۰</strong>
                      </div>
                      <div className="flex items-center justify-between bg-stone-50 px-2.5 py-1 rounded-lg">
                        <span>حضور درمانی:</span>
                        <strong className="text-emerald-700 font-mono">{entry.selfRatings?.therapeuticPresence || 7}/۱۰</strong>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed View */}
                  {isExpanded && (
                    <div className="bg-stone-50/70 p-4 sm:p-6 border-t border-stone-200 space-y-4 text-xs leading-relaxed animate-in fade-in duration-200">
                      
                      {/* Section 1 & 2: Emotional State & Countertransference */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs text-indigo-900">
                            <HeartHandshake className="w-4 h-4 text-indigo-600" />
                            <span>احساسات درونی من در طول جلسه:</span>
                          </div>
                          <p className="text-stone-700 whitespace-pre-wrap">
                            {entry.innerEmotionalState || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs text-rose-900">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>انتقال متقابل، محرک‌ها و تله‌های عاطفی:</span>
                          </div>
                          <p className="text-stone-700 whitespace-pre-wrap">
                            {entry.countertransferenceAwareness || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>
                      </div>

                      {/* Section 3 & 4: Breakthroughs vs Struggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>نقاط عطف و لحظات پیوند اصیل انسانی:</span>
                          </div>
                          <p className="text-emerald-950 whitespace-pre-wrap">
                            {entry.momentsOfBreakthrough || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>

                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>لحظات استیصال، دفاع یا احساس ناکافی بودن:</span>
                          </div>
                          <p className="text-amber-950 whitespace-pre-wrap">
                            {entry.momentsOfStruggle || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>
                      </div>

                      {/* Section 5 & 6: Personal Growth Lesson & Commitment */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                            <Compass className="w-4 h-4 text-indigo-600" />
                            <span>درس این جلسه برای رشد شخصی و هویت درمانگر:</span>
                          </div>
                          <p className="text-stone-800 whitespace-pre-wrap font-medium">
                            {entry.personalGrowthLesson || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-teal-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-teal-900 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            <span>تعهد و تمرین عملی من برای جلسه آینده:</span>
                          </div>
                          <p className="text-teal-950 whitespace-pre-wrap font-medium">
                            {entry.nextSessionCommitment || 'توضیحی ثبت نشده است.'}
                          </p>
                        </div>
                      </div>

                      {/* AI Reflective Insight Box */}
                      {entry.aiReflectiveInsight && (
                        <div className="bg-gradient-to-br from-indigo-900 to-teal-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-white/20 pb-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-teal-200">
                              <Brain className="w-4 h-4 text-amber-300" />
                              <span>پژواک بینش‌بخش سوپروایزر انسانی-وجودی (AI Reflective Echo)</span>
                            </div>
                            <span className="text-[10px] text-teal-300 bg-white/10 px-2 py-0.5 rounded">تحلیل اگزیستانسیل</span>
                          </div>

                          <div className="space-y-2 text-stone-100 text-xs">
                            <p className="leading-relaxed font-medium text-amber-100">
                              «{entry.aiReflectiveInsight.empathyForStudent}»
                            </p>

                            <div className="bg-white/10 p-3 rounded-xl space-y-1">
                              <span className="font-bold text-teal-200 text-[11px] block">رمزگشایی از انتقال متقابل:</span>
                              <p className="text-stone-200">{entry.aiReflectiveInsight.countertransferenceInsight}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-black/20 p-2.5 rounded-lg">
                                <span className="font-bold text-amber-300 block mb-0.5">پرسش برای ژرف‌اندیشی:</span>
                                <span>{entry.aiReflectiveInsight.growthPrompt}</span>
                              </div>
                              <div className="bg-black/20 p-2.5 rounded-lg">
                                <span className="font-bold text-emerald-300 block mb-0.5">تمرین خودشفقت‌ورزی:</span>
                                <span>{entry.aiReflectiveInsight.mindfulSelfCareTip}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <Tag className="w-3.5 h-3.5 text-stone-400" />
                          {entry.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-md text-[10px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: NEW / EDIT REFLECTION FORM */}
      {/* ========================================================= */}
      {subTab === 'create' && (
        <form onSubmit={handleSubmitEntry} className="bg-white p-5 sm:p-7 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {editingId ? 'ویرایش تأمل بالینی' : 'ثبت تأمل جدید پیرامون جلسه درمانی'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                با صداقت و بدون قضاوت، آنچه در دنیای درون شما در اتاق درمان گذشت را مستند کنید.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTab('entries')}
                className="px-3 py-1.5 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                انصراف و بازگشت
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                ذخیره یادداشت تأملی
              </button>
            </div>
          </div>

          {/* Association: Case & Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                کیس بالینی مرتبط:
              </label>
              <select
                id="form-select-case"
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.patientName} — {c.chiefComplaint} ({c.dsmDiagnosis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                پیوند با جلسه ذخیره‌شده (اختیاری):
              </label>
              <select
                id="form-select-session"
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800"
              >
                <option value="">تأمل عمومی و آزاد (بدون پیوند به جلسه خاص)</option>
                {savedSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    جلسه {s.patientName} ({new Date(s.createdAt).toLocaleDateString('fa-IR')}) — نمره: {s.finalScore}/100
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عنوان این یادداشت تأملی: *
            </label>
            <input
              id="form-input-title"
              type="text"
              required
              value={entryTitle}
              onChange={e => setEntryTitle(e.target.value)}
              placeholder="مثلاً: مدیریت تنیدگی در برابر مقاومت مراجع یا احساس نجات‌بخشی خودم..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 font-medium"
            />
          </div>

          {/* Mood Selector Chips */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              حالت روحی و اتمسفر هیجانی شما در این تجربه:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {MOOD_OPTIONS.map(m => {
                const isSelected = selectedMood === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setSelectedMood(m.type)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{m.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] text-stone-500 leading-tight line-clamp-2">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Guided Reflection Questions */}
          <div className="space-y-4 pt-2">
            
            {/* Question 1 */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-indigo-600" />
                <span>۱. احساسات درونی من حین جلسه:</span>
              </label>
              <p className="text-[11px] text-stone-500 mb-1.5">
                وقتی مراجع سخن می‌گفت یا مکث می‌کرد، چه هیجاناتی در بدن یا ذهنتان شکل گرفت؟ (شرم، شتاب، همدلی، خشم ملایم، یا احساس گرما؟)
              </p>
              <textarea
                id="form-textarea-inner-emotions"
                rows={3}
                value={innerEmotionalState}
                onChange={e => setInnerEmotionalState(e.target.value)}
                placeholder="توصیف حالات بدنی، ضربان قلب، احساساتی که در طول تعامل آمد و رفت..."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
              />
            </div>

            {/* Question 2 */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>۲. آگاهی از انتقال متقابل (Countertransference) و تله‌های شخصی:</span>
              </label>
              <p className="text-[11px] text-stone-500 mb-1.5">
                آیا احساس نیاز به حل فوری مشکل (منجی‌گری)، تاییدطلبی، یا اثبات برتری علمی خود داشتید؟ کدام رفتار مراجع نقاط حساس شما را لمس کرد؟
              </p>
              <textarea
                id="form-textarea-countertransference"
                rows={3}
                value={countertransferenceAwareness}
                onChange={e => setCountertransferenceAwareness(e.target.value)}
                placeholder="تله‌های شخصی فعال‌شده، فرضیات ناگفته درمانگر، تمایل به قضاوت یا نجات‌بخشی..."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
              />
            </div>

            {/* Question 3 & 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>۳. نقاط عطف و لحظات پیوند اصیل:</span>
                </label>
                <textarea
                  id="form-textarea-breakthroughs"
                  rows={3}
                  value={momentsOfBreakthrough}
                  onChange={e => setMomentsOfBreakthrough(e.target.value)}
                  placeholder="کجا حس کردید دیوار دفاعی مراجع فرو ریخت و رابطه عمیق شد؟"
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>۴. لحظات استیصال یا احساس ناتوانی:</span>
                </label>
                <textarea
                  id="form-textarea-struggles"
                  rows={3}
                  value={momentsOfStruggle}
                  onChange={e => setMomentsOfStruggle(e.target.value)}
                  placeholder="کجا دستپاچه شدید، سکوت سخت شد، یا احساس کردید مهارت‌هایتان کافی نیست؟"
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
                />
              </div>
            </div>

            {/* Question 5 & 6 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>۵. درس رشد فردی و وجودی این جلسه:</span>
                </label>
                <textarea
                  id="form-textarea-lesson"
                  rows={3}
                  value={personalGrowthLesson}
                  onChange={e => setPersonalGrowthLesson(e.target.value)}
                  placeholder="این مراجع و این تعامل، چه چیزی درباره ظرفیت‌های انسانی خودتان به شما یاد داد؟"
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>۶. تعهد عملی برای جلسه آینده:</span>
                </label>
                <textarea
                  id="form-textarea-commitment"
                  rows={3}
                  value={nextSessionCommitment}
                  onChange={e => setNextSessionCommitment(e.target.value)}
                  placeholder="در نوبت بعدی چه کار مشخصی انجام می‌دهید؟ (مثلاً ۲ ثانیه مکث قبل از هر مداخله)..."
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800 leading-relaxed"
                />
              </div>
            </div>

          </div>

          {/* 4 Self-Rating Sliders */}
          <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>خودسنجی ابعاد رشد درونی (از ۱ تا ۱۰):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-600">اعتمادبه‌نفس بالینی:</span>
                  <span className="font-bold text-indigo-700 font-mono">{selfRatings.personalConfidence} / ۱۰</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={selfRatings.personalConfidence}
                  onChange={e => setSelfRatings({ ...selfRatings, personalConfidence: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-600">ثبات هیجانی و لنگرگاه آرامش:</span>
                  <span className="font-bold text-teal-700 font-mono">{selfRatings.emotionalGroundedness} / ۱۰</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={selfRatings.emotionalGroundedness}
                  onChange={e => setSelfRatings({ ...selfRatings, emotionalGroundedness: parseFloat(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-600">شفقت به خود در زمان بروز نقص و اشتباه:</span>
                  <span className="font-bold text-amber-700 font-mono">{selfRatings.selfCompassion} / ۱۰</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={selfRatings.selfCompassion}
                  onChange={e => setSelfRatings({ ...selfRatings, selfCompassion: parseFloat(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-600">اصالت و حضور درمانی (Therapeutic Presence):</span>
                  <span className="font-bold text-emerald-700 font-mono">{selfRatings.therapeuticPresence} / ۱۰</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={selfRatings.therapeuticPresence}
                  onChange={e => setSelfRatings({ ...selfRatings, therapeuticPresence: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* AI Supervisory Echo Trigger */}
          <div className="bg-gradient-to-r from-indigo-50 to-teal-50 p-4 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>پژواک بینش‌بخش سوپروایزر هوشمند (AI Reflective Echo)</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                مبتنی بر مدل اگزیستانسیل-انسانی یالوم برای تحلیل انتقال متقابل و تقویت شفقت به خود
              </p>
            </div>

            <button
              type="button"
              id="btn-trigger-ai-reflection"
              onClick={handleRequestAIInsight}
              disabled={isLoadingAIInsight}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              {isLoadingAIInsight ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال نگارش بینش...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>دریافت بینش و همدلی سوپروایزر</span>
                </>
              )}
            </button>
          </div>

          {/* Render Active AI Insight in Form if Available */}
          {tempAIInsight && (
            <div className="bg-gradient-to-br from-indigo-900 to-teal-900 text-white p-4 rounded-2xl shadow-sm space-y-2 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between text-teal-200 font-bold border-b border-white/20 pb-1.5">
                <span>پژواک صادرشده:</span>
                <span className="text-[10px] text-amber-300 font-normal">آماده ذخیره همراه با یادداشت</span>
              </div>
              <p className="text-amber-100 leading-relaxed font-medium">«{tempAIInsight.empathyForStudent}»</p>
              <p className="text-stone-200 text-[11px]"><strong className="text-teal-200">تحلیل انتقال متقابل: </strong>{tempAIInsight.countertransferenceInsight}</p>
              <div className="bg-black/20 p-2 rounded-lg text-[11px] text-stone-200">
                <strong className="text-emerald-300 block mb-0.5">توصیه خودشفقت‌ورزی: </strong>
                {tempAIInsight.mindfulSelfCareTip}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              برچسب‌ها (با کاما یا ویرگول جدا کنید):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="مثال: انتقال متقابل، کمال‌گرایی، اضطراب مراجع، سکوت درمانی"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-stone-800"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setSubTab('entries')}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              id="btn-save-journal-entry"
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ذخیره در ژورنال تأملی</span>
            </button>
          </div>

        </form>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: DUAL GROWTH ANALYTICS (PERSONAL VS CLINICAL) */}
      {/* ========================================================= */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Concept Overview Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    ماتریس رشد دوگانه: شایستگی بالینی در کنار بلوغ درونی درمانگر
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    مدل چرخه یادگیری کلینیکی کولب
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  پژوهش‌های آموزش بالینی نشان می‌دهد کارورزانی که مهارت‌های فنی را همزمان با واکاوی انتقال متقابل و شفقت به خود ثبت می‌کنند، ۳۸٪ کمتر دچار فرسودگی و ۲.۵ برابر در اتحاد درمانی (Alliance) موفق‌ترند.
                </p>
              </div>
            </div>

            {/* Dual Comparison Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>مهارت فنی و استاندارد CTRS:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-700">{averageClinicalScore} از ۱۰۰</span>
                </div>
                <div className="w-full h-3 bg-indigo-200/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                    style={{ width: `${averageClinicalScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  حاصل نمرات مقیاس صلاحیت درمانگری شناختی، خلوص فنون، فرمولاسیون زیستی-روانی و هدایت جلسه در شبیه‌سازی.
                </p>
              </div>

              <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <BookHeart className="w-4 h-4 text-teal-600" />
                    <span>بلوغ روانی، خودشفقت‌ورزی و حضور اصیل:</span>
                  </span>
                  <span className="font-mono font-bold text-teal-700">{analyticsSummary.overallInnerGrowthScore} از ۱۰۰</span>
                </div>
                <div className="w-full h-3 bg-teal-200/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-600 transition-all duration-500 rounded-full"
                    style={{ width: `${analyticsSummary.overallInnerGrowthScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  حاصل خودسنجی‌های ۴گانه در ژورنال، پذیرش اشتباهات، مدیریت احساس نجات‌بخشی و هوشیاری به تله‌های انتقال متقابل.
                </p>
              </div>

            </div>
          </div>

          {/* 4 Pillars of Inner Growth Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[11px] text-stone-500 font-medium">اعتمادبه‌نفس بالینی</span>
              <div className="text-2xl font-bold font-mono text-indigo-700">
                {analyticsSummary.avgConfidence} <span className="text-xs font-normal text-stone-400">/۱۰</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                میزان احساس توانمندی و عدم دستپاچگی در هنگام مواجهه با بحران یا سکوت مراجع.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[11px] text-stone-500 font-medium">ثبات و لنگرگاه هیجانی</span>
              <div className="text-2xl font-bold font-mono text-teal-700">
                {analyticsSummary.avgGroundedness} <span className="text-xs font-normal text-stone-400">/۱۰</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                حفظ تعادل عاطفی و جلوگیری از غرق شدن در اضطراب‌ها و نوسانات احساسی مراجع.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[11px] text-stone-500 font-medium">شفقت به خود در نقص‌ها</span>
              <div className="text-2xl font-bold font-mono text-amber-700">
                {analyticsSummary.avgSelfCompassion} <span className="text-xs font-normal text-stone-400">/۱۰</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                مهربانی با خود هنگام ارتکاب خطای بالینی و رهایی از خودسرزنش‌گری کمال‌گرایانه.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[11px] text-stone-500 font-medium">حضور درمانی اصیل</span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {analyticsSummary.avgPresence} <span className="text-xs font-normal text-stone-400">/۱۰</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                توانایی همراهی همدلانه در «اینجا و اکنون» بدون پناه بردن زودهنگام به نظریه و تکنیک.
              </p>
            </div>

          </div>

          {/* Action Callout for next steps */}
          <div className="bg-stone-900 text-white p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <h3 className="font-bold text-sm sm:text-base text-teal-300">
                آماده‌اید آموخته‌های خودآگاهی را در عمل بیازمایید؟
              </h3>
              <p className="text-xs text-stone-300">
                در جلسه شبیه‌سازی بعدی، تعهدات ثبت‌شده در ژورنال خود را با مراجع مجازی تمرین کنید.
              </p>
            </div>

            <button
              onClick={() => {
                if (onNavigateToSimulator) onNavigateToSimulator();
              }}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              شروع جلسه شبیه‌سازی درمانی
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
