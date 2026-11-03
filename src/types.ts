export type ClinicalDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TherapeuticApproach = 'CBT' | 'Psychodynamic' | 'ACT' | 'SchemaTherapy' | 'PersonCentered';

export interface ClinicalCase {
  id: string;
  title: string;
  patientName: string;
  age: number;
  gender: 'female' | 'male';
  occupation: string;
  maritalStatus: string;
  avatarColor: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  dsmDiagnosis: string;
  coreSchemas: string[];
  defenseMechanisms: string[];
  personalityTraits: string[];
  difficulty: ClinicalDifficulty;
  recommendedApproach: TherapeuticApproach;
  suggestedQuestions: string[];
  initialAnxiety: number;
  initialRapport: number;
  symptoms?: string[];
  keyChallenges?: string[];
  learningObjectives?: string[];
  isCustom?: boolean;
}

export interface ClientState {
  anxiety: number; // 0 - 100
  rapport: number; // 0 - 100
  openness: number; // 0 - 100
  resistance: number; // 0 - 100
  currentDefense: string;
}

export interface MultiApproachAlternatives {
  cbt: string; // رویکرد شناختی-رفتاری
  act: string; // رویکرد پذیرش و تعهد / ذهن‌آگاهی
  relational: string; // رویکرد رابطه‌ای و هیجان‌مدار
}

export interface CarkhuffEmpathyEvaluation {
  level: 1 | 2 | 3 | 4 | 5;
  levelLabel: string; // e.g. 'سطح ۴: همدلی افزاینده (Additive Empathy)'
  carkhuffDefinition: string; // Scientific definition according to Carkhuff (1969)
  clinicalRationale: string; // Specific rationale for this therapist utterance
}

export interface LinehanValidationEvaluation {
  level: 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';
  levelLabel: string; // e.g. 'سطح V5: اعتبارسنجی بهنجار در شرایط حاضر (Normative Human Response)'
  scientificDescription: string;
  identifiedEvidence: string;
}

export interface WorkingAllianceTriad {
  bondScore: number; // 1-10 (Bordin: Emotional bond & mutual trust)
  taskAgreementScore: number; // 1-10 (Bordin: Agreement on therapeutic tasks)
  goalAgreementScore: number; // 1-10 (Bordin: Clarity and alignment on goals)
  ruptureState: 'none' | 'withdrawal_detected' | 'confrontation_detected' | 'repair_attempt' | 'successful_repair';
  ruptureAnalysis?: string; // Safran & Muran rupture marker or repair comment
}

export interface DeliberatePracticeGuide {
  coreMicroSkill: string; // e.g. 'انعکاس هیجان اولیه بدون طرح سوال'
  clinicalRationale: string; // Based on deliberate practice empirical literature (Rousmaniere, Wampold)
  immediateDrill: string; // Immediate micro-rehearsal prompt for the student
}

export interface FivePsFormulation {
  presentingProblem: string; // مشکل فعلی و نشانه‌های بارز (Presenting)
  predisposingFactors: string; // عوامل مستعدکننده زیستی، رشدی و آسیب‌پذیری‌های کهن (Predisposing)
  precipitatingFactors: string; // عوامل تسریع‌کننده و رویدادهای برانگیزاننده اخیر (Precipitating)
  perpetuatingFactors: string; // عوامل تداوم‌بخش، چرخه‌های معیوب شناختی-رفتاری و اجتناب‌ها (Perpetuating)
  protectiveFactors: string; // عوامل محافظت‌کننده، نقاط قوت، تاب‌آوری و منابع حمایتی (Protective)
}

export interface CtrsDetailedScores {
  agendaSetting?: number; // 0-6 or 0-100
  feedback?: number;
  understanding?: number;
  interpersonalEffectiveness?: number;
  collaboration?: number;
  pacing?: number;
  guidedDiscovery?: number;
  focusOnKeyCognitions?: number;
  strategyForChange?: number;
  techniqueApplication?: number;
  homework?: number;
}

