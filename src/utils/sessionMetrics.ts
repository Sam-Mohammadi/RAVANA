import type { SimulationMessage, ClientState, ClinicalCase } from '../types';

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

export interface SessionMetricsStats {
  startAnxiety: number;
  currentAnxiety: number;
  anxietyDelta: number;
  startRapport: number;
  currentRapport: number;
  rapportDelta: number;
  peakAnxiety: number;
  peakAnxietyTurn: number;
  lowestAnxiety: number;
  lowestAnxietyTurn: number;
  startOpenness: number;
  currentOpenness: number;
  opennessDelta: number;
  startResistance: number;
  currentResistance: number;
  resistanceDelta: number;
  totalTurns: number;
  clinicalInterpretation: string;
}

/**
 * Compiles chronological trajectory data points from session message history
 */
export function extractSessionMetricPoints(
  messages: SimulationMessage[],
  clientState?: ClientState,
  currentCase?: ClinicalCase
): SessionMetricPoint[] {
  const points: SessionMetricPoint[] = [];
  const initialAnxiety = currentCase?.initialAnxiety ?? 70;
  const initialRapport = currentCase?.initialRapport ?? 30;

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
    patientExcerpt: firstMsg
      ? firstMsg.content.slice(0, 45) + (firstMsg.content.length > 45 ? '...' : '')
      : 'آغاز ارزیابی بالینی',
    therapistTechnique: undefined,
  });

  // 2. Track patient responses throughout dialogue
  let turnCount = 0;
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'patient') {
      turnCount++;
      const precedingTherapistMsg = messages
        .slice(0, i)
        .reverse()
        .find((m) => m.role === 'therapist');

      const prevPoint = points[points.length - 1];
      points.push({
        turnIndex: turnCount,
        label: `نوبت ${turnCount}`,
        timestamp: msg.timestamp || `۰${turnCount}:۰۰`,
        anxiety: msg.stateSnapshot?.anxiety ?? prevPoint.anxiety,
        rapport: msg.stateSnapshot?.rapport ?? prevPoint.rapport,
        openness: msg.stateSnapshot?.openness ?? prevPoint.openness,
        resistance: msg.stateSnapshot?.resistance ?? prevPoint.resistance,
        patientExcerpt: msg.content
          ? msg.content.slice(0, 45) + (msg.content.length > 45 ? '...' : '')
          : '',
        therapistTechnique: precedingTherapistMsg?.supervisorFeedback?.techniqueUsed,
      });
    }
  }

  // 3. Match latest live state if provided
  if (clientState && points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (
      lastPoint.anxiety !== clientState.anxiety ||
      lastPoint.rapport !== clientState.rapport
    ) {
      lastPoint.anxiety = clientState.anxiety;
      lastPoint.rapport = clientState.rapport;
      lastPoint.openness = clientState.openness;
      lastPoint.resistance = clientState.resistance;
    }
    lastPoint.isLatest = true;
  }

  return points;
}

/**
 * Computes descriptive statistics and clinical trajectory interpretation
 */
export function calculateSessionMetricsStats(
  points: SessionMetricPoint[],
  fallbackState?: ClientState
): SessionMetricsStats {
  if (points.length === 0) {
    const anx = fallbackState?.anxiety ?? 70;
    const rap = fallbackState?.rapport ?? 30;
    const opn = fallbackState?.openness ?? 40;
    const res = fallbackState?.resistance ?? 50;
    return {
      startAnxiety: anx,
      currentAnxiety: anx,
      anxietyDelta: 0,
      startRapport: rap,
      currentRapport: rap,
      rapportDelta: 0,
      peakAnxiety: anx,
      peakAnxietyTurn: 0,
      lowestAnxiety: anx,
      lowestAnxietyTurn: 0,
      startOpenness: opn,
      currentOpenness: opn,
      opennessDelta: 0,
      startResistance: res,
      currentResistance: res,
      resistanceDelta: 0,
      totalTurns: 0,
      clinicalInterpretation: 'نقطه شروع ارزیابی؛ هنوز تعاملی ثبت نشده است.',
    };
  }

  const first = points[0];
  const last = points[points.length - 1];

  let peakAnxiety = -Infinity;
  let peakAnxietyTurn = 0;
  let lowestAnxiety = Infinity;
  let lowestAnxietyTurn = 0;

  points.forEach((p) => {
    if (p.anxiety > peakAnxiety) {
      peakAnxiety = p.anxiety;
      peakAnxietyTurn = p.turnIndex;
    }
    if (p.anxiety < lowestAnxiety) {
      lowestAnxiety = p.anxiety;
      lowestAnxietyTurn = p.turnIndex;
    }
  });

  const anxietyDelta = last.anxiety - first.anxiety;
  const rapportDelta = last.rapport - first.rapport;
  const opennessDelta = last.openness - first.openness;
  const resistanceDelta = last.resistance - first.resistance;

  let clinicalInterpretation = '';
  if (points.length <= 1) {
    clinicalInterpretation = 'در انتظار پیشبرد دیالوگ؛ نقطه شروع ارزیابی ثبت شده است.';
  } else if (anxietyDelta <= -15 && rapportDelta >= 15) {
    clinicalInterpretation =
      'سیر درمانی ایده‌آل: کاهش معنادار اضطراب و تنش عاطفی مراجع همگام با تعمیق چشمگیر پیوند و اتحاد کاری درمانی.';
  } else if (anxietyDelta < 0 && rapportDelta > 0) {
    clinicalInterpretation =
      'جهت‌گیری مطلوب: مداخلات درمانگر منجر به تسکین نسبی اضطراب و ارتقای اعتماد و همکاری متقابل شده است.';
  } else if (anxietyDelta > 15 && rapportDelta < 0) {
    clinicalInterpretation =
      'هشدار بالینی: تشدید اضطراب و گسست در رابطه درمانی؛ ضرورت تمرکز بر اعتبارسنجی هیجانی، تعدیل سرعت و ترمیم پیوند.';
  } else if (anxietyDelta > 10) {
    clinicalInterpretation =
      'برانگیختگی هیجانی فعال: مراجع وارد محتوای حساس یا برانگیزاننده شده است؛ نیازمند فنون بازگشت به زمین (Grounding).';
  } else if (rapportDelta > 15) {
    clinicalInterpretation =
      'پیوند درمانی مستحکم: فضای امن روانی برقرار شده و بیمار آماده رویارویی با تعارضات ساخت‌یافته است.';
  } else if (last.anxiety > 75) {
    clinicalInterpretation =
      'اضطراب مراجع در محدوده بالینی حاد است؛ اولویت با بازتنظیم فیزیولوژیک و کاهش فشار شناختی است.';
  } else {
    clinicalInterpretation =
      'پایداری دینامیک: تعادل نسبی میان برانگیختگی هیجانی و حفظ رابطه کاری در طول جلسه برقرار است.';
  }

  return {
    startAnxiety: first.anxiety,
    currentAnxiety: last.anxiety,
    anxietyDelta,
    startRapport: first.rapport,
    currentRapport: last.rapport,
    rapportDelta,
    peakAnxiety,
    peakAnxietyTurn,
    lowestAnxiety,
    lowestAnxietyTurn,
    startOpenness: first.openness,
    currentOpenness: last.openness,
    opennessDelta,
    startResistance: first.resistance,
    currentResistance: last.resistance,
    resistanceDelta,
    totalTurns: points.length - 1,
    clinicalInterpretation,
  };
}
