/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { LiveSessionSimulator } from './components/LiveSessionSimulator';

// Lazy-loaded secondary views and heavy modals for minimal initial JS payload
const CaseLibrary = lazy(() => import('./components/CaseLibrary').then(m => ({ default: m.CaseLibrary })));
const DeepEvaluationModal = lazy(() => import('./components/DeepEvaluationModal').then(m => ({ default: m.DeepEvaluationModal })));
const EvidenceLab = lazy(() => import('./components/EvidenceLab').then(m => ({ default: m.EvidenceLab })));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const CaseCreatorModal = lazy(() => import('./components/CaseCreatorModal').then(m => ({ default: m.CaseCreatorModal })));
const ReflectiveJournal = lazy(() => import('./components/ReflectiveJournal').then(m => ({ default: m.ReflectiveJournal })));

import { DEFAULT_CLINICAL_CASES } from './data/defaultCases';
import { DEFAULT_REFLECTIVE_JOURNALS } from './data/defaultJournals';
import type { 
  ClinicalCase, 
  SimulationMessage, 
  ClientState, 
  SupervisorFeedback, 
  DeepEvaluationReport, 
  SavedSession,
  PatientPersonaConfig,
  ReflectiveJournalEntry
} from './types';
import { getDefaultPersonaForCase, createInitialGreeting } from './utils/personaPresets';