export interface SupervisorFeedback {
  techniqueUsed: string;
  techniqueCategory?: string;
  empathyScore: number; // 1 - 10
  empathyStars?: number; // 1 - 5 stars
  validationScore?: number; // 1 - 10
  validationStars?: number; // 1 - 5 stars
  validationLevel?: 'عالی' | 'مناسب' | 'خنثی' | 'ناکافی' | 'ابطال‌کننده';
  empathyValidationInsight?: string;
  techniquePurityScore?: number; // 1 - 10
  allianceImpact: string;
  allianceDelta?: number; // -5 to +5
  depthLevel?: 'سطحی' | 'متوسط' | 'عمیق';
  clinicalComment: string;
  identifiedTrap: string;
  trapSeverity?: 'low' | 'medium' | 'high' | 'none';
  suggestedAlternative: string;
  multiApproachAlternatives?: MultiApproachAlternatives;
  instantClinicalNudge?: string;
  recommendedNextStep: string;
  // Scientific extensions:
  carkhuffEvaluation?: CarkhuffEmpathyEvaluation;
  linehanValidation?: LinehanValidationEvaluation;
  workingAllianceTriad?: WorkingAllianceTriad;
  deliberatePracticeGuide?: DeliberatePracticeGuide;
  countertransferenceMarker?: string;
}

export interface SimulationMessage {
  id: string;
  role: 'therapist' | 'patient' | 'system';
  content: string;
  timestamp: string;
  internalThought?: string;
  nonVerbalCue?: string;
  stateSnapshot?: ClientState;
  supervisorFeedback?: SupervisorFeedback;
}

export interface BiopsychosocialFormulation {
  biological: string;
  psychological: string;
  social: string;
}

export interface KeyTurningPoint {
  moment: string;
  impact: string;
  supervisorAnalysis: string;
}

export interface CompetencyScores {
  empathy: number;
  therapeuticAlliance: number;
  guidedDiscovery: number;
  sessionStructuring: number;
  resistanceManagement: number;
  interventionsPurity: number;
}

export interface TechniqueStat {
  technique: string;
  count: number;
  percentage: number;
  qualityRating: number; // 1 - 10
}

export interface SkillImprovementItem {
  skill: string;
  status: 'نیاز به تمرین' | 'متوسط' | 'تسلط مطلوب';
  recommendedExercise: string;
}

export interface DeepEvaluationReport {
  overallScore: number;
  clinicalGrade: string;
  executiveSummary: string;
  competencyScores: CompetencyScores;
  biopsychosocialFormulation: BiopsychosocialFormulation;
  fivePsFormulation?: FivePsFormulation;
  ctrsDetailedScores?: CtrsDetailedScores;
  allianceRuptureRepairAnalysis?: string;
  keyTurningPoints: KeyTurningPoint[];
  trapsAndMissedOpportunities: string[];
  recommendationsForNextSession: string[];
  suggestedHomeworkForClient: string;
  techniqueDistribution?: TechniqueStat[];
  skillImprovementRoadmap?: SkillImprovementItem[];
  studentReflectionQuestion?: string;
  studentSelfRating?: number;
  calibrationInsight?: string;
}

