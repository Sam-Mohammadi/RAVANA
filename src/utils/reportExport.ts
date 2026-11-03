import type { DeepEvaluationReport, ClinicalCase } from '../types';

export interface ReportExportData {
  report: DeepEvaluationReport;
  currentCase: ClinicalCase;
  sessionDuration: number;
  messageCount: number;
  clinicalNotes?: string;
  userReflection?: string;
  studentName?: string;
  studentId?: string;
  professorName?: string;
  sessionDate?: string;
}

export function generateClinicalReportText(data: ReportExportData): string {
  const {
    report,
    currentCase,
    sessionDuration,
    messageCount,
    clinicalNotes,
    userReflection,
    studentName = 'دانشجوی کارورزی روان‌شناسی بالینی',
    studentId = '',
    professorName = 'استاد راهنما / سوپروایزر بالینی',
    sessionDate = new Date().toLocaleDateString('fa-IR'),
  } = data;

  const durationMinutes = Math.floor(sessionDuration / 60);
  const durationSeconds = sessionDuration % 60;
  const durationStr = `${durationMinutes} دقیقه و ${durationSeconds} ثانیه`;

  const separator = '================================================================================';
  const subSeparator = '--------------------------------------------------------------------------------';

  let txt = '';

  txt += `${separator}\n`;
  txt += `       سامانه بالینی روانا (RAVĀNA) - شبیه‌ساز هوشمند آموزش و نظارت روان‌درمانی\n`;
  txt += `           گزارش رسمی جلسه کارورزی بالینی و نظارت سوپرویژن روان‌شناسی\n`;
  txt += `               (Ravāna Clinical Supervision & Practicum Report)\n`;
  txt += `${separator}\n\n`;

  txt += `تاریخ تنظیم گزارش: ${sessionDate}\n`;
  txt += `نام دانشجو / درمانگر کارورز: ${studentName}${studentId ? ` (شماره دانشجویی: ${studentId})` : ''}\n`;
  txt += `استاد راهنما / سوپروایزر بالینی: ${professorName}\n`;
  txt += `نوع مداخله و شبیه‌سازی: جلسه انفرادی ۵۰ دقیقه‌ای با هوش مصنوعی نظارتی\n\n`;

  txt += `${subSeparator}\n`;
  txt += `۱. مشخصات مراجع و اطلاعات پایه بالینی (Patient Profile)\n`;
  txt += `${subSeparator}\n`;
  txt += `• نام بیمار / مراجع: ${currentCase.patientName}\n`;
  txt += `• سن و جنسیت: ${currentCase.age} ساله\n`;
  txt += `• شغل: ${currentCase.occupation}\n`;
  txt += `• وضعیت تأهل: ${currentCase.maritalStatus}\n`;
  txt += `• تشخیص طبق DSM-5-TR: ${currentCase.dsmDiagnosis}\n`;
  txt += `• رویکرد درمانی پیشنهادی: ${currentCase.recommendedApproach}\n`;
  txt += `• شکایت اصلی مراجع (Chief Complaint):\n  «${currentCase.chiefComplaint}»\n`;
  txt += `• تاریخچه بیماری فعلی (HPI):\n  ${currentCase.historyOfPresentIllness}\n`;
  txt += `• مدت زمان جلسه: ${durationStr}\n`;
  txt += `• تعداد تبادلات پیام در جلسه: ${messageCount} پیام\n\n`;

  if (currentCase.symptoms && currentCase.symptoms.length > 0) {
    txt += `• نشانه‌ها و علائم بالینی مراجع:\n`;
    currentCase.symptoms.forEach((s) => {
      txt += `  - ${s}\n`;
    });
    txt += `\n`;
  }

  txt += `${subSeparator}\n`;
  txt += `۲. کارنامه شایستگی‌های بالینی سوپرویژن - مقیاس CTRS\n`;
  txt += `${subSeparator}\n`;
  txt += `★ نمره کل صلاحیت بالینی: ${report.overallScore} از ۱۰۰\n`;
  txt += `★ درجه و رتبه بالینی کارورز: ${report.clinicalGrade}\n\n`;
  txt += `ارزیابی ۶ بعد مهارت بر اساس مقیاس رتبه‌بندی درمان شناختی (CTRS):\n`;
  txt += `  ۱. همدلی و درک بالینی (Empathy): %${report.competencyScores.empathy}\n`;
  txt += `  ۲. اتحاد و رابطه درمانی (Therapeutic Alliance): %${report.competencyScores.therapeuticAlliance}\n`;
  txt += `  ۳. کشف هدایت‌شده و سوالات سقراطی (Guided Discovery): %${report.competencyScores.guidedDiscovery}\n`;
  txt += `  ۴. ساختاربندی و مدیریت زمان جلسه (Session Structuring): %${report.competencyScores.sessionStructuring}\n`;
  txt += `  ۵. مدیریت مقاومت و دفاع‌های روانی (Resistance Management): %${report.competencyScores.resistanceManagement}\n`;
  txt += `  ۶. خلوص و تناسب مداخلات بالینی (Intervention Purity): %${report.competencyScores.interventionsPurity}\n\n`;

  if (report.ctrsDetailedScores) {
    txt += `تفکیک ۱۱ سنجه تخصصی مقیاس رتبه‌بندی درمان شناختی (Beck CTRS Itemized):\n`;
    txt += `  • تنظیم دستور جلسه (Agenda): ${report.ctrsDetailedScores.agendaSetting} از ۱۰۰\n`;
    txt += `  • دریافت بازخورد (Feedback): ${report.ctrsDetailedScores.feedback} از ۱۰۰\n`;
    txt += `  • درک بالینی (Understanding): ${report.ctrsDetailedScores.understanding} از ۱۰۰\n`;
    txt += `  • اثربخشی بین‌فردی (Interpersonal Effectiveness): ${report.ctrsDetailedScores.interpersonalEffectiveness} از ۱۰۰\n`;
    txt += `  • همکاری درمانی (Collaboration): ${report.ctrsDetailedScores.collaboration} از ۱۰۰\n`;
    txt += `  • ریتم و زمان‌بندی (Pacing): ${report.ctrsDetailedScores.pacing} از ۱۰۰\n`;
    txt += `  • کشف هدایت‌شده و سقراطی (Guided Discovery): ${report.ctrsDetailedScores.guidedDiscovery} از ۱۰۰\n`;
    txt += `  • تمرکز بر شناخت‌های کلیدی (Focus on Key Cognitions): ${report.ctrsDetailedScores.focusOnKeyCognitions} از ۱۰۰\n`;
    txt += `  • راهبرد تغییر (Strategy for Change): ${report.ctrsDetailedScores.strategyForChange} از ۱۰۰\n`;
    txt += `  • کاربست فنون (Technique Application): ${report.ctrsDetailedScores.techniqueApplication} از ۱۰۰\n`;
    txt += `  • تکالیف خانگی (Homework Assignment): ${report.ctrsDetailedScores.homework} از ۱۰۰\n\n`;
  }

  txt += `${subSeparator}\n`;
  txt += `۳. فرمولاسیون موردی زیستی-روانی-اجتماعی و مدل پنج‌گانه (The 5 Ps Formulation)\n`;
  txt += `${subSeparator}\n`;
  txt += `[عوامل زیستی - Biological]:\n${report.biopsychosocialFormulation.biological}\n\n`;
  txt += `[عوامل روانی و شناختی - Psychological]:\n${report.biopsychosocialFormulation.psychological}\n\n`;
  txt += `[عوامل اجتماعی و محیطی - Social]:\n${report.biopsychosocialFormulation.social}\n\n`;

  if (report.fivePsFormulation) {
    txt += `[فرمولاسیون بالینی پنج‌گانه - The 5 Ps Framework]:\n`;
    txt += `  ۱. مشکل کنونی (Presenting): ${report.fivePsFormulation.presentingProblem}\n`;
    txt += `  ۲. عوامل مستعدکننده (Predisposing): ${report.fivePsFormulation.predisposingFactors}\n`;
    txt += `  ۳. عوامل تسریع‌کننده (Precipitating): ${report.fivePsFormulation.precipitatingFactors}\n`;
    txt += `  ۴. عوامل تداوم‌بخش (Perpetuating): ${report.fivePsFormulation.perpetuatingFactors}\n`;
    txt += `  ۵. عوامل محافظت‌کننده (Protective): ${report.fivePsFormulation.protectiveFactors}\n\n`;
  }

  if (report.allianceRuptureRepairAnalysis) {
    txt += `[تحلیل سیر گسست و ترمیم رابطه درمانی (Alliance Rupture & Repair)]:\n`;
    txt += `${report.allianceRuptureRepairAnalysis}\n\n`;
  }

  txt += `${subSeparator}\n`;
  txt += `۴. جمع‌بندی تحلیلی سوپروایزر (Executive Clinical Summary)\n`;
  txt += `${subSeparator}\n`;
  txt += `${report.executiveSummary}\n\n`;

  if (report.keyTurningPoints && report.keyTurningPoints.length > 0) {
    txt += `${subSeparator}\n`;
    txt += `۵. نقاط عطف و لحظات سرنوشت‌ساز جلسه (Key Turning Points)\n`;
    txt += `${subSeparator}\n`;
    report.keyTurningPoints.forEach((tp, i) => {
      txt += `لحظه ${i + 1}: ${tp.moment}\n`;
      txt += `اثر بالینی: ${tp.impact}\n`;
      txt += `تحلیل سوپروایزر: ${tp.supervisorAnalysis}\n\n`;
    });
  }

  if (report.trapsAndMissedOpportunities && report.trapsAndMissedOpportunities.length > 0) {
    txt += `${subSeparator}\n`;
    txt += `۶. فرصت‌های از دست‌رفته و دام‌های بالینی شناسایی‌شده\n`;
    txt += `${subSeparator}\n`;
    report.trapsAndMissedOpportunities.forEach((trap, i) => {
      txt += `  ${i + 1}) ${trap}\n`;
    });
    txt += `\n`;
  }

  if (report.recommendationsForNextSession && report.recommendationsForNextSession.length > 0) {
    txt += `${subSeparator}\n`;
    txt += `۷. توصیه‌های راهبردی سوپروایزر برای جلسه بعد\n`;
    txt += `${subSeparator}\n`;
    report.recommendationsForNextSession.forEach((rec, i) => {
      txt += `  - ${rec}\n`;
    });
    txt += `\n`;
  }

  if (report.suggestedHomeworkForClient) {
    txt += `تکلیف خانگی پیشنهادی به مراجع:\n${report.suggestedHomeworkForClient}\n\n`;
  }

  txt += `${subSeparator}\n`;
  txt += `۸. یادداشت‌ها و مشاهدات بالینی ثبت‌شده توسط دانشجو در طول جلسه (Clinical Notes)\n`;
  txt += `${subSeparator}\n`;
  if (clinicalNotes && clinicalNotes.trim()) {
    txt += `${clinicalNotes.trim()}\n\n`;
  } else {
    txt += `(یادداشت بالینی در حین جلسه ثبت نشده است.)\n\n`;
  }

  txt += `${subSeparator}\n`;
  txt += `۹. خودسنجی و تأمل فراشناختی دانشجو (Student Metacognitive Reflection)\n`;
  txt += `${subSeparator}\n`;
  const promptQuestion = (report as unknown as { metacognitiveReflection?: { promptQuestion?: string } }).metacognitiveReflection?.promptQuestion || report.studentReflectionQuestion;
  if (promptQuestion) {
    txt += `پرسش تأملی: ${promptQuestion}\n`;
  }
  if (userReflection && userReflection.trim()) {
    txt += `پاسخ و بازخورد درونی دانشجو:\n${userReflection.trim()}\n\n`;
  } else {
    txt += `(تأمل خودسنجی ثبت نشده است.)\n\n`;
  }

  txt += `${separator}\n`;
  txt += `امضا و تأیید دانشجو / کارورز: ..............................\n\n`;
  txt += `امضا، نمره نهایی و تأیید استاد راهنما / سوپروایزر: .............\n`;
  txt += `${separator}\n`;

  return txt;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch {
    return false;
  }
}