import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  saveSessionToFirestore, 
  getUserSessionsFromFirestore, 
  saveCustomCaseToFirestore, 
  getUserCustomCases,
  saveJournalEntryToFirestore,
  getUserJournalEntriesFromFirestore,
  deleteJournalEntryFromFirestore
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Sparkles, Brain, Award, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'library' | 'evidence' | 'progress' | 'journal'>('simulator');

  // Cases state
  const [cases, setCases] = useState<ClinicalCase[]>(DEFAULT_CLINICAL_CASES);
  const [currentCase, setCurrentCase] = useState<ClinicalCase>(() => {
    try {
      const savedCaseId = localStorage.getItem('psychosim_active_case_id');
      if (savedCaseId) {
        const found = DEFAULT_CLINICAL_CASES.find(c => c.id === savedCaseId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Could not restore active case from storage:', e);
    }
    return DEFAULT_CLINICAL_CASES[0];
  });
  const [currentPersona, setCurrentPersona] = useState<PatientPersonaConfig>(() => getDefaultPersonaForCase(DEFAULT_CLINICAL_CASES[0]));
  const [isCaseCreatorOpen, setIsCaseCreatorOpen] = useState(false);

  // Live session state
  const [messages, setMessages] = useState<SimulationMessage[]>([
    {
      id: 'init-msg-1',
      role: 'patient',
      content: 'سلام دکتر... راستش خیلی سخت بود برام که امروز بیام اینجا... [با انگشتانش بازی می‌کند و مضطرب به اطراف نگاه می‌کند] راستش احساس می‌کنم دارم عقلم رو از دست می‌دم...',
      timestamp: '00:01',
      internalThought: 'آیا این درمانگر منو درک می‌کنه یا فکر می‌کنه من دیوونه‌ام؟ نکنه من رو قضاوت کنه...',
      nonVerbalCue: 'لرزش خفیف صدا، بی‌قراری حرکتی در دست‌ها',
      stateSnapshot: {
        anxiety: DEFAULT_CLINICAL_CASES[0].initialAnxiety,
        rapport: DEFAULT_CLINICAL_CASES[0].initialRapport,
        openness: 40,
        resistance: 45,
        currentDefense: 'فاجعه‌سازی و اجتناب',
      },
    },
  ]);

  const [clientState, setClientState] = useState<ClientState>({
    anxiety: DEFAULT_CLINICAL_CASES[0].initialAnxiety,
    rapport: DEFAULT_CLINICAL_CASES[0].initialRapport,
    openness: 40,
    resistance: 45,
    currentDefense: 'فاجعه‌سازی و اجتناب',
  });

  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [isLoadingSupervisor, setIsLoadingSupervisor] = useState(false);
  const [latestSupervisorFeedback, setLatestSupervisorFeedback] = useState<SupervisorFeedback | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Deep Evaluation Modal state
  const [activeEvaluationReport, setActiveEvaluationReport] = useState<DeepEvaluationReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [activeReportDuration, setActiveReportDuration] = useState(15);
  const [activeReportMessageCount, setActiveReportMessageCount] = useState(0);
  const [activeReportMessages, setActiveReportMessages] = useState<SimulationMessage[]>([]);

  // Clinical Notes with Auto-Save persistence on page reload / refresh
  const [clinicalNotes, setClinicalNotes] = useState<string>(() => {
    try {
      const activeId = localStorage.getItem('psychosim_active_case_id') || DEFAULT_CLINICAL_CASES[0].id;
      const savedCaseNotes = localStorage.getItem(`psychosim_notes_${activeId}`);
      if (savedCaseNotes !== null && savedCaseNotes !== undefined) {
        return savedCaseNotes;
      }
      const fallback = localStorage.getItem('psychosim_active_clinical_notes');
      return fallback || '';
    } catch (e) {
      console.warn('Could not restore clinical notes from localStorage:', e);
      return '';
    }
  });
  const [activeReportNotes, setActiveReportNotes] = useState<string>('');

  // Auto-Save clinicalNotes to localStorage upon any change
  useEffect(() => {
    try {
      if (currentCase?.id) {
        localStorage.setItem(`psychosim_notes_${currentCase.id}`, clinicalNotes);
        localStorage.setItem('psychosim_active_case_id', currentCase.id);
      }
      localStorage.setItem('psychosim_active_clinical_notes', clinicalNotes);
      localStorage.setItem('psychosim_notes_last_saved_time', new Date().toISOString());
    } catch (e) {
      console.warn('Auto-save clinical notes error:', e);
    }
  }, [clinicalNotes, currentCase?.id]);

  // Historical sessions state
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Reflective Journal state
  const [journalEntries, setJournalEntries] = useState<ReflectiveJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('psychosim_journals_guest');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading guest journals:', e);
    }
    return DEFAULT_REFLECTIVE_JOURNALS;
  });
  const [prefillJournalSession, setPrefillJournalSession] = useState<SavedSession | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user saved sessions and custom cases
        const userSessions = await getUserSessionsFromFirestore(user.uid);
        setSavedSessions(userSessions);

        const customCases = await getUserCustomCases(user.uid);
        if (customCases.length > 0) {
          setCases([...DEFAULT_CLINICAL_CASES, ...customCases]);
        }

        const userJournals = await getUserJournalEntriesFromFirestore(user.uid);
        if (userJournals.length > 0) {
          setJournalEntries(userJournals);
        } else {
          setJournalEntries(DEFAULT_REFLECTIVE_JOURNALS);
        }
      } else {
        // Load from local storage for guest
        const local = localStorage.getItem('psychosim_sessions_guest');
        if (local) {
          try {
            setSavedSessions(JSON.parse(local));
          } catch {}
        }
        try {
          const guestJournalsLocal = localStorage.getItem('psychosim_journals_guest');
          if (guestJournalsLocal) {
            const parsed = JSON.parse(guestJournalsLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setJournalEntries(parsed);
            } else {
              setJournalEntries(DEFAULT_REFLECTIVE_JOURNALS);
            }
          } else {
            setJournalEntries(DEFAULT_REFLECTIVE_JOURNALS);
          }
        } catch {
          setJournalEntries(DEFAULT_REFLECTIVE_JOURNALS);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Journal Entry Handlers
  const handleSaveJournalEntry = async (entry: ReflectiveJournalEntry) => {
    await saveJournalEntryToFirestore(entry);
    setJournalEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteJournalEntry = async (id: string) => {
    const uid = currentUser?.uid || 'guest';
    await deleteJournalEntryFromFirestore(uid, id);
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleReflectOnSession = (session?: SavedSession) => {
    if (session) {
      setPrefillJournalSession(session);
    } else {
      setPrefillJournalSession(null);
    }
    setActiveTab('journal');
  };

  // Format current minutes:seconds
  const getElapsedTimestamp = useCallback(() => {
    const elapsedSecs = Math.floor((Date.now() - sessionStartTime) / 1000);
    const mins = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
    const secs = String(elapsedSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }, [sessionStartTime]);

  // Select a new case and initialize simulation with persona
  const handleSelectCase = (selected: ClinicalCase, personaConfig?: PatientPersonaConfig) => {
    const activePersona = personaConfig || getDefaultPersonaForCase(selected);
    setCurrentCase(selected);
    setCurrentPersona(activePersona);
    setSessionStartTime(Date.now());

    // Generate context-aware opening message guided by selected persona tone & candor
    const opening = createInitialGreeting(selected, activePersona);
    
    const initialMsg: SimulationMessage = {
      id: `init-${Date.now()}`,
      role: 'patient',
      content: opening.speech,
      timestamp: '00:01',
      internalThought: opening.internalThought,
      nonVerbalCue: opening.nonVerbalCue,
      stateSnapshot: {
        anxiety: selected.initialAnxiety,
        rapport: selected.initialRapport,
        openness: activePersona.candorLevel,
        resistance: activePersona.defensivenessLevel,
        currentDefense: selected.defenseMechanisms[0] || 'اجتناب',
      },
    };

    setMessages([initialMsg]);
    setClientState({
      anxiety: selected.initialAnxiety,
      rapport: selected.initialRapport,
      openness: activePersona.candorLevel,
      resistance: activePersona.defensivenessLevel,
      currentDefense: selected.defenseMechanisms[0] || 'اجتناب',
    });
    setLatestSupervisorFeedback(null);
    try {
      localStorage.setItem('psychosim_active_case_id', selected.id);
      const savedForCase = localStorage.getItem(`psychosim_notes_${selected.id}`);
      setClinicalNotes(savedForCase ?? '');
    } catch (e) {
      setClinicalNotes('');
    }
    setActiveTab('simulator');
  };

  // Reset current session
  const handleResetSession = () => {
    if (window.confirm('آیا مایلید این جلسه را از ابتدا آغاز کنید؟ تمام پیام‌های این جلسه پاک خواهند شد.')) {
      handleSelectCase(currentCase, currentPersona);
    }
  };

  // Send therapist message
  const handleSendMessage = async (text: string) => {
    const therapistMsgId = `therapist-${Date.now()}`;
    const timestamp = getElapsedTimestamp();

    const previousPatientMsg = [...messages].reverse().find(m => m.role === 'patient')?.content || '';

    const newTherapistMsg: SimulationMessage = {
      id: therapistMsgId,
      role: 'therapist',
      content: text,
      timestamp,
    };

    // Update message stream immediately
    const updatedMessages = [...messages, newTherapistMsg];
    setMessages(updatedMessages);

    setIsLoadingPatient(true);
    setIsLoadingSupervisor(true);

    try {
      // 1. Parallel trigger: Real-time Supervisor Micro-Evaluation (evidence-based clinical supervision)
      const supervisorPromise = fetch('/api/supervisor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistUtterance: text,
          patientPreviousUtterance: previousPatientMsg,
          caseProfile: currentCase,
          personaConfig: currentPersona,
          recentDialogue: updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      }).then(res => res.json());

      // 2. Virtual Patient Response (low latency gemini-3.1-flash-lite)
      const patientPromise = fetch('/api/chat-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseProfile: currentCase,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          clientState,
          difficulty: currentCase.difficulty,
          personaConfig: currentPersona,
        }),
      }).then(res => res.json());

      // Handle supervisor feedback as soon as it arrives
      supervisorPromise.then(supResult => {
        setIsLoadingSupervisor(false);
        if (supResult.success && supResult.data) {
          setLatestSupervisorFeedback(supResult.data);
          // Attach feedback to therapist message
          setMessages(prev => prev.map(m => m.id === therapistMsgId ? { ...m, supervisorFeedback: supResult.data } : m));
        }
      }).catch(err => {
        console.warn('Supervisor feedback error:', err);
        setIsLoadingSupervisor(false);
      });

      // Handle patient response
      const patientResult = await patientPromise;
      setIsLoadingPatient(false);

      if (patientResult.success && patientResult.data) {
        const pData = patientResult.data;
        const newClientState: ClientState = {
          anxiety: pData.updatedState?.anxiety ?? clientState.anxiety,
          rapport: pData.updatedState?.rapport ?? clientState.rapport,
          openness: pData.updatedState?.openness ?? clientState.openness,
          resistance: pData.updatedState?.resistance ?? clientState.resistance,
          currentDefense: pData.updatedState?.currentDefense || clientState.currentDefense,
        };

        setClientState(newClientState);

        const newPatientMsg: SimulationMessage = {
          id: `patient-${Date.now()}`,
          role: 'patient',
          content: pData.speech,
          timestamp: getElapsedTimestamp(),
          internalThought: pData.internalThought,
          nonVerbalCue: pData.nonVerbalCue,
          stateSnapshot: newClientState,
        };

        setMessages(prev => [...prev, newPatientMsg]);
      }
    } catch (error) {
      console.error('Session interaction error:', error);
      setIsLoadingPatient(false);
      setIsLoadingSupervisor(false);
    }
  };

  // End Session & In-Depth Clinical Evaluation (High Thinking gemini-3.1-pro-preview)
  const handleEndSession = async () => {
    if (messages.length <= 1) {
      alert('لطفاً قبل از درخواست ارزیابی سوپروایزر، حداقل چند تبادل بالینی با مراجع داشته باشید.');
      return;
    }

    setIsEvaluating(true);
    const durationSecs = Math.max(60, Math.floor((Date.now() - sessionStartTime) / 1000));
    const durationMins = Math.max(1, Math.round(durationSecs / 60));

    try {
      const response = await fetch('/api/deep-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseProfile: currentCase,
          transcript: messages.map(m => ({
            sender: m.role,
            text: m.content,
          })),
          durationMinutes: durationMins,
          clinicalNotes: clinicalNotes.trim(),
        }),
      });

      const result = await response.json();
      setIsEvaluating(false);

      if (result.success && result.data) {
        const report: DeepEvaluationReport = result.data;
        setActiveEvaluationReport(report);
        setActiveReportDuration(durationSecs);
        setActiveReportMessageCount(messages.length);
        setActiveReportNotes(clinicalNotes.trim());
        setActiveReportMessages([...messages]);
        setIsReportSaved(false);

        // Auto-save to Firestore / local portfolio
        const sessionRecord: SavedSession = {
          id: `session-${Date.now()}`,
          userId: currentUser?.uid || 'guest',
          userEmail: currentUser?.email || 'guest@psychosim.local',
          caseId: currentCase.id,
          caseTitle: currentCase.title,
          patientName: currentCase.patientName,
          dsmDiagnosis: currentCase.dsmDiagnosis,
          createdAt: new Date().toISOString(),
          durationSeconds: durationSecs,
          messageCount: messages.length,
          finalScore: report.overallScore,
          clinicalGrade: report.clinicalGrade,
          messages,
          evaluationReport: report,
          clinicalNotes: clinicalNotes.trim(),
        };

        await saveSessionToFirestore(sessionRecord);
        setSavedSessions(prev => [sessionRecord, ...prev]);
        setIsReportSaved(true);
      } else {
        alert('خطا در صدور کارنامه هوشمند: ' + (result.error || 'خطای ناشناخته'));
      }
    } catch (err: any) {
      console.error('Deep evaluation error:', err);
      setIsEvaluating(false);
      alert('خطا در برقراری ارتباط با مدل ارزیابی تفکر عمیق: ' + err.message);
    }
  };

  // Custom case creation handler
  const handleSaveCustomCase = async (newCase: ClinicalCase) => {
    const userId = currentUser?.uid || 'guest';
    await saveCustomCaseToFirestore(userId, newCase);
    setCases(prev => [newCase, ...prev]);
    handleSelectCase(newCase);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-100 flex flex-col font-['Vazirmatn',sans-serif] selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginGoogle={loginWithGoogle}
        onLoginGuest={loginAsGuest}
        onLogout={logoutUser}
        onOpenCaseCreator={() => setIsCaseCreatorOpen(true)}
        hasActiveSession={messages.length > 1}
        activeCaseTitle={currentCase.patientName}
      />

      {/* Main View Router */}
      <main className={`flex-1 flex flex-col min-h-0 ${activeTab === 'simulator' ? '' : 'pb-16 pb-safe md:pb-8'}`}>
        <Suspense
          fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[360px] text-stone-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-medium text-stone-500">در حال فراخوانی بخش بالینی...</span>
            </div>
          }
        >
          {activeTab === 'simulator' && (
            <LiveSessionSimulator
              currentCase={currentCase}
              messages={messages}
              clientState={clientState}
              currentPersona={currentPersona}
              onUpdatePersona={setCurrentPersona}
              onSendMessage={handleSendMessage}
              onEndSession={handleEndSession}
              isLoadingPatient={isLoadingPatient}
              isLoadingSupervisor={isLoadingSupervisor}
              latestSupervisorFeedback={latestSupervisorFeedback}
              onResetSession={handleResetSession}
              onChangeCase={() => setActiveTab('library')}
              clinicalNotes={clinicalNotes}
              setClinicalNotes={setClinicalNotes}
            />
          )}

          {activeTab === 'library' && (
            <CaseLibrary
              cases={cases}
              onSelectCase={handleSelectCase}
              onOpenCaseCreator={() => setIsCaseCreatorOpen(true)}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceLab />
          )}

          {activeTab === 'progress' && (
            <ProgressDashboard
              sessions={savedSessions}
              onOpenReport={(report, s) => {
                setActiveEvaluationReport(report);
                setActiveReportDuration(s.durationSeconds);
                setActiveReportMessageCount(s.messageCount);
                setActiveReportNotes(s.clinicalNotes || '');
                setActiveReportMessages(s.messages || []);
                setIsReportSaved(true);
              }}
              onStartNewSession={() => setActiveTab('library')}
              onOpenReflectiveJournal={handleReflectOnSession}
            />
          )}

          {activeTab === 'journal' && (
            <ReflectiveJournal
              entries={journalEntries}
              onSaveEntry={handleSaveJournalEntry}
              onDeleteEntry={handleDeleteJournalEntry}
              cases={cases}
              savedSessions={savedSessions}
              activeCase={currentCase}
              currentUserId={currentUser?.uid || 'guest'}
              currentUserEmail={currentUser?.email || 'guest@psychosim.local'}
              onNavigateToSimulator={() => setActiveTab('simulator')}
              prefillFromSession={prefillJournalSession}
            />
          )}
        </Suspense>
      </main>

      {/* In-Depth Evaluation Loading Backdrop */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-stone-200">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <Brain className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              سوپروایزر در حال تحلیل عمیق جلسه بالینی...
            </h3>
            <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <p>
                مدل <span className="font-mono font-bold text-indigo-600">Gemini 3.1 Pro</span> با حالت تفکر عمیق بالینی (<span className="font-mono">ThinkingLevel: HIGH</span>) در حال ارزیابی:
              </p>
              <ul className="text-stone-500 text-[11px] list-disc list-inside text-right space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <li>نمره‌دهی مقیاس شایستگی CTRS</li>
                <li>فرمولاسیون زیستی-روانی-اجتماعی</li>
                <li>ردیابی تعارضات و نقاط عطف درمانی</li>
                <li>سنجش خلوص مداخله و دام‌های بالینی</li>
              </ul>
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {/* Deep Evaluation Dossier Modal */}
        {activeEvaluationReport && (
          <DeepEvaluationModal
            report={activeEvaluationReport}
            currentCase={currentCase}
            sessionDuration={activeReportDuration}
            messageCount={activeReportMessageCount}
            messages={activeReportMessages.length > 0 ? activeReportMessages : messages}
            onClose={() => setActiveEvaluationReport(null)}
            onSaveToPortfolio={() => setIsReportSaved(true)}
            isSaved={isReportSaved}
            clinicalNotes={activeReportNotes}
            defaultStudentName={currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'کارورز روان‌شناسی بالینی')}
            onOpenReflectiveJournal={() => {
              const foundSession = savedSessions.find(s => s.caseId === currentCase.id);
              setActiveEvaluationReport(null);
              handleReflectOnSession(foundSession || undefined);
            }}
          />
        )}

        {/* Custom Case Creator Modal */}
        {isCaseCreatorOpen && (
          <CaseCreatorModal
            isOpen={isCaseCreatorOpen}
            onClose={() => setIsCaseCreatorOpen(false)}
            onSaveCase={handleSaveCustomCase}
          />
        )}
      </Suspense>

    </div>
  );
}