export interface SavedSession {
  id: string;
  userId: string;
  userEmail?: string;
  caseId: string;
  caseTitle: string;
  patientName: string;
  dsmDiagnosis: string;
  createdAt: string;
  durationSeconds: number;
  messageCount: number;
  finalScore: number;
  clinicalGrade: string;
  messages: SimulationMessage[];
  evaluationReport?: DeepEvaluationReport;
  clinicalNotes?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export type InterventionCategory = 'reflection' | 'clarification' | 'confrontation' | 'validation' | 'socratic';

export interface ClinicalInterventionOption {
  id: string;
  category: InterventionCategory;
  categoryLabel: string; // e.g. "بازتاب احساس (Feeling Reflection)"
  shortCategory: string; // e.g. "بازتاب احساس"
  therapeuticSchool: string; // e.g. "مراجع‌محور و هیجان‌مدار (EFT)"
  clinicalObjective: string; // e.g. "کاهش تنیدگی هیجانی و نام‌گذاری احساسات ناگفته در لحظه سکوت"
  suggestedPhrasing: string; // Ready-to-use therapist utterance
  rationale: string; // Why this works during silence/helplessness
  watchOutWarning: string; // Supervisor cautionary note
  expectedAllianceImpact: string; // e.g. "+۲ (تقویت امنیت رابطه)"
}

export interface InterventionSuggesterResult {
  triggerDetected: 'silence' | 'helplessness' | 'resistance' | 'general';
  triggerTitle: string;
  triggerDescription: string;
  interventions: ClinicalInterventionOption[];
}

// Persona and Tone Customization Types
export type PersonaPresetId = 
  | 'standard' 
  | 'guarded_defensive' 
  | 'candid_expressive' 
  | 'skeptical_challenging' 
  | 'withdrawn_passive' 
  | 'intellectualizing' 
  | 'custom';

export type PersonaToneStyle = 
  | 'balanced_natural' 
  | 'hesitant_guarded' 
  | 'direct_blunt' 
  | 'sarcastic_defensive' 
  | 'resigned_hopeless' 
  | 'clinical_analytical';

export interface PatientPersonaConfig {
  presetId: PersonaPresetId;
  name: string;
  shortLabel: string;
  description: string;
  candorLevel: number; // 0 - 100 (میزان صراحت و خودافشاگری)
  defensivenessLevel: number; // 0 - 100 (میزان دفاعی بودن و مقاومت روانی)
  toneStyle: PersonaToneStyle;
  toneStyleLabel: string;
  behavioralGuidance: string;
  initialGreetingModifier?: string;
}

// Psychology Glossary Types
export interface PsychologyGlossaryItem {
  id: string;
  termFa: string;
  termEn: string;
  category: 'روان‌پویشی و دفاع‌ها' | 'شناختی-رفتاری (CBT)' | 'پذیرش و تعهد (ACT)' | 'اصول مصاحبه و رابطه درمانی' | 'آسیب‌شناسی و DSM-5' | 'رفتاردرمانی دیالکتیکی (DBT)' | 'عمومی و علوم اعصاب';
  definition: string;
  clinicalExample: string;
  therapeuticApplication: string;
  relatedTerms?: string[];
  dsmReference?: string;
  tags?: string[];
}

// Reflective Journal Types
export type ReflectiveMoodType = 
  | 'confident' 
  | 'reflective' 
  | 'vulnerable' 
  | 'anxious' 
  | 'inspired' 
  | 'fatigued'
  | 'empathetic';

export interface ReflectiveJournalRatings {
  personalConfidence: number; // 1 - 10
  emotionalGroundedness: number; // 1 - 10
  selfCompassion: number; // 1 - 10
  therapeuticPresence: number; // 1 - 10
}

export interface AIReflectiveInsight {
  empathyForStudent: string;
  countertransferenceInsight: string;
  growthPrompt: string;
  mindfulSelfCareTip: string;
  clinicalResonanceNote?: string;
}

export interface ReflectiveJournalEntry {
  id: string;
  userId: string;
  userEmail?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
  sessionId?: string; // Optional link to a SavedSession
  caseId?: string;
  caseTitle?: string;
  patientName?: string;
  dsmDiagnosis?: string;
  
  title: string;
  overallMood: ReflectiveMoodType;
  moodLabel: string;
  
  // Core Reflective Dimensions
  innerEmotionalState: string; // احساسات درونی من حین جلسه
  countertransferenceAwareness: string; // انتقال متقابل، محرک‌ها و تله‌های نجات‌گری
  momentsOfBreakthrough: string; // نقاط پیوند عمیق انسانی و گره‌گشایی
  momentsOfStruggle: string; // لحظات استیصال، دفاع یا احساس ناکارآمدی
  personalGrowthLesson: string; // درس این جلسه برای رشد شخصی و هویت درمانگر
  nextSessionCommitment: string; // تعهد عملی من برای جلسه بعد
  
  // Quantitative Self-Metrics (1 to 10)
  selfRatings: ReflectiveJournalRatings;
  
  // AI Supervisory Resonance
  aiReflectiveInsight?: AIReflectiveInsight;
  
  tags?: string[];
}


