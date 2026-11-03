import { ClinicalCase, PatientPersonaConfig, PersonaPresetId, PersonaToneStyle } from '../types';

export const DEFAULT_PERSONA_PRESETS: PatientPersonaConfig[] = [
  {
    presetId: 'standard',
    name: 'استاندارد و متعادل (Standard Baseline)',
    shortLabel: 'استاندارد',
    description: 'رفتار واقع‌گرایانه متناسب با پرونده بالینی DSM-5؛ احتیاط معمول در جلسه اول همراه با پذیرش تدریجی در صورت همدلی درمانگر.',
    candorLevel: 45,
    defensivenessLevel: 40,
    toneStyle: 'balanced_natural',
    toneStyleLabel: 'طبیعی و نوسانی',
    behavioralGuidance: 'بیمار با لحنی محترمانه اما همراه با اضطراب طبیعی جلسه اول صحبت می‌کند. در صورت بازتاب همدلانه گشوده‌تر می‌شود و در صورت سرزنش یا سوالات بازجویانه محتاط می‌گردد.',
  },
  {
    presetId: 'guarded_defensive',
    name: 'تدافعی، محتاط و کم‌اعتماد (Guarded & Defensive)',
    shortLabel: 'تدافعی و محتاط',
    description: 'گارد عاطفی سنگین، پاسخ‌های مقطوع، سوءظن خفیف نسبت به قضاوت درمانگر، و فرار از موشکافی نقاط آسیب‌پذیر با توجیه‌تراشی و انکار.',
    candorLevel: 20,
    defensivenessLevel: 80,
    toneStyle: 'hesitant_guarded',
    toneStyleLabel: 'محتاط، مردد و محافظه‌کار',
    behavioralGuidance: 'بیمار به سرعت اعتماد نمی‌کند. احساس می‌کند درمانگر ممکن است او را سرزنش یا برچسب‌گذاری کند. پاسخ‌ها کوتاه است، دست‌به‌سینه می‌نشیند و به راحتی اطلاعات درونی را فاش نمی‌کند.',
  },
  {
    presetId: 'candid_expressive',
    name: 'صریح، خودافشاگر و بی‌پرده (Candid & Self-Disclosing)',
    shortLabel: 'صریح و بی‌پرده',
    description: 'بیان بی‌سانسور و شفاف عواطف و تجارب ناخوشایند؛ احساسات فوران می‌کند و دانشجو باید مدیریت زمان، مرزها و مهار هیجان را تمرین کند.',
    candorLevel: 85,
    defensivenessLevel: 25,
    toneStyle: 'direct_blunt',
    toneStyleLabel: 'صریح، برون‌ریز و شفاف',
    behavioralGuidance: 'بیمار مشتاقانه و بدون رودربایستی از ترس‌ها، رنج‌ها و خطاهایش می‌گوید. هیجان بالایی نشان می‌دهد و منتظر است ببیند آیا درمانگر توانایی ظرفیت‌سازی و ساختاربندی این حجم از صداقت را دارد یا خیر.',
  },
  {
    presetId: 'skeptical_challenging',
    name: 'شکاک، منتقد و چالش‌گر (Skeptical & Challenging)',
    shortLabel: 'شکاک و چالش‌گر',
    description: 'زیر سوال بردن سودمندی روان‌درمانی، سن و صلاحیت دانشجو؛ بررسی مقاومت درمانگر در برابر خشم و آزمودن خونسردی حرفه‌ای.',
    candorLevel: 65,
    defensivenessLevel: 85,
    toneStyle: 'sarcastic_defensive',
    toneStyleLabel: 'طعنه‌آمیز، منتقد و منقبض',
    behavioralGuidance: 'بیمار با تردید و کنایه صحبت می‌کند («فکر نکنم شما هم بتونید کمکی کنید»، «این حرفا رو توی کتابا نوشتید»). درمانگر باید تله جنگ قدرت را بشناسد و با پذیرش و بازتاب آرام پیش برود.',
  },
  {
    presetId: 'withdrawn_passive',
    name: 'منفعل، درمانده و مستأصل (Withdrawn & Resigned)',
    shortLabel: 'منفعل و درمانده',
    description: 'درماندگی آموخته‌شده شدید، انرژی کلامی بسیار پایین، پاسخ‌های «نمی‌دونم»، «فرقی نداره»، وقفه‌ها و سکوت‌های بالینی پرتکرار.',
    candorLevel: 25,
    defensivenessLevel: 65,
    toneStyle: 'resigned_hopeless',
    toneStyleLabel: 'تسلیم‌شده، خسته و آرام',
    behavioralGuidance: 'بیمار انرژی روانی پایینی دارد، سرش را پایین می‌اندازد، آه می‌کشد و انگیزه کمی برای حرف زدن دارد. دانشجو باید صبوری، تاب‌آوری سکوت و اعتبارسنجی رنج مراجع را تمرین کند.',
  },
  {
    presetId: 'intellectualizing',
    name: 'منطق‌تراش، عقلانی و فاصله‌دار (Intellectualizing & Analytical)',
    shortLabel: 'منطق‌تراش و عقلانی',
    description: 'پناه بردن به واژگان علمی و تحلیل عقلانی به عنوان مکانیسم دفاعی، به جای تجربه و ابراز مستقیم احساسات اصیل انسانی.',
    candorLevel: 50,
    defensivenessLevel: 75,
    toneStyle: 'clinical_analytical',
    toneStyleLabel: 'منطقی، کتابی و دور از هیجان',
    behavioralGuidance: 'بیمار مانند یک سخنران یا مقاله دانشگاهی درباره مشکلاتش حرف می‌زند تا رنج هیجانی را حس نکند. چالش دانشجو فرود آوردن مراجع از عقل‌گرایی مفرط به بدن و هیجان است.',
  }
];

