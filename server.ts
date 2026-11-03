import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import compression from 'compression';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable gzip/deflate response compression for high network throughput
app.use(compression());
app.use(express.json());

// Lazy-initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set. Gemini API features may fail.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Chat with Virtual Patient (Simulation Engine)
app.post('/api/chat-patient', async (req, res) => {
  try {
    const { 
      caseProfile, 
      messages, 
      clientState = { anxiety: 65, rapport: 30, openness: 40, resistance: 50 },
      difficulty = 'intermediate', // beginner, intermediate, advanced
      personaConfig
    } = req.body;

    const ai = getAI();

    // Determine fine-tuned persona parameters
    const candor = typeof personaConfig?.candorLevel === 'number' ? personaConfig.candorLevel : (clientState?.openness ?? 45);
    const defensiveness = typeof personaConfig?.defensivenessLevel === 'number' ? personaConfig.defensivenessLevel : (clientState?.resistance ?? 40);
    const personaName = personaConfig?.name || 'استاندارد بالینی پرونده';
    const personaTone = personaConfig?.toneStyleLabel || 'طبیعی و نوسانی';
    const personaGuidance = personaConfig?.behavioralGuidance || 'بیمار با لحنی واقع‌بینانه و انسانی در اتاق درمان واکنش نشان می‌دهد.';

    const systemInstruction = `شما در یک محیط شبیه‌ساز بالینی روانشناسی، نقش یک «مراجع/بیمار فرضی» را با مشخصات زیر با بالاترین درجه واقع‌گرایی بازی می‌کنید:
نام و سن: ${caseProfile?.patientName || caseProfile?.name || 'سارا'} (${caseProfile?.age || 28} ساله)
شغل/وضعیت: ${caseProfile?.occupation || 'دانشجو'}
شکایت اصلی: ${caseProfile?.chiefComplaint || 'اضطراب شدید و حملات پانیک'}
تشخیص فرضی بر اساس DSM-5: ${caseProfile?.dsmDiagnosis || caseProfile?.diagnosis || 'Generalized Anxiety Disorder'}
الگوهای دفاعی و شناختی: ${Array.isArray(caseProfile?.defenseMechanisms) ? caseProfile.defenseMechanisms.join('، ') : (caseProfile?.defenseMechanisms || 'اجتناب، فاجعه‌سازی، توجیه‌تراشی')}

--- تنظیمات شخصیت و لحن مراجع (Persona & Tone Settings) ---
الگوی شخصیتی: ${personaName}
سبک لحن کلامی و بین‌فردی: ${personaTone}
میزان صراحت و خودافشاگری (Candor Level): ${candor}٪ (۰٪ = کتمان و طفره‌روی کامل، ۵۰٪ = متوسط، ۱۰۰٪ = صراحت مطلق و خودافشاگری عریان)
میزان تدافعی بودن و مقاومت (Defensiveness Level): ${defensiveness}٪ (۰٪ = همکار و پذیرا، ۵۰٪ = مقاومت معمول، ۱۰۰٪ = گارد محکم، سد دفاعی نفوذناپذیر و مقاومت شدید)
دستورالعمل رفتاری پرسونا: ${personaGuidance}

وضعیت عاطفی فعلی: اضطراب ${clientState.anxiety}%، سطح اعتماد و اتحاد درمانی ${clientState.rapport}%، مقاومت ${clientState.resistance}%

قوانین رفتار مراجع:
1. هرگز نگویید من یک هوش مصنوعی هستم. کاملاً در نقش بیمار با این شخصیت و لحن بمانید.
2. با توجه به میزان صراحت (${candor}٪) و میزان تدافعی بودن (${defensiveness}٪)، نحوه پاسخ‌دهی را تطبیق دهید:
   - اگر تدافعی بودن بالاست (${defensiveness}٪ > ۶۵٪): به راحتی سفره دلتان را باز نکنید، سوالات عمیق را با توجیه‌تراشی، فرافکنی، شکاکیت یا انحراف بحث رد کنید.
   - اگر صراحت بالاست (${candor}٪ > ۶۵٪): بدون لفافه و بی‌پرده از رنج‌ها و خطاهایتان سخن بگویید.
   - اگر صراحت پایین است (${candor}٪ < ۳۵٪): از پاسخ‌های کوتاه، مبهم («نمی‌دونم»، «شاید») استفاده کنید و از فاش کردن احساسات بپرهیزید.
3. بر اساس سطح اضطراب و مقاومت و لحن (${personaTone})، زبان بدن و نشانه‌های فرازبانی (پارالنگویج) را درون کروشه بنویسید؛ مانند: [با لکنت و نگاه کردن به زمین: ...] یا [دست‌به‌سینه با لبخند تلخ: ...].
4. اگر درمانگر سوالات بسته، سرزنش‌گر یا قضاوت‌کننده پرسید، احساس ناامنی کنید و کوتاه‌تر و دفاعی‌تر پاسخ دهید. اگر درمانگر همدلی عمیق، بازتاب احساسات و پذیرش نامشروط نشان داد، به تدریج آرام‌تر شوید و کمی بیشتر از تجارب درونی‌تان بگویید.
5. پاسخ‌هایتان باید زنده، طبیعی و با ادبیات محاوره‌ای متناسب با فرد واقعی در اتاق درمان باشد.
6. خروجی را دقیقاً در قالب JSON معتبر زیر ارسال کنید (هیچ متن دیگری خارج از JSON ننویسید):
{
  "speech": "متن پاسخ مراجع همراه با زبان بدن داخل کروشه",
  "internalThought": "افکار ناخودآگاه یا پنهانی بیمار در این لحظه (که به زبان نمی‌آورد)",
  "nonVerbalCue": "توصیف مختصر زبان بدن و حالات چهره",
  "updatedState": {
    "anxiety": 60,
    "rapport": 35,
    "openness": ${candor},
    "resistance": ${defensiveness},
    "currentDefense": "نام مکانیزم دفاعی فعال در این لحظه"
  }
}`;

    // Format conversation history
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        contents.push({
          role: m.role === 'therapist' ? 'user' : 'model',
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
        });
      }
    }

    // Call low-latency model for smooth in-session interaction
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'سلام، بفرمایید. امروز چطور می‌تونم بهتون کمک کنم؟' }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        speech: text,
        internalThought: "احساس اضطراب نسبت به قضاوت درمانگر",
        nonVerbalCue: "نگاه به دست‌ها و اضطراب ظاهری",
        updatedState: clientState
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/chat-patient:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در شبیه‌سازی مراجع' });
  }
});

