import { jsPDF } from 'jspdf';
import type { SimulationMessage, ClinicalCase, DeepEvaluationReport } from '../types';
import { extractSessionMetricPoints, calculateSessionMetricsStats, type SessionMetricPoint } from './sessionMetrics';

export interface VisualPdfReportOptions {
  currentCase: ClinicalCase;
  messages: SimulationMessage[];
  sessionDuration: number;
  report?: DeepEvaluationReport;
  studentName?: string;
  studentId?: string;
  professorName?: string;
  clinicalNotes?: string;
}

/**
 * Helper to draw a rounded rectangle on Canvas 2D context
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = false,
  stroke = true
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Formats duration into Persian text
 */
function formatDurationPersian(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} دقیقه و ${secs} ثانیه`;
}

/**
 * Draws the complete high-resolution Visual Clinical PDF report on a canvas
 */
export async function renderSessionReportToCanvas(
  options: VisualPdfReportOptions
): Promise<HTMLCanvasElement> {
  const {
    currentCase,
    messages,
    sessionDuration,
    report,
    studentName = 'کارورز روان‌شناسی بالینی',
    studentId = '',
    professorName = 'استاد راهنما / سوپروایزر بالینی',
  } = options;

  const points = extractSessionMetricPoints(messages, undefined, currentCase);
  const stats = calculateSessionMetricsStats(points);

  // A4 dimensions at 180 DPI (High Definition for printing and crisp vector-like PDF)
  // Width: 1488px, Height: 2105px (Aspect ratio ~ 1 : 1.414)
  const canvasWidth = 1488;
  const canvasHeight = 2105;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Smooth rendering setup
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Base font family preference: Persian web font -> system sans-serif
  const fontFam = `'Vazirmatn', 'IRANSans', 'Tahoma', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  // 1. Background
  ctx.fillStyle = '#fcfbfa';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Top Decorative Accent Strip
  const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.4, '#1e293b');
  grad.addColorStop(0.7, '#0d9488');
  grad.addColorStop(1, '#e11d48');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, 16);

  const marginX = 80;
  let cursorY = 55;

  // 3. Official Header Section
  // Outer frame
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, marginX, cursorY, canvasWidth - 2 * marginX, 140, 20, true, true);

  // Logo / Emblem circle on top right
  const logoX = canvasWidth - marginX - 50;
  const logoY = cursorY + 70;
  ctx.beginPath();
  ctx.arc(logoX, logoY, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emblem icon text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2dd4bf';
  ctx.font = `bold 28px ${fontFam}`;
  ctx.fillText('R', logoX, logoY + 1);

  // Header Titles (RTL alignment)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 26px ${fontFam}`;
  ctx.fillText('سامانه هوشمند بالینی روانا (Ravāna)', logoX - 55, cursorY + 22);

  ctx.fillStyle = '#475569';
  ctx.font = `normal 16px ${fontFam}`;
  ctx.fillText(
    'گزارش رسمی پایش بالینی: نمودار تغییرات اضطراب و اتحاد درمانی',
    logoX - 55,
    cursorY + 60
  );

  ctx.fillStyle = '#0d9488';
  ctx.font = `bold 14px ${fontFam}`;
  ctx.fillText(
    'Clinical Trajectory & Therapeutic Alliance Session Report',
    logoX - 55,
    cursorY + 90
  );

  // Left side metadata badges (Date, Case ID, Ref)
  const todayStr = new Date().toLocaleDateString('fa-IR');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `14px ${fontFam}`;
  ctx.fillText(`تاریخ صدور: ${todayStr}`, marginX + 30, cursorY + 28);
  ctx.fillText(
    `کد پرونده: CLN-${currentCase.id.slice(0, 7).toUpperCase()}`,
    marginX + 30,
    cursorY + 58
  );
  ctx.fillText(
    `مدت جلسه: ${formatDurationPersian(sessionDuration)}`,
    marginX + 30,
    cursorY + 88
  );

  cursorY += 165;

  // 4. Clinical Case & Practicum Metadata Panel
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  const metaBoxHeight = 115;
  drawRoundRect(ctx, marginX, cursorY, canvasWidth - 2 * marginX, metaBoxHeight, 16, true, true);

  // 3-Column Info Grid
  const boxW = canvasWidth - 2 * marginX;
  const col1X = canvasWidth - marginX - 25;
  const col2X = canvasWidth - marginX - boxW * 0.36;
  const col3X = canvasWidth - marginX - boxW * 0.72;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  // Row 1
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('نام مراجع:', col1X, cursorY + 20);
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${currentCase.patientName} (${currentCase.age} ساله)`, col1X - 95, cursorY + 20);

  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('درمانگر / کارورز:', col2X, cursorY + 20);
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${studentName} ${studentId ? `(${studentId})` : ''}`, col2X - 130, cursorY + 20);

  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('تعداد نوبت‌ها:', col3X, cursorY + 20);
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${stats.totalTurns} تبادل کلامی`, col3X - 100, cursorY + 20);

  // Row 2
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('تشخیص DSM:', col1X, cursorY + 60);
  ctx.font = `normal 14px ${fontFam}`;
  ctx.fillStyle = '#475569';
  const diagText = currentCase.dsmDiagnosis.length > 38 ? currentCase.dsmDiagnosis.slice(0, 38) + '...' : currentCase.dsmDiagnosis;
  ctx.fillText(diagText, col1X - 105, cursorY + 60);

  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('استاد سوپروایزر:', col2X, cursorY + 60);
  ctx.font = `normal 14px ${fontFam}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(professorName, col2X - 130, cursorY + 60);

  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillStyle = '#334155';
  ctx.fillText('نمره صلاحیت کل:', col3X, cursorY + 60);
  ctx.font = `bold 16px ${fontFam}`;
  ctx.fillStyle = report ? (report.overallScore >= 70 ? '#0d9488' : '#e11d48') : '#0d9488';
  ctx.fillText(report ? `${report.overallScore} از ۱۰۰ (${report.clinicalGrade})` : 'ارزیابی مستمر', col3X - 130, cursorY + 60);

  cursorY += metaBoxHeight + 25;

  // 5. Four KPI Statistical Cards (Anxiety Delta, Rapport Delta, Peak Anxiety, Resistance/Openness)
  const cardGap = 16;
  const numCards = 4;
  const cardW = (boxW - (numCards - 1) * cardGap) / numCards;
  const cardH = 95;

  const cardData = [
    {
      title: 'شاخص اضطراب مراجع',
      value: `${stats.currentAnxiety}%`,
      sub: `آغاز: ${stats.startAnxiety}% | تغییر: ${stats.anxietyDelta > 0 ? `+${stats.anxietyDelta}` : stats.anxietyDelta}%`,
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
      textColor: '#e11d48',
      status: stats.anxietyDelta <= -10 ? 'کاهش مطلوب' : stats.anxietyDelta > 10 ? 'تشدید تنش' : 'نسبتاً پایدار',
    },
    {
      title: 'اتحاد و رابطه درمانی',
      value: `${stats.currentRapport}%`,
      sub: `آغاز: ${stats.startRapport}% | رشد: ${stats.rapportDelta > 0 ? `+${stats.rapportDelta}` : stats.rapportDelta}%`,
      bgColor: '#f0fdfa',
      borderColor: '#99f6e4',
      textColor: '#0d9488',
      status: stats.rapportDelta >= 10 ? 'تعمیق موفق' : stats.rapportDelta < 0 ? 'افت ارتباط' : 'ثبات نسبی',
    },
    {
      title: 'نقطه اوج و کمینه اضطراب',
      value: `${stats.peakAnxiety}%`,
      sub: `اوج در نوبت ${stats.peakAnxietyTurn} | کمینه: ${stats.lowestAnxiety}% (نوبت ${stats.lowestAnxietyTurn})`,
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      textColor: '#334155',
      status: 'نوسان هیجانی',
    },
    {
      title: 'گشودگی / مقاومت پایانی',
      value: `${stats.currentOpenness}%`,
      sub: `مقاومت پایانی: ${stats.currentResistance}% (تغییر: ${stats.resistanceDelta > 0 ? `+${stats.resistanceDelta}` : stats.resistanceDelta}%)`,
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      textColor: '#16a34a',
      status: stats.currentOpenness >= 60 ? 'پذیرش بالا' : 'مقاومت فعال',
    },
  ];

  cardData.forEach((cd, i) => {
    const cx = marginX + i * (cardW + cardGap);
    ctx.fillStyle = cd.bgColor;
    ctx.strokeStyle = cd.borderColor;
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, cx, cursorY, cardW, cardH, 14, true, true);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = `bold 13px ${fontFam}`;
    ctx.fillText(cd.title, cx + cardW - 14, cursorY + 14);

    ctx.fillStyle = cd.textColor;
    ctx.font = `bold 26px ${fontFam}`;
    ctx.fillText(cd.value, cx + cardW - 14, cursorY + 36);

    ctx.fillStyle = '#64748b';
    ctx.font = `11px ${fontFam}`;
    ctx.fillText(cd.sub, cx + cardW - 14, cursorY + 68);

    // Mini status tag on left
    ctx.textAlign = 'left';
    ctx.fillStyle = cd.textColor;
    ctx.font = `bold 11px ${fontFam}`;
    ctx.fillText(cd.status, cx + 12, cursorY + 16);
  });

  cursorY += cardH + 28;

  // 6. Main Visual Chart Section: "نمودار روند تغییرات جلسه (Session Trajectory Chart)"
  const chartContainerH = 430;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, marginX, cursorY, boxW, chartContainerH, 20, true, true);

  // Chart Header inside container
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 18px ${fontFam}`;
  ctx.fillText('نمودار تحلیلی تغییرات اضطراب و رابطه درمانی در طول جلسه', canvasWidth - marginX - 25, cursorY + 22);

  ctx.fillStyle = '#64748b';
  ctx.font = `12px ${fontFam}`;
  ctx.fillText('پایش همزمان برانگیختگی هیجانی مراجع و استحکام اتحاد کاری درمانگر در تک‌تک نوبت‌ها', canvasWidth - marginX - 25, cursorY + 48);

  // Chart Legend on Left
  const legY = cursorY + 32;
  // Anxiety legend
  ctx.textAlign = 'right';
  ctx.beginPath();
  ctx.arc(marginX + 230, legY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#e11d48';
  ctx.fill();
  ctx.font = `bold 13px ${fontFam}`;
  ctx.fillStyle = '#9f1239';
  ctx.fillText('سطح اضطراب مراجع (Anxiety)', marginX + 215, legY - 7);

  // Rapport legend
  ctx.beginPath();
  ctx.arc(marginX + 450, legY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#0d9488';
  ctx.fill();
  ctx.font = `bold 13px ${fontFam}`;
  ctx.fillStyle = '#115e59';
  ctx.fillText('رابطه و پیوند درمانی (Rapport)', marginX + 435, legY - 7);

  // Chart Inner Plot Area
  const plotLeft = marginX + 65;
  const plotRight = canvasWidth - marginX - 45;
  const plotTop = cursorY + 85;
  const plotBottom = cursorY + chartContainerH - 55;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  // Background plot box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(plotLeft, plotTop, plotW, plotH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(plotLeft, plotTop, plotW, plotH);

  // Horizontal Grid Lines (0, 25, 50, 75, 100%)
  const gridLevels = [0, 25, 50, 75, 100];
  gridLevels.forEach((val) => {
    const gy = plotBottom - (val / 100) * plotH;
    ctx.strokeStyle = val === 50 ? '#94a3b8' : '#e2e8f0';
    ctx.lineWidth = val === 50 ? 1.5 : 1;
    if (val === 50) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(plotLeft, gy);
    ctx.lineTo(plotRight, gy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-Axis label on Left
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = val === 50 ? '#475569' : '#94a3b8';
    ctx.font = `bold 12px ${fontFam}`;
    ctx.fillText(`${val}%`, plotLeft - 10, gy);
  });

  // Equilibrium note at 50%
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `10px ${fontFam}`;
  ctx.fillText('نقطه تعادل ۵۰٪', plotLeft + 12, plotBottom - 0.5 * plotH - 12);

  // Map Data Points to coordinates
  const count = points.length;
  const getX = (index: number) => {
    if (count <= 1) return plotLeft + plotW / 2;
    return plotLeft + (index / (count - 1)) * plotW;
  };
  const getY = (val: number) => plotBottom - (Math.min(100, Math.max(0, val)) / 100) * plotH;

  // Draw Gradient Under Curves (Subtle Area)
  // Rapport area
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = getX(i);
    const y = getY(p.rapport);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(count - 1), plotBottom);
  ctx.lineTo(getX(0), plotBottom);
  ctx.closePath();
  const rapAreaGrad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
  rapAreaGrad.addColorStop(0, 'rgba(13, 148, 136, 0.2)');
  rapAreaGrad.addColorStop(1, 'rgba(13, 148, 136, 0.01)');
  ctx.fillStyle = rapAreaGrad;
  ctx.fill();

  // Anxiety area
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = getX(i);
    const y = getY(p.anxiety);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(count - 1), plotBottom);
  ctx.lineTo(getX(0), plotBottom);
  ctx.closePath();
  const anxAreaGrad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
  anxAreaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.22)');
  anxAreaGrad.addColorStop(1, 'rgba(225, 29, 72, 0.01)');
  ctx.fillStyle = anxAreaGrad;
  ctx.fill();

  // Draw Rapport Curve Line (Teal)
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = getX(i);
    const y = getY(p.rapport);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Anxiety Curve Line (Rose)
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = getX(i);
    const y = getY(p.anxiety);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Points & Tooltips on Key Points
  points.forEach((p, i) => {
    const x = getX(i);
    const anxY = getY(p.anxiety);
    const rapY = getY(p.rapport);

    // Anxiety Point
    ctx.beginPath();
    ctx.arc(x, anxY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rapport Point
    ctx.beginPath();
    ctx.arc(x, rapY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Value Labels for Start, End, and Significant Turns (to keep uncluttered)
    const isSpecialTurn = i === 0 || i === count - 1 || p.anxiety === stats.peakAnxiety || count <= 8;
    if (isSpecialTurn) {
      // Anxiety text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9f1239';
      ctx.font = `bold 12px ${fontFam}`;
      ctx.fillText(`${p.anxiety}%`, x, anxY - 12);

      // Rapport text
      ctx.fillStyle = '#115e59';
      ctx.font = `bold 12px ${fontFam}`;
      ctx.fillText(`${p.rapport}%`, x, rapY + 16);
    }

    // X-Axis Turn Tick Label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#475569';
    ctx.font = `11px ${fontFam}`;
    ctx.fillText(p.label, x, plotBottom + 8);
  });

  cursorY += chartContainerH + 25;

  // 7. Clinical Milestones & Supervisory Interpretation Box
  const summaryBoxH = 175;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, marginX, cursorY, boxW, summaryBoxH, 16, true, true);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 16px ${fontFam}`;
  ctx.fillText('تحلیل بالینی سوپروایزر بر روند نمودار (Supervisor Clinical Trajectory Synthesis):', canvasWidth - marginX - 25, cursorY + 18);

  ctx.fillStyle = '#334155';
  ctx.font = `normal 14px ${fontFam}`;
  const interpText = stats.clinicalInterpretation;
  ctx.fillText(interpText, canvasWidth - marginX - 25, cursorY + 50);

  // Additional Clinical Recommendation
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 14px ${fontFam}`;
  ctx.fillText('توصیه برای جلسه آتی:', canvasWidth - marginX - 25, cursorY + 90);

  let recommendation = '';
  if (stats.anxietyDelta > 0) {
    recommendation =
      'به دلیل عدم تثبیت افت اضطراب، شروع جلسه بعدی با فنون آرام‌سازی، بررسی واکنش مراجع به این جلسه و کاهش سرعت مداخله توصیه می‌شود.';
  } else if (stats.rapportDelta >= 15) {
    recommendation =
      'بهره‌گیری از فضای اعتماد و اتحاد شکل‌گرفته جهت ورود به بازسازی باورهای بنیادین (Core Beliefs) و فرمولاسیون شناختی عمیق‌تر.';
  } else {
    recommendation =
      'تثبیت پیوند درمانی، اعتبارسنجی بیشتر احساسات سرکوب‌شده و تمرکز بر تعیین دستور جلسه شفاف مشترک در دقایق آغازین جلسه.';
  }
  ctx.fillStyle = '#475569';
  ctx.font = `normal 13px ${fontFam}`;
  ctx.fillText(recommendation, canvasWidth - marginX - 25, cursorY + 115);

  cursorY += summaryBoxH + 28;

  // 8. Turn-by-Turn Key Events Table (Top Significant Interventions)
  const tableH = 220;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, marginX, cursorY, boxW, tableH, 16, true, true);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 15px ${fontFam}`;
  ctx.fillText('جدول رویدادهای کلیدی و نقاط عطف تبادلات جلسه:', canvasWidth - marginX - 25, cursorY + 16);

  // Table header bar
  const thY = cursorY + 45;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(marginX + 15, thY, boxW - 30, 32);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(marginX + 15, thY, boxW - 30, 32);

  ctx.fillStyle = '#334155';
  ctx.font = `bold 12px ${fontFam}`;
  ctx.fillText('نوبت', canvasWidth - marginX - 35, thY + 8);
  ctx.fillText('تکنیک درمانگر', canvasWidth - marginX - 110, thY + 8);
  ctx.fillText('گزیده بیان / واکنش مراجع', canvasWidth - marginX - 370, thY + 8);
  ctx.fillText('اضطراب', canvasWidth - marginX - 860, thY + 8);
  ctx.fillText('رابطه', canvasWidth - marginX - 970, thY + 8);
  ctx.fillText('وضعیت بالینی', canvasWidth - marginX - 1080, thY + 8);

  // Render up to 4 significant turns
  const sampleTurns = points.length <= 4 ? points : [
    points[0],
    points[Math.floor(points.length / 3)],
    points[Math.floor((2 * points.length) / 3)],
    points[points.length - 1],
  ];

  sampleTurns.forEach((st, idx) => {
    const rowY = thY + 36 + idx * 32;
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(marginX + 15, rowY, boxW - 30, 30);
    }
    ctx.strokeStyle = '#f1f5f9';
    ctx.strokeRect(marginX + 15, rowY, boxW - 30, 30);

    ctx.fillStyle = '#1e293b';
    ctx.font = `bold 12px ${fontFam}`;
    ctx.fillText(st.label, canvasWidth - marginX - 35, rowY + 7);

    ctx.fillStyle = '#0f766e';
    ctx.font = `normal 12px ${fontFam}`;
    const tech = st.therapistTechnique || (st.turnIndex === 0 ? 'شروع مصاحبه' : 'گفتگوی کاوشی');
    ctx.fillText(tech.slice(0, 24), canvasWidth - marginX - 110, rowY + 7);

    ctx.fillStyle = '#475569';
    const exc = st.patientExcerpt ? `«${st.patientExcerpt.slice(0, 48)}...»` : '—';
    ctx.fillText(exc, canvasWidth - marginX - 370, rowY + 7);

    ctx.fillStyle = '#e11d48';
    ctx.font = `bold 12px ${fontFam}`;
    ctx.fillText(`${st.anxiety}%`, canvasWidth - marginX - 855, rowY + 7);

    ctx.fillStyle = '#0d9488';
    ctx.fillText(`${st.rapport}%`, canvasWidth - marginX - 965, rowY + 7);

    ctx.fillStyle = '#64748b';
    ctx.font = `normal 11px ${fontFam}`;
    const statusText = st.anxiety > 75 ? 'اضطراب حاد' : st.rapport >= 60 ? 'اتحاد مطلوب' : 'در حال بررسی';
    ctx.fillText(statusText, canvasWidth - marginX - 1080, rowY + 7);
  });

  cursorY += tableH + 28;

  // 9. Academic Verification & Signatures Section
  const sigBoxH = 120;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, marginX, cursorY, boxW, sigBoxH, 16, true, true);

  const sigW = boxW / 2;
  // Right side: Student signature
  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = `bold 13px ${fontFam}`;
  ctx.fillText('تأیید و امضای دانشجو / درمانگر کارورز:', canvasWidth - marginX - 30, cursorY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = `normal 12px ${fontFam}`;
  ctx.fillText(`نام: ${studentName}`, canvasWidth - marginX - 30, cursorY + 48);
  ctx.fillText(`تاریخ: ${todayStr}`, canvasWidth - marginX - 30, cursorY + 74);
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(canvasWidth - marginX - 30, cursorY + 102);
  ctx.lineTo(canvasWidth - marginX - 250, cursorY + 102);
  ctx.stroke();
  ctx.setLineDash([]);

  // Left side: Supervisor signature and approval
  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = `bold 13px ${fontFam}`;
  ctx.fillText('مهر و امضای استاد راهنما / سوپروایزر بالینی:', marginX + sigW - 30, cursorY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = `normal 12px ${fontFam}`;
  ctx.fillText(`نام استاد: ${professorName}`, marginX + sigW - 30, cursorY + 48);
  ctx.fillText(
    report ? `نمره نهایی: ${report.overallScore} از ۱۰۰ (${report.clinicalGrade})` : 'وضعیت: در انتظار بررسی نهایی',
    marginX + sigW - 30,
    cursorY + 74
  );
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(marginX + sigW - 30, cursorY + 102);
  ctx.lineTo(marginX + 50, cursorY + 102);
  ctx.stroke();
  ctx.setLineDash([]);

  // 10. Official Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `11px ${fontFam}`;
  ctx.fillText(
    'گزارش رسمی سامانه هوشمند بالینی روانا (Ravāna Clinical Supervision System) • ارزیابی استاندارد مهارت‌های روان‌درمانی',
    canvasWidth / 2,
    canvasHeight - 25
  );

  return canvas;
}

/**
 * Downloads the Visual PDF Report directly as a high-resolution .pdf file
 */
export async function downloadVisualPdfReport(
  options: VisualPdfReportOptions
): Promise<void> {
  const canvas = await renderSessionReportToCanvas(options);
  const imgData = canvas.toDataURL('image/jpeg', 0.94);

  // Initialize jsPDF in A4 Portrait mode
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Add the high-resolution rendered report image to the PDF
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // File naming
  const cleanPatientName = options.currentCase.patientName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `گزارش_تصویری_روند_جلسه_${cleanPatientName}_${dateStr}.pdf`;

  pdf.save(fileName);
}

/**
 * Downloads the high-resolution visual report as a PNG image file
 */
export async function downloadVisualReportImage(
  options: VisualPdfReportOptions
): Promise<void> {
  const canvas = await renderSessionReportToCanvas(options);
  const dataUrl = canvas.toDataURL('image/png');
  const cleanPatientName = options.currentCase.patientName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `نمودار_روند_جلسه_${cleanPatientName}_${dateStr}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