export const TONE_STYLES_LIST: { id: PersonaToneStyle; label: string; description: string }[] = [
  {
    id: 'balanced_natural',
    label: 'طبیعی و نوسانی (Natural & Variable)',
    description: 'واکنش‌های کلامی واقع‌بینانه و انسانی متناسب با جریان جلسه.'
  },
  {
    id: 'hesitant_guarded',
    label: 'محتاط، مردد و محافظه‌کار (Guarded & Hesitant)',
    description: 'لکنت، مکث‌های مکرر، تک‌جمله‌ای و پرهیز از شفاف‌گویی.'
  },
  {
    id: 'direct_blunt',
    label: 'صریح، برون‌ریز و بی‌پرده (Direct & Expressive)',
    description: 'بیان مستقیم بدون لفافه، خودافشاگری سریع و جسورانه.'
  },
  {
    id: 'sarcastic_defensive',
    label: 'طعنه‌آمیز، منتقد و چالش‌طلب (Challenging & Sarcastic)',
    description: 'لحن نیش‌دار، زیر سوال بردن جملات درمانگر و بررسی تسلط او.'
  },
  {
    id: 'resigned_hopeless',
    label: 'تسلیم‌شده، خسته و آرام (Resigned & Fatigued)',
    description: 'صدای ضعیف، بی‌حوصلگی کلامی، سکوت‌های کش‌دار و لحن مأیوس.'
  },
  {
    id: 'clinical_analytical',
    label: 'منطقی، کتابی و رسمی (Formal & Intellectualized)',
    description: 'استفاده از کلمات رسمی و اصطلاحات تحلیلی بدون ابراز عاطفه.'
  }
];

export function getCandorDescriptor(level: number): {
  label: string;
  badgeClass: string;
  explanation: string;
} {
  if (level <= 30) {
    return {
      label: 'کتمان‌گر و طفره‌رو (پایین)',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      explanation: 'بیمار حقیقت احساسات و افکارش را پنهان می‌کند؛ دانشجو باید فنون اعتمادسازی و کشف تدریجی را به کار گیرد.'
    };
  }
  if (level <= 60) {
    return {
      label: 'صراحت مشروط و متوسط (معمول)',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      explanation: 'صراحت مراجع منوط به فضای امن اتاق است؛ در صورت پذیرش باز می‌شود و در صورت عجله عقب می‌نشیند.'
    };
  }
  return {
    label: 'بی‌پرده، شفاف و خودافشاگر (بالا)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    explanation: 'مراجع بدون روتوش از خصوصی‌ترین تعارضاتش می‌گوید؛ نیازمند ساختاربندی، هدایت هدفمند و مدیریت غلیان عاطفی.'
  };
}

export function getDefensivenessDescriptor(level: number): {
  label: string;
  badgeClass: string;
  explanation: string;
} {
  if (level <= 35) {
    return {
      label: 'پذیرنده و همکار (پایین)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      explanation: 'مقاومت بسیار کم؛ مراجع آماده همکاری است و مداخلات درمانگر را به راحتی مورد وارسی قرار می‌دهد.'
    };
  }
  if (level <= 65) {
    return {
      label: 'مقاومت معمول و نوسانی (متوسط)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      explanation: 'مقاومت در هنگام مواجهه با دردهای اصلی ظاهر می‌شود؛ رفتاری شبیه به اکثریت مراجعین واقعی در اتاق درمان.'
    };
  }
  return {
    label: 'تدافعی شدید و گارد نفوذناپذیر (بالا)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    explanation: 'دیوارهای محکم دفاعی، فرار از مسئولیت، توجیه‌تراشی و چالشگری؛ چالشی عالی برای سنجش تسلط دانشجویان پیشرفته.'
  };
}

/**
 * Generates an appropriate initial opening greeting adapted to both the patient's case
 * and the specific configured persona (candor, defensiveness, tone).
 */