// 3. Real-Time Live Clinical Supervisor Copilot (Multi-Dimensional Evidence-Based Analytics)
app.post('/api/supervisor-feedback', async (req, res) => {
  try {
    const { 
      therapistUtterance, 
      patientPreviousUtterance, 
      caseProfile,
      stage = 'exploration',
      personaConfig,
      recentDialogue = []
    } = req.body;

    const ai = getAI();

    const personaContext = personaConfig 
      ? `\nپرسونای تنظیم‌شده مراجع: ${personaConfig.name} (صراحت: ${personaConfig.candorLevel}٪، دفاعی بودن/مقاومت: ${personaConfig.defensivenessLevel}٪، لحن: ${personaConfig.toneStyleLabel})`
      : '';

    // Format recent conversational context if available
    let recentContextStr = '';
    if (Array.isArray(recentDialogue) && recentDialogue.length > 0) {
      recentContextStr = '\nسیاق دیالوگ‌های اخیر جلسه:\n' + 
        recentDialogue.slice(-4).map((m: any) => `${m.role === 'therapist' ? 'درمانگر' : 'مراجع'}: ${m.content}`).join('\n') + '\n';
    }

    const systemInstruction = `شما یک «سوپروایزر ارشد بالینی روانشناسی» و استاد راهنمای نظارت بالینی مبتنی بر شواهد (Evidence-Based Clinical Supervision) هستید.
وظیفه شما ارزیابی علمی، دقیق و چندبعدی پاسخ دانشجوی درمانگر بر اساس معتبرترین مقیاس‌های دانشگاهی روان‌درمانی است:

۱. مقیاس همدلی ۵ سطحی کارخوف (Carkhuff Empathy Scale, 1969):
   - سطح ۱ (ابطال‌کننده / مخرب): نادیده گرفتن کامل هیجان مراجع، قضاوت، تمسخر یا تغییر نامربوط بحث.
   - سطح ۲ (تفریقی / ناکافی): بازتاب صرفاً عقلانی محتوا بدون درک شدت هیجان؛ کاستن از رنج مراجع یا پاسخ ماشینی.
   - سطح ۳ (تبادلی دقیق / متوازن): بازتاب دقیق، هم‌سطح و وفادارانه هیجان و محتوای تصریح‌شده مراجع بدون کم و زیاد.
   - سطح ۴ (افزاینده / عمیق): شناسایی و صورت‌بندی هیجانات ناگفته، تعارضات درونی و احساسات زیربنایی پنهان که مراجع هنوز به زبان نیاورده اما تجربه می‌کند.
   - سطح ۵ (دگرگون‌کننده / هماهنگی کامل): تنظیم عاطفی عمیق، حضور رادیکال و درک عمیق‌ترین لایه‌های درد روانی، ایجاد بستر امن برای دگرگونی و تجربه هیجانی اصلاحی.

۲. سطوح شش‌گانه اعتبارسنجی لینهان در رفتاردرمانی دیالکتیکی (Linehan's 6 Validation Levels, 1993):
   - V1: مشاهده و گوش‌دادن هشیارانه و بدون پیش‌داوری (Active Listening)
   - V2: بازتاب دقیق و بدون تحریف گفته‌ها (Accurate Reflection)
   - V3: به کلام درآوردن ناگفته‌ها بر اساس سرنخ‌های غیرکلامی (Articulating the Unverbalized)
   - V4: اعتبارسنجی بر اساس تاریخچه یادگیری، تجارب گذشته و تروما (Validation in terms of History)
   - V5: نرمال‌سازی و اعتبارسنجی در شرایط حاضر؛ واکنش بهنجار هر انسان (Normative Human Experience)
   - V6: اصالت بنیادی و ارتباط برابر انسان با انسان (Radical Genuineness)

۳. ابعاد سه‌گانه اتحاد درمانی بوردین (Bordin's Working Alliance Inventory):
   - پیوند عاطفی و اعتماد متقابل (Bond: 1-10)
   - توافق بر وظایف درمانی جلسه (Task Agreement: 1-10)
   - وضوح و همسویی اهداف مشترک (Goal Agreement: 1-10)

۴. رصد گسست و ترمیم رابطه درمانی (Alliance Rupture & Repair - Safran & Muran, 2000):
   - بررسی اینکه آیا مراجع در نوبت قبل دچار گسست عقب‌نشینی (Withdrawal: سکوت، اجتناب، پاسخ‌های تک‌کلمه‌ای) یا گسست رویارویی (Confrontation: خشم، ایرادگیری از درمانگر، بی‌اعتمادی) شده بود یا خیر.
   - آیا درمانگر با فراارتباط (Metacommunication)، پذیرش سهم خود و اعتبارسنجی به ترمیم پرداخته (Repair) یا مقاومت را تشدید کرده است؟

۵. نظارت بر دام‌های بالینی و انتقال متقابل (Countertransference & Clinical Traps):
   - بازتاب اصلاح‌گرانه زودهنگام (Righting Reflex) و نصیحت زودهنگام
   - بازسازی شناختی پیش‌رس قبل از برقراری همدلی کافی
   - رگبار پرسش‌های بسته و بازجویانه (Interrogative Cascade)
   - اطمینان‌بخشی کاذب و مثبت‌اندیشی سمی (False Reassurance)
   - همدستی عقلانی با مقاومت (Intellectual Collusion)

۶. تمرین هدایت‌شده فوری بالینی (Deliberate Practice Micro-Skill):
   - تجویز یک تمرین رفتاری بسیار دقیق برای لبه رشد مهارتی دانشجو.

مشخصات پرونده:
مراجع: ${caseProfile?.patientName || 'مراجع'} (${caseProfile?.age || 30} ساله) - تشخیص DSM-5: ${caseProfile?.dsmDiagnosis || 'مشکل بالینی'} - رویکرد پیشنهادی: ${caseProfile?.recommendedApproach || 'CBT'}${personaContext}
${recentContextStr}
سخن قبلی مراجع: "${patientPreviousUtterance || ''}"
پاسخ دانشجوی درمانگر: "${therapistUtterance || ''}"

خروجی را دقیقاً در قالب JSON معتبر زیر تولید کنید:
{
  "techniqueUsed": "نام دقیق تکنیک بالینی (مانند: بازتاب احساسات عمیق، پرسشگری سقراطی، اعتبارسنجی هیجانی V5، کاوش در شواهد شناختی)",
  "techniqueCategory": "انعکاس احساسات / پرسشگری سقراطی / اعتبارسنجی هیجانی / بازسازی شناختی / کاوش بدنی / روان‌آموزی / دام بالینی",
  "empathyScore": 8,
  "empathyStars": 4.0,
  "validationScore": 8,
  "validationStars": 4.0,
  "validationLevel": "عالی",
  "empathyValidationInsight": "تحلیل علمی موجز ۱ جمله‌ای درباره کیفیت همدلی و اعتبارسنجی سخن اخیر درمانگر.",
  "carkhuffEvaluation": {
    "level": 4,
    "levelLabel": "سطح ۴: همدلی افزاینده (Additive Empathy)",
    "carkhuffDefinition": "پاسخ درمانگر احساسات و معانی زیربنایی ناگفته را فراتر از کلمات صریح مراجع بیان می‌کند.",
    "clinicalRationale": "درمانگر به جای تکرار صرف کلمات، احساس ترس از تحقیر شدن را که زیر ظاهر بی‌تفاوتی مراجع نهفته بود نام‌گذاری کرد."
  },
  "linehanValidation": {
    "level": "V5",
    "levelLabel": "سطح V5: اعتبارسنجی نرمال‌ساز (Normative Human Response)",
    "scientificDescription": "به رسمیت شناختن اینکه در چنین شرایطی، هر انسانی احساس مشابهی را تجربه می‌کند.",
    "identifiedEvidence": "جمله درمانگر نشان می‌دهد که اضطراب مراجع در حضور جمع، پاسخی قابل فهم و طبیعی است."
  },
  "workingAllianceTriad": {
    "bondScore": 8,
    "taskAgreementScore": 7,
    "goalAgreementScore": 8,
    "ruptureState": "none",
    "ruptureAnalysis": "رابطه پایدار است و نشانه‌ای از گسست فعال دیده نمی‌شود."
  },
  "techniquePurityScore": 9,
  "allianceImpact": "تقویت محسوس اتحاد درمانی (+۲)",
  "allianceDelta": 2,
  "depthLevel": "عمیق",
  "clinicalComment": "تحلیل کاربردی و علمی ۱-۲ جمله‌ای متمرکز بر صلاحیت بالینی دانشجو.",
  "identifiedTrap": "هیچ / بازتاب اصلاح‌گرانه (Righting Reflex) / رگبار پرسش‌های بسته / اطمینان‌بخشی کاذب / حل مسئله زودهنگام",
  "trapSeverity": "none",
  "countertransferenceMarker": "آیا ردپایی از اضطراب عملکرد یا تمایل ناخودآگاه درمانگر به نجات سریع مراجع دیده می‌شود؟",
  "suggestedAlternative": "جایگزین طلایی استادانه با ادبیات فارسی روان و لحن اصیل انسانی",
  "multiApproachAlternatives": {
    "cbt": "پاسخ جایگزین با متد شناختی-رفتاری، کشف هدایت‌شده و پرسشگری سقراطی",
    "act": "پاسخ جایگزین مبتنی بر پذیرش، ذهن‌آگاهی و تمایل به تجربه هیجان بدون قضاوت",
    "relational": "پاسخ جایگزین تمرکزیافته بر پیوند عاطفی، اعتبارسنجی عمیق و حضور انسانی"
  },
  "deliberatePracticeGuide": {
    "coreMicroSkill": "نام دقیق مهارت خرد (مثلاً: بازتاب احساس اولیه بدون الصاق سوال)",
    "clinicalRationale": "چرا این ریزمهارت بر اساس پژوهش‌های تجربی منجر به تعمیق پردازش هیجانی مراجع می‌شود.",
    "immediateDrill": "دستورالعمل عینی تمرین برای نوبت بعد"
  },
  "instantClinicalNudge": "نکته طلایی و فوری برای نوبت بعدی تعامل (حداکثر ۱ جمله).",
  "recommendedNextStep": "گام مداخله‌ای مرحله بعد"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: 'تحلیل علمی، چندبعدی و مبتنی بر شواهد تعامل را بر اساس استانداردهای کارخوف، لینهان و بوردین انجام بده.' }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.25,
      }
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        techniqueUsed: "کاوش بالینی و بازتاب احساسات",
        techniqueCategory: "انعکاس احساسات",
        empathyScore: 7,
        empathyStars: 3.5,
        validationScore: 7,
        validationStars: 3.5,
        validationLevel: "مناسب",
        empathyValidationInsight: "پاسخ حاوی درک مناسب احساسات است و تجربه مراجع را تأیید می‌کند.",
        carkhuffEvaluation: {
          level: 3,
          levelLabel: "سطح ۳: تبادلی دقیق (Accurate Reciprocal)",
          carkhuffDefinition: "انعکاس هم‌سطح و وفادارانه احساسات تصریح‌شده مراجع.",
          clinicalRationale: "احساسات بیان‌شده با دقت بازتاب داده شدند."
        },
        linehanValidation: {
          level: "V2",
          levelLabel: "سطح V2: بازتاب دقیق (Accurate Reflection)",
          scientificDescription: "انعکاس سخنان مراجع بدون تحریف یا قضاوت.",
          identifiedEvidence: "بازتاب بدون موضع‌گیری انجام شد."
        },
        workingAllianceTriad: {
          bondScore: 7,
          taskAgreementScore: 7,
          goalAgreementScore: 7,
          ruptureState: "none",
          ruptureAnalysis: "اتحاد درمانی در وضعیت باثبات قرار دارد."
        },
        techniquePurityScore: 7,
        allianceImpact: "مثبت و حمایت‌گر",
        allianceDelta: 1,
        depthLevel: "متوسط",
        clinicalComment: "پاسخ ساختار خوبی داشت؛ سعی کنید بر هیجان اولیه متمرکز بمانید و از طرح سوالات سریع بپرهیزید.",
        identifiedTrap: "هیچ",
        trapSeverity: "none",
        suggestedAlternative: "می‌شنوم که چقدر این تجربه براتون طاقت‌فرسا بوده و بار سنگینی رو روی دوشتون حس می‌کنید...",
        multiApproachAlternatives: {
          cbt: "در اون لحظه که این احساس بهتون دست داد، چه فکری از ذهنتون عبور کرد؟",
          act: "اجازه بدیم این حس اضطراب بدون اینکه بخوایم فوراً تغییرش بدیم، چند لحظه اینجا باهامون باشه.",
          relational: "الان که دارید این رو با من در میون می‌ذارید، چه حسی در ارتباطمون تجربه می‌کنید؟"
        },
        deliberatePracticeGuide: {
          coreMicroSkill: "بازتاب هیجان بدون سوال متعاقب",
          clinicalRationale: "طرح سوال بلافاصله پس از بازتاب، مراجع را از فرآیند درونی احساس خارج و وارد عقلانی‌سازی می‌کند.",
          immediateDrill: "در نوبت بعد، فقط یک جمله در انعکاس هیجان بگویید و ۳ ثانیه سکوت کنید."
        },
        instantClinicalNudge: "مکث کنید و منتظر واکنش هیجانی مراجع بمانید.",
        recommendedNextStep: "کاوش در باور بنیادین و نشانه‌های بدنی"
      };
    }

    // Ensure stars & scores are strictly normalized
    if (typeof parsed.empathyStars !== 'number' || isNaN(parsed.empathyStars)) {
      parsed.empathyStars = Math.min(5, Math.max(1, Math.round(((parsed.empathyScore || 6) / 2) * 10) / 10));
    } else {
      parsed.empathyStars = Math.min(5, Math.max(1, Math.round(parsed.empathyStars * 10) / 10));
    }

    if (typeof parsed.validationStars !== 'number' || isNaN(parsed.validationStars)) {
      parsed.validationStars = typeof parsed.validationScore === 'number'
        ? Math.min(5, Math.max(1, Math.round((parsed.validationScore / 2) * 10) / 10))
        : parsed.empathyStars;
    } else {
      parsed.validationStars = Math.min(5, Math.max(1, Math.round(parsed.validationStars * 10) / 10));
    }

    if (typeof parsed.validationScore !== 'number') {
      parsed.validationScore = Math.round(parsed.validationStars * 2);
    }

    if (!parsed.validationLevel) {
      parsed.validationLevel = parsed.validationStars >= 4.5 ? 'عالی' : parsed.validationStars >= 3.5 ? 'مناسب' : parsed.validationStars >= 2.5 ? 'خنثی' : 'ناکافی';
    }

    if (!parsed.empathyValidationInsight) {
      parsed.empathyValidationInsight = parsed.clinicalComment || 'ارزیابی کیفیت بازتاب احساس و تأیید تجربه مراجع بر اساس سنجه‌های بالینی.';
    }

    // Normalize Carkhuff level if not present
    if (!parsed.carkhuffEvaluation) {
      const cLevel = Math.min(5, Math.max(1, Math.round(parsed.empathyStars))) as 1 | 2 | 3 | 4 | 5;
      const labels: Record<number, string> = {
        1: 'سطح ۱: ابطال‌کننده / مخرب (Detrimental)',
        2: 'سطح ۲: تفریقی / ناقص (Subtractive)',
        3: 'سطح ۳: تبادلی دقیق (Accurate Reciprocal)',
        4: 'سطح ۴: افزاینده / عمیق (Additive Empathy)',
        5: 'سطح ۵: دگرگون‌کننده (Transformational)'
      };
      parsed.carkhuffEvaluation = {
        level: cLevel,
        levelLabel: labels[cLevel],
        carkhuffDefinition: 'ارزیابی بر مبنای مقیاس ۵ سطحی همدلی رابرت کارخوف (Carkhuff, 1969)',
        clinicalRationale: parsed.empathyValidationInsight
      };
    }

    // Normalize Linehan level if not present
    if (!parsed.linehanValidation) {
      parsed.linehanValidation = {
        level: parsed.validationStars >= 4.5 ? 'V5' : parsed.validationStars >= 3.5 ? 'V3' : 'V2',
        levelLabel: parsed.validationStars >= 4.5 ? 'سطح V5: اعتبارسنجی نرمال‌ساز' : 'سطح V2: بازتاب دقیق',
        scientificDescription: 'طبقه‌بندی سطوح اعتبارسنجی لینهان در درمان مبتنی بر پذیرش و تغییر (DBT)',
        identifiedEvidence: parsed.clinicalComment
      };
    }

    // Normalize Working Alliance Triad if not present
    if (!parsed.workingAllianceTriad) {
      parsed.workingAllianceTriad = {
        bondScore: Math.min(10, Math.max(1, Math.round((parsed.empathyScore || 7)))),
        taskAgreementScore: 7,
        goalAgreementScore: 7,
        ruptureState: 'none',
        ruptureAnalysis: parsed.allianceImpact || 'اتحاد درمانی باثبات'
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/supervisor-feedback:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در دریافت فیدبک سوپروایزر' });
  }
});

// 3.5 Preflight Technique Sandbox (سنجش‌گر پیش‌ارسال تکنیک قبل از تعامل نهایی)
app.post('/api/preflight-sandbox', async (req, res) => {
  try {
    const { draftUtterance, patientPreviousUtterance, caseProfile } = req.body;
    const ai = getAI();

    const systemInstruction = `شما یک ابزار سنجش آزمایشگاهی تکنیک‌های بالینی هستید. دانشجوی درمانگر می‌خواهد بداند قبل از ارسال جمله‌اش به بیمار شبیه‌سازی‌شده، اثر احتمالی، تکنیک‌های پنهان، و بازنویسی‌های مطلوب آن چیست.
بیمار: ${caseProfile?.patientName || 'مراجع'} - تشخیص: ${caseProfile?.dsmDiagnosis || 'کیس بالینی'}
سخن قبلی بیمار: "${patientPreviousUtterance || ''}"
پیش‌نویس دانشجوی درمانگر: "${draftUtterance || ''}"

ارزیابی کنید:
1. predictedEmpathy: پیش‌بینی نمره همدلی (۱ تا ۱۰)
2. predictedAllianceChange: پیش‌بینی اثر بر رابطه (+۲، ۰، -۲، ...)
3. detectedTechniques: تکنیک‌های به کار رفته
4. potentialTraps: خطاهای احتمالی (نصیحت زودهنگام، قضاوت، حل مسئله زودهنگام و ...)
5. optimizedRewrite: بهترین بازنویسی بالینی جمله دانشجو با حفظ منظور او
6. multiApproachRewrites: بازنویسی جمله در سه سبک CBT, ACT, و هیجان‌مدار

فرمت JSON:
{
  "predictedEmpathy": 8,
  "predictedAllianceChange": "+1",
  "detectedTechniques": ["انعکاس احساس", "پرسش باز"],
  "potentialTraps": "هیچ / خطر ورود زودهنگام به فاز راهکار",
  "optimizedRewrite": "بازنویسی بهینه و حرفه‌ای",
  "multiApproachRewrites": {
    "cbt": "بازنویسی سقراطی شناختی",
    "act": "بازنویسی پذیرش و گسلش",
    "relational": "بازنویسی اعتبارسنجی رابطه‌ای"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: 'پیش‌نویس را ارزیابی کن' }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/preflight-sandbox:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3.8 Clinical Intervention Suggester (ویجت پیشنهاد ۳ مداخله تأییدشده بالینی در لحظات سکوت و درماندگی)
app.post('/api/suggest-interventions', async (req, res) => {
  try {
    const { 
      patientLastUtterance, 
      caseProfile, 
      clientState, 
      triggerType = 'silence' 
    } = req.body;
    
    const ai = getAI();

    const systemInstruction = `شما یک «سوپروایزر ارشد بالینی» و مربی مهارت‌های پیشرفته روان‌درمانی هستید.
دانشجوی روانشناسی در یک جلسه شبیه‌سازی زنده با مراجع مجازی قرار دارد. اکنون در لحظه "${triggerType === 'silence' ? 'سکوت و وقفه بالینی' : triggerType === 'helplessness' ? 'درماندگی، بن‌بست شناختی و ناامیدی' : 'مقاومت یا تداوم تعامل'}" قرار گرفته است.

مشخصات مراجع:
- نام: ${caseProfile?.patientName || 'مراجع'}
- تشخیص DSM: ${caseProfile?.dsmDiagnosis || 'مشکل بالینی'}
- رویکرد اصلی پیشنهادی: ${caseProfile?.recommendedApproach || 'CBT / EFT'}
- آخرین سخن یا رفتار مراجع: "${patientLastUtterance || 'سکوت و نگاه مراجع به زمین...'}"
- وضعیت فعلی مراجع: اضطراب ${clientState?.anxietyLevel || 50}%، مقاومت ${clientState?.resistanceLevel || 30}%، گشودگی ${clientState?.opennessLevel || 60}%

وظیفه شما ارائه دقیق «سه گزینه از مداخلات بالینی تأیید شده» استاندارد و طلایی است:
۱. بازتاب احساس (Feeling Reflection): تمرکز بر هیجان زیربنایی، احساس تنهایی/شرم/ترس و بازتاب بدون قضاوت.
۲. شفاف‌سازی (Clarification): باز کردن ابهام گزاره‌های کلی مانند «نمی‌دونم» یا «فایده نداره»، کشف هدایت‌شده محتوای ذهن یا نشانه‌های بدنی.
۳. مواجهه ملایم (Gentle Confrontation): مواجهه با تعارض درونی (بین تمایل به رهایی و اجتناب/سکوت)، نام‌گذاری همدلانه مانع ارتباطی در اینجا-و-اکنون اتاق درمان.

خروجی باید یک شیء JSON با ساختار زیر باشد:
{
  "triggerTitle": "لحظه سکوت بالینی / درماندگی مراجع",
  "triggerDescription": "توضیح کوتاه وضعیت روانشناختی حاکم بر این لحظه",
  "interventions": [
    {
      "id": "reflection-1",
      "category": "reflection",
      "categoryLabel": "بازتاب احساس (Feeling Reflection)",
      "shortCategory": "بازتاب احساس",
      "therapeuticSchool": "رویکرد مراجع‌محور و هیجان‌مدار (EFT)",
      "clinicalObjective": "هدف بالینی دقیق مداخله",
      "suggestedPhrasing": "جمله دقیق، شیوا و انسان‌دوستانه جهت بیان مستقیم به مراجع فارسی‌زبان",
      "rationale": "چرا این مداخله در این لحظه سکوت یا درماندگی موثر است",
      "watchOutWarning": "نکته مراقبتی سوپروایزر برای جلوگیری از دام‌های بالینی",
      "expectedAllianceImpact": "+۲ (تقویت احساس امنیت)"
    },
    {
      "id": "clarification-2",
      "category": "clarification",
      "categoryLabel": "شفاف‌سازی شناختی-پدیدارشناختی (Clarification)",
      "shortCategory": "شفاف‌سازی",
      "therapeuticSchool": "شناختی-رفتاری (CBT) و گشتالت",
      "clinicalObjective": "هدف بالینی دقیق مداخله",
      "suggestedPhrasing": "جمله دقیق جهت کشف محتوای مبهم مراجع",
      "rationale": "چرا این مداخله در این لحظه موثر است",
      "watchOutWarning": "هشدار پرهیز از لحن بازجویانه",
      "expectedAllianceImpact": "+۱ (افزایش بینش شناختی)"
    },
    {
      "id": "confrontation-3",
      "category": "confrontation",
      "categoryLabel": "مواجهه ملایم با سد ارتباطی (Gentle Confrontation)",
      "shortCategory": "مواجهه ملایم",
      "therapeuticSchool": "روان‌پویشی کوتاه‌مدت و بین‌فردی",
      "clinicalObjective": "هدف بالینی دقیق مواجهه",
      "suggestedPhrasing": "جمله دقیق مواجهه توأم با همدلی عمیق",
      "rationale": "چرا مواجهه ملایم در این نقطه بن‌بست را می‌شکند",
      "watchOutWarning": "هشدار مراقبت از عدم ایجاد حس سرزنش",
      "expectedAllianceImpact": "+۲ (تسهیل تعارض درونی)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: '۳ مداخله بالینی تأییدشده را با جزئیات بالینی تولید کن' }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/suggest-interventions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. In-Depth Case Supervision Report (High Thinking Mode)
app.post('/api/deep-evaluation', async (req, res) => {
  try {
    const { 
      caseProfile, 
      transcript, 
      durationMinutes = 15, 
      clinicalNotes = '',
      studentSelfRating = null 
    } = req.body;

    const ai = getAI();

    const systemInstruction = `شما استاد برجسته روانشناسی بالینی، متخصص نظارت بالینی مبتنی بر شواهد و رئیس کمیته ارزیابی صلاحیت‌های بالینی هستید.
وظیفه شما ارزیابی فوق‌تخصصی، عمیق و علمی ترانسکریپت جلسه درمان شبیه‌سازی‌شده دانشجو با استفاده از تفکر بالینی بالا (Deep Clinical Reasoning) بر مبنای:
۱. مقیاس جامع رتبه‌بندی درمان شناختی (Cognitive Therapy Rating Scale - CTRS)
۲. فرمولاسیون بالینی استاندارد پنج گانه (The 5 Ps Formulation Model: Presenting, Predisposing, Precipitating, Perpetuating, Protective)
۳. تحلیل سیر گسست و ترمیم اتحاد درمانی (Safran & Muran Alliance Rupture & Repair Model)
۴. تجویز تمرین‌های هدایت‌شده (Deliberate Practice) برای لبه رشد مهارت‌های بالینی کارورز.

پروفایل کیس: ${JSON.stringify(caseProfile || {})}
طول جلسه: ${durationMinutes} دقیقه
نمره خودارزیابی دانشجو به خودش (در صورت وجود): ${studentSelfRating ? `${studentSelfRating} از ۱۰۰` : 'ثبت نشده'}
یادداشت‌های بالینی و مشاهدات ثبت‌شده توسط دانشجوی درمانگر در طول جلسه:
${clinicalNotes ? clinicalNotes : 'دانشجو یادداشت بالینی ثبت نکرده است.'}

متن کامل ترانسکریپت جلسه:
${Array.isArray(transcript) ? transcript.map((t: any) => `${t.sender === 'therapist' ? 'دانشجوی درمانگر' : 'مراجع'}: ${t.text}`).join('\n') : transcript}

دستورالعمل جامع ارزیابی:
1. تحلیل دقیق تک‌تک تعاملات، کشف خطاهای شناختی، طرح‌واره‌های فعال‌شده، مکانیزم‌های دفاعی و گسست‌های کلامی/هیجانی مراجع.
2. استخراج توزیع آماری تکنیک‌های به کار رفته (Technique Distribution Matrix) در طول جلسه به همراه کیفیت و خلوص هر تکنیک.
3. نمره‌دهی صلاحیت بالینی در ۶ بعد اصلی CTRS به علاوه نمرات تفکیکی ۱۱ گانه CTRS استاندارد (نمره از ۱۰۰).
4. تدوین فرمولاسیون جامع زیستی-روانی-اجتماعی و فرمولاسیون استاندارد 5P (عوامل بروز، مستعدکننده، تسریع‌کننده، تداوم‌بخش و محافظت‌کننده).
5. تحلیل روند گسست و ترمیم رابطه درمانی (Alliance Rupture & Repair Analysis) در ترانسکریپت.
6. استخراج نقاط عطف کلیدی جلسه (لحظات طلایی ارتباطی یا فرصت‌های بربادرفته).
7. نقشه راه و تمرین‌های بالینی دقیق بر اساس اصول Deliberate Practice.
8. طراحی پرسش تأملی فراشناختی و تحلیل کالیبراسیون خودسنجی دانشجو (${studentSelfRating || 'بدون خودسنجی'}).

پاسخ را دقیقاً در قالب JSON معتبر زیر ارسال کنید:
{
  "overallScore": 85,
  "clinicalGrade": "بسیار خوب (A-)",
  "executiveSummary": "خلاصه ارزیابی بالینی عملکرد دانشجو در یک پاراگراف جامع علمی و مستند",
  "competencyScores": {
    "empathy": 88,
    "therapeuticAlliance": 82,
    "guidedDiscovery": 79,
    "sessionStructuring": 85,
    "resistanceManagement": 75,
    "interventionsPurity": 80
  },
  "ctrsDetailedScores": {
    "agendaSetting": 80,
    "feedback": 75,
    "understanding": 88,
    "interpersonalEffectiveness": 85,
    "collaboration": 82,
    "pacing": 78,
    "guidedDiscovery": 80,
    "focusOnKeyCognitions": 84,
    "strategyForChange": 76,
    "techniqueApplication": 82,
    "homework": 70
  },
  "techniqueDistribution": [
    { "technique": "انعکاس احساسات", "count": 4, "percentage": 35, "qualityRating": 8.5 },
    { "technique": "پرسشگری سقراطی", "count": 3, "percentage": 25, "qualityRating": 7.5 },
    { "technique": "اعتبارسنجی هیجانی", "count": 2, "percentage": 20, "qualityRating": 9.0 },
    { "technique": "کاوش در شواهد شناختی", "count": 2, "percentage": 15, "qualityRating": 7.0 },
    { "technique": "روان‌آموزی", "count": 1, "percentage": 5, "qualityRating": 8.0 }
  ],
  "biopsychosocialFormulation": {
    "biological": "عوامل زیستی زمینه‌ساز و فیزیولوژیک",
    "psychological": "باورهای بنیادین، طرح‌واره‌ها، خطاهای شناختی و تعارضات درون‌روانی",
    "social": "محیط خانواده، تعارضات بین‌فردی و عوامل استرس‌زای محیطی"
  },
  "fivePsFormulation": {
    "presentingProblem": "مشکل کنونی و نشانه‌های بارز رفتاری/هیجانی مراجع در این جلسه",
    "predisposingFactors": "عوامل مستعدکننده تحولی، تجارب آسیب‌زا و آسیب‌پذیری‌های زیستی-روانی کهن",
    "precipitatingFactors": "عوامل تسریع‌کننده و محرک‌های آغازگر اخیر که منجر به مراجعه شده‌اند",
    "perpetuatingFactors": "عوامل تداوم‌بخش، اجتناب‌های تجربی، چرخه‌های معیوب شناختی و سود ثانویه",
    "protectiveFactors": "عوامل محافظت‌کننده، ظرفیت‌های بینشی، منابع حمایتی و نقاط قوت مراجع"
  },
  "allianceRuptureRepairAnalysis": "تحلیل روند فراز و فرود اتحاد درمانی، گسست‌های انصرافی یا رویارویی و نحوه پاسخ و ترمیم درمانگر در طول جلسه",
  "keyTurningPoints": [
    {
      "moment": "دقیقه یا دیالوگ کلیدی",
      "impact": "اثر مثبت یا منفی بر جریان درمان",
      "supervisorAnalysis": "تحلیل تخصصی سوپروایزر"
    }
  ],
  "trapsAndMissedOpportunities": [
    "فرصت یا اشتباه ۱",
    "فرصت یا اشتباه ۲"
  ],
  "recommendationsForNextSession": [
    "توصیه راهبردی ۱",
    "توصیه راهبردی ۲"
  ],
  "suggestedHomeworkForClient": "تکلیف خانگی بالینی طراحی‌شده برای این مراجع",
  "skillImprovementRoadmap": [
    {
      "skill": "پرسشگری سقراطی در برابر پرسش‌های بسته",
      "status": "نیاز به تمرین",
      "recommendedExercise": "تمرین بازطراحی پرسش‌های با «چرا» و سوالات بسته به فرم «چطور» و بررسی شواهد دوطرفه"
    },
    {
      "skill": "اعتبارسنجی احساسات پیش از مداخله",
      "status": "تسلط مطلوب",
      "recommendedExercise": "ادامه حفظ مکث و انعکاس هیجان اولیه"
    }
  ],
  "studentReflectionQuestion": "در لحظه‌ای که مراجع شروع به مقاومت کرد، در درون خودتان چه حسی تجربه کردید و چه عاملی باعث شد سراغ این مداخله بروید؟",
  "calibrationInsight": "دانشجو خود را به طور واقع‌بینانه‌ای ارزیابی کرده و نمره خودارزیابی وی به نمره عینی سوپروایزر بسیار نزدیک است."
}`;

    // Note: Use gemini-3.1-pro-preview with thinkingLevel HIGH and DO NOT set maxOutputTokens!
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: 'ارزیابی جامع و عمیق بالینی جلسه را انجام بده.' }] }],
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        },
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        overallScore: 82,
        clinicalGrade: "خوب (B+)",
        executiveSummary: text,
        competencyScores: {
          empathy: 80,
          therapeuticAlliance: 82,
          guidedDiscovery: 78,
          sessionStructuring: 80,
          resistanceManagement: 75,
          interventionsPurity: 78
        },
        biopsychosocialFormulation: {
          biological: "نشانه‌های برانگیختگی سمپاتیک",
          psychological: "فاجعه‌سازی و سوگیری‌های شناختی",
          social: "انزوای اجتماعی نسبی"
        },
        keyTurningPoints: [],
        trapsAndMissedOpportunities: ["توجه بیشتر به زبان بدن"],
        recommendationsForNextSession: ["پیگیری ثبت افکار روزانه"],
        suggestedHomeworkForClient: "یادداشت‌برداری از موقعیت‌های برانگیزاننده اضطراب",
        techniqueDistribution: [
          { technique: "انعکاس احساسات", count: 3, percentage: 40, qualityRating: 8.0 },
          { technique: "پرسشگری سقراطی", count: 2, percentage: 30, qualityRating: 7.5 },
          { technique: "اعتبارسنجی", count: 2, percentage: 30, qualityRating: 8.5 }
        ],
        skillImprovementRoadmap: [
          { skill: "پرسشگری سقراطی", status: "متوسط", recommendedExercise: "تمرین بازنویسی فرضیات" }
        ],
        studentReflectionQuestion: "اگر می‌توانستید یک پاسخ را در جلسه بازنویسی کنید، کدام بخش بود؟",
        calibrationInsight: "هماهنگی مناسب بین خودارزیابی و عملکرد واقعی بالینی"
      };
    }

    // Ensure 5P Formulation is populated
    if (!parsed.fivePsFormulation) {
      parsed.fivePsFormulation = {
        presentingProblem: caseProfile?.chiefComplaint || "اضطراب، نشخوار فکری و احساس ناکامی",
        predisposingFactors: parsed.biopsychosocialFormulation?.biological || "زمینه ژنتیکی و سابقه خانوادگی آسیب‌پذیری خلقی",
        precipitatingFactors: "استرس‌های شغلی و بین‌فردی اخیر و تجربه ناکامی‌های مکرر",
        perpetuatingFactors: parsed.biopsychosocialFormulation?.psychological || "اجتناب‌های رفتاری، خودانتقادی و افکار خودکار منفی",
        protectiveFactors: "انگیزه برای درمان، ظرفیت خودگویی کلامی و حمایت‌های نسبی اجتماعی"
      };
    }

    // Ensure CTRS detailed breakdown is populated
    if (!parsed.ctrsDetailedScores) {
      const avg = parsed.overallScore || 80;
      parsed.ctrsDetailedScores = {
        agendaSetting: Math.round(avg * 0.95),
        feedback: Math.round(avg * 0.92),
        understanding: Math.round(parsed.competencyScores?.empathy || avg),
        interpersonalEffectiveness: Math.round(avg * 0.98),
        collaboration: Math.round(parsed.competencyScores?.therapeuticAlliance || avg),
        pacing: Math.round(parsed.competencyScores?.sessionStructuring || avg),
        guidedDiscovery: Math.round(parsed.competencyScores?.guidedDiscovery || avg),
        focusOnKeyCognitions: Math.round(avg * 0.96),
        strategyForChange: Math.round(avg * 0.94),
        techniqueApplication: Math.round(parsed.competencyScores?.interventionsPurity || avg),
        homework: Math.round(avg * 0.9)
      };
    }

    if (!parsed.allianceRuptureRepairAnalysis) {
      parsed.allianceRuptureRepairAnalysis = "روند کلی اتحاد درمانی سازنده بوده است؛ درمانگر توانست در لحظات حساس با همدلی نسبی مانع از گسست شدید رابطه شود.";
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/deep-evaluation:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در صدور گزارش ارزیابی عمیق' });
  }
});

// 5. Clinical Evidence & Guidelines Search (Search Grounding)
app.post('/api/clinical-search', async (req, res) => {
  try {
    const { query, category = 'treatment-protocol' } = req.body;

    const ai = getAI();

    const systemInstruction = `شما یک دستیار پژوهش بالینی و مستندسازی علمی در زمینه راهنماهای بالینی روانشناسی (DSM-5-TR, APA, NICE guidelines) هستید.
بر اساس نتایج جستجوی معتبر، پاسخ به پرسش بالینی یا استانداردهای درمانی مرتبط با کیس را به زبان فارسی دقیق، مستند و ساختاریافته بنویسید.
نکات کلیدی درمانی، پروتکل مداخله مبتنی بر شواهد و معیارهای تشخیصی را استخراج کنید.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: `پژوهش و راهنمای بالینی معتبر برای: ${query}` }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    const searchGroundingMetadata = response.candidates?.[0]?.groundingMetadata;

    res.json({
      success: true,
      answer: text,
      groundingMetadata: searchGroundingMetadata || null
    });
  } catch (error: any) {
    console.error('Error in /api/clinical-search:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در جستجوی شواهد بالینی' });
  }
});

// 6. Real-time Clinical Psychology Glossary & Terminology Lookup
app.post('/api/glossary-lookup', async (req, res) => {
  try {
    const { term } = req.body;
    if (!term || typeof term !== 'string') {
      return res.status(400).json({ success: false, error: 'اصطلاح جستجو الزامی است' });
    }

    const ai = getAI();

    const systemInstruction = `شما یک واژه‌نامه تخصصی و ارشد روانشناسی بالینی، روانکاوی، DSM-5-TR و روان‌درمانی معاصر (CBT, ACT, DBT) هستید.
کاربر یک واژه، مفهوم یا اصطلاح روانشناسی یا بالینی را جستجو کرده است.
یک تعریف جامع، دقیق و کاربردی به زبان فارسی در قالب JSON معتبر ارائه دهید.

فرمت JSON خروجی باید به صورت زیر باشد:
{
  "id": "شناسه انگلیسی کوتاه",
  "termFa": "نام دقیق فارسی اصطلاح",
  "termEn": "English Equivalent Term",
  "category": "یکی از: روان‌پویشی و دفاع‌ها / شناختی-رفتاری (CBT) / پذیرش و تعهد (ACT) / اصول مصاحبه و رابطه درمانی / آسیب‌شناسی و DSM-5 / رفتاردرمانی دیالکتیکی (DBT) / عمومی و علوم اعصاب",
  "definition": "تعریف علمی دقیق و قابل فهم برای دانشجوی روانشناسی (۲-۳ جمله)",
  "clinicalExample": "یک نمونه عینی و ملموس در اتاق درمان که نحوه بروز این مفهوم در گفتگو یا رفتار مراجع را نشان دهد",
  "therapeuticApplication": "توصیه عملی و تکنیکی به درمانگر برای نحوه مواجهه یا به کارگیری این مفهوم در جلسه درمان",
  "relatedTerms": ["اصطلاح ۱", "اصطلاح ۲", "اصطلاح ۳"],
  "tags": ["تگ۱", "تگ۲"]
}
فقط JSON معتبر بدون توضیحات اضافه برگردانید.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: `تعریف و تحلیل بالینی تخصصی اصطلاح: "${term}"` }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        id: 'term-' + Date.now(),
        termFa: term,
        termEn: term,
        category: 'عمومی و علوم اعصاب',
        definition: text,
        clinicalExample: 'نمونه بالینی در گفتگو با مراجع',
        therapeuticApplication: 'توجه به بازتاب هیجانی و حفظ رابطه درمانی',
        relatedTerms: [],
        tags: []
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/glossary-lookup:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در واژه‌نامه تخصصی' });
  }
});

// 7. Reflective Journal AI Mentor & Countertransference Resonance Echo
app.post('/api/reflective-insight', async (req, res) => {
  try {
    const { 
      caseTitle = '', 
      patientName = '', 
      dsmDiagnosis = '',
      overallMood = 'reflective',
      innerEmotionalState = '',
      countertransferenceAwareness = '',
      momentsOfBreakthrough = '',
      momentsOfStruggle = '',
      personalGrowthLesson = '',
      nextSessionCommitment = '',
      selfRatings = { personalConfidence: 7, emotionalGroundedness: 7, selfCompassion: 7, therapeuticPresence: 7 }
    } = req.body;

    const ai = getAI();

    const systemInstruction = `شما یک «سوپروایزر ارشد و منتور انسانی-وجودی روان‌درمانی (Humanistic-Existential & Relational Supervisor)» مانند اروین یالوم و کارل راجرز هستید.
دانشجوی روانشناسی پس از پایان جلسه درمانی، افکار، آسیب‌پذیری‌ها، احساسات درونی و انتقال متقابل (Countertransference) خود را در ژورنال تأملی شخصی‌اش به نگارش درآورده است.
وظیفه شما ارزیابی یا نمره‌دهی قضاوتی نیست؛ بلکه:
۱. در آغوش کشیدن هیجانات دانشجو با کلماتی همدلانه، گرم و پذیرش نامشروط.
۲. رمزگشایی از انتقال متقابل: توضیح اینکه احساسات برانگیخته‌شده در دانشجو (مانند عجله برای نجات مراجع، احساس ناتوانی، شرم، یا عصبانیت ملایم) چگونه آینه‌ای از دنیای درون مراجع است.
۳. طرح یک پرسش سقراطی/وجودی برای ژرف‌اندیشی بیشتر.
۴. یک توصیه کاربردی برای خودشفقت‌ورزی (Self-Compassion) و بهداشت روان درمانگر.
۵. اشاره به اینکه چگونه این بینش درونی، به بهبود کیفیت فنی مهارت‌های بالینی وی کمک خواهد کرد.

پاسخ را دقیقاً در قالب JSON زیر بازگردانید:
{
  "empathyForStudent": "پیام گرم و تحسین شجاعت دانشجو در نگاه کردن به درون خود و احساسات انسانی‌اش در جلسه (۲-۳ جمله)",
  "countertransferenceInsight": "بینش تحلیلی پیرامون انتقال متقابل و چرایی شکل‌گیری این احساسات در ارتباط با اختلال مراجع (۲-۳ جمله)",
  "growthPrompt": "یک سوال عمیق برای تأمل دانشجو در طول هفته (۱ جمله)",
  "mindfulSelfCareTip": "تمرین یا یادآوری مشخص برای خودشفقت‌ورزی و محافظت از مرزهای عاطفی درمانگر (۱-۲ جمله)",
  "clinicalResonanceNote": "نکته کلیدی درباره تبدیل این خودآگاهی درونی به مهارت بالینی در جلسه آینده"
}
فقط JSON معتبر بدون هیچ متن اضافی ارسال کنید.`;

    const promptText = `
اطلاعات کیس و مراجع: ${patientName || caseTitle || 'مراجع فرضی'} - تشخیص: ${dsmDiagnosis || 'کیس بالینی'}
حالت روحی ثبت‌شده توسط دانشجو: ${overallMood}
نمرات خودارزیابی دانشجو: اعتمادبه‌نفس ${selfRatings?.personalConfidence}/10، ثبات هیجانی ${selfRatings?.emotionalGroundedness}/10، شفقت به خود ${selfRatings?.selfCompassion}/10، حضور درمانی ${selfRatings?.therapeuticPresence}/10

تأملات درونی ثبت‌شده:
۱. احساسات درونی حین جلسه: "${innerEmotionalState || 'ثبت نشده'}"
۲. انتقال متقابل و محرک‌ها: "${countertransferenceAwareness || 'ثبت نشده'}"
۳. نقاط عطف و پیوند عمیق: "${momentsOfBreakthrough || 'ثبت نشده'}"
۴. لحظات استیصال یا احساس ناکارآمدی: "${momentsOfStruggle || 'ثبت نشده'}"
۵. درس‌های رشد فردی برای درمانگر: "${personalGrowthLesson || 'ثبت نشده'}"
۶. تعهد و تمرین برای جلسه بعد: "${nextSessionCommitment || 'ثبت نشده'}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.6,
      }
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        empathyForStudent: "شجاعت شما در مواجهه صمیمانه با احساسات درونی‌تان در اتاق درمان، نخستین و مهم‌ترین نشانه‌ی یک درمانگر بالینی اصیل و متعهد است.",
        countertransferenceInsight: "احساساتی که در طول این جلسه تجربه کردید، دقیقاً بازتاب اضطراب‌ها و استیصال‌های پنهان مراجع است که ناخودآگاه در رابطه درمانی فرافکنی شده است.",
        growthPrompt: "وقتی مراجع در برابر شما سکوت یا مقاومت می‌کند، کدام بخش از آسیب‌پذیری‌های فردی شما بیش از همه تحت فشار قرار می‌گیرد؟",
        mindfulSelfCareTip: "به یاد داشته باشید که درمانگران کامل وجود ندارند؛ شفقت به خود در لحظات درماندگی همان چیزی است که به شما فضای رشد می‌دهد.",
        clinicalResonanceNote: "با تبدیل این اضطراب به آگاهی، در جلسه آینده می‌توانید با حضور ذهنی آرام‌تر و بدون شتاب در حل مسئله در کنار مراجع باشید."
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/reflective-insight:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در صدور بازخورد بازتابی' });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PsychoSim Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Fatal server startup error:', err);
});