export function createInitialGreeting(
  currentCase: ClinicalCase,
  persona: PatientPersonaConfig
): {
  speech: string;
  internalThought: string;
  nonVerbalCue: string;
} {
  const name = currentCase.patientName;
  const isFemale = currentCase.gender === 'female';

  if (persona.presetId === 'guarded_defensive' || persona.defensivenessLevel >= 75) {
    return {
      speech: `سلام... [دست‌به‌سینه می‌نشیند و نگاهش را به پنجره می‌دوزد] راستش فقط به اصرار خانواده‌ام امروز اومدم اینجا... بعید می‌دونم واقعاً گفتن این حرف‌ها فایده‌ای داشته باشه، اما گفتن حداقل یک‌بار بیام...`,
      internalThought: 'امیدوارم این یکی هم نخواد منو سرزنش کنه یا بگه همه‌چیز تقصیر خودته... از قضاوت شدن متنفرم.',
      nonVerbalCue: 'حالت چهره بسته، دست‌به‌سینه، فاصله گرفتن از میز درمانگر'
    };
  }

  if (persona.presetId === 'candid_expressive' || persona.candorLevel >= 75) {
    return {
      speech: `سلام دکتر... [نفس عمیقی می‌کشد و مستقیم و با چشمانی نگران به چشمانتان نگاه می‌کند] راستش دیگه به آخر خط رسیدم و خسته شدم از اینکه پیش بقیه فیلم بازی کنم. شکایت اصلی من اینه که: ${currentCase.chiefComplaint}. فقط بگید من چطور می‌تونم از دست این جهنم خلاص بشم؟`,
      internalThought: 'دیگه چیزی برای از دست دادن ندارم، اگر این درمانگر هم نتونه کمکم کنه واقعاً نمی‌دونم چه بلایی سرم میاد...',
      nonVerbalCue: 'لحن شتاب‌زده، نگاه مستقیم، آمادگی بالا برای برون‌ریزی عاطفی'
    };
  }

  if (persona.presetId === 'skeptical_challenging') {
    return {
      speech: `سلام... [کیفش را روی پا نگه می‌دارد و با دقت شما را برانداز می‌کند] راستش قبل از هر صحبتی می‌خواستم بدونم رویکرد شما چیه و قبلاً تجربه موفق با کیس‌های مشابه ${currentCase.dsmDiagnosis} داشتید؟ چون قبلاً پیش دو نفر دیگه هم رفتم و حس کردم فقط زمانم تلف شد...`,
      internalThought: 'باید ببینم این یکی چقدر سواد داره یا فقط حرف‌های تکراری و مشاوره‌ای می‌زنه... اگر بخواد تظاهر کنه سریع می‌فهمم.',
      nonVerbalCue: 'ابروهای بالا رفته، نگاه ارزیابانه و موشکافانه به درمانگر'
    };
  }

  if (persona.presetId === 'withdrawn_passive') {
    return {
      speech: `سلام... [آهسته زمزمه می‌کند و سرش را به سمت زمین پایین نگه می‌دارد] ... راستش خیلی خسته‌ام... اصلاً نمی‌دونم از کجا باید شروع کنم یا چی بگم... همه‌چیز انگار بن‌بسته...`,
      internalThought: 'کاش امروز خونه می‌موندم... حرف زدن این‌قدر سخته که اصلاً حسش نیست، هیچ‌کس نمی‌تونه منو نجات بده...',
      nonVerbalCue: 'صدای کم‌رمق، شانه افتاده، نگاه ثابت به زمین، وقفه‌های طولانی'
    };
  }

  if (persona.presetId === 'intellectualizing') {
    return {
      speech: `سلام وقت بخیر. [با وقار و کاملاً شق‌ورق می‌نشیند] من مقالات مرتبط با ${currentCase.dsmDiagnosis} و رویکرد ${currentCase.recommendedApproach} رو به صورت مقایسه‌ای مطالعه کردم و می‌خواستم از بُعد علمی بررسی کنیم که آیا شاخص‌های شناختی-رفتاری من تطابق کامل با این نشانگان دارن یا یک پاسخ واکنشی موقته...`,
      internalThought: 'تا زمانی که همه‌چیز رو در قالب فرمول و نظریه علمی نگه دارم، هیچ‌کس متوجه نمی‌شه که درونم چقدر احساس وحشت و ناتوانی می‌کنم.',
      nonVerbalCue: 'لحن سنجیده و آکادمیک، حرکات کنترل‌شده دست، چهره بی‌تفاوت نسبت به هیجان'
    };
  }

  // Standard Baseline
  return {
    speech: `سلام دکتر... [${isFemale ? 'نگاهی مضطرب می‌اندازد و با گوشه شالش بازی می‌کند' : 'با طمأنینه و نگاه به پایین می‌نشیند'}] راستش خیلی برام سخت بود که امروز بیام اینجا... شکایت اصلیم اینه که: ${currentCase.chiefComplaint}`,
    internalThought: 'امیدوارم درمانگر متوجه عمق ترسم بشه و بدون قضاوت کمکم کنه...',
    nonVerbalCue: 'لرزش خفیف در صدا، نگاه‌های متناوب به درمانگر و زمین'
  };
}

export function getDefaultPersonaForCase(c: ClinicalCase): PatientPersonaConfig {
  const base = { ...DEFAULT_PERSONA_PRESETS[0] };
  if (c.difficulty === 'advanced') {
    base.defensivenessLevel = 70;
    base.candorLevel = 35;
  } else if (c.difficulty === 'beginner') {
    base.defensivenessLevel = 30;
    base.candorLevel = 55;
  }
  return base;
}
