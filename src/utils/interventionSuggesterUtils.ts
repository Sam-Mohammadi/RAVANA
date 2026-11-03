import { ClinicalCase, ClientState, ClinicalInterventionOption, InterventionSuggesterResult } from '../types';

/**
 * Detects whether the current patient state or last message signifies a moment of silence,
 * emotional impasse, withdrawal, or helplessness.
 */
export function detectSilenceOrHelplessness(
  lastPatientMessage?: { content: string; nonVerbalCue?: string; stateSnapshot?: ClientState },
  clientState?: ClientState
): { isDetected: boolean; trigger: 'silence' | 'helplessness' | 'resistance' | 'general'; title: string; description: string } {
  if (!lastPatientMessage) {
    return {
      isDetected: false,
      trigger: 'general',
      title: 'وضعیت عمومی جلسه',
      description: 'جلسه در حال جریان است.'
    };
  }

  const content = (lastPatientMessage.content || '').trim().toLowerCase();
  const cue = (lastPatientMessage.nonVerbalCue || '').trim().toLowerCase();
  const state = lastPatientMessage.stateSnapshot || clientState;

  // 1. Silence / Pauses indicators
  const silenceKeywords = [
    'سکوت', 'مکث', 'خیره', '...', 'نگاه به پایین', 'نگاه به زمین', 'نگاه به سقف', 
    'نگاه به در', 'بغض', 'نفس عمیق', 'سکوت طولانی', 'آه می‌کشد'
  ];
  const hasSilenceCue = silenceKeywords.some(k => cue.includes(k)) || content.includes('...') || content.length < 15;

  // 2. Helplessness indicators
  const helplessnessKeywords = [
    'نمی‌دونم', 'نمیدونم', 'چی بگم', 'فایده', 'فایده‌ای نداره', 'بی‌فایده', 
    'خسته شدم', 'درمونده', 'درمانده', 'گیج شدم', 'به بن‌بست خوردم', 'هیچی درست نمیشه',
    'نمی‌تونم', 'نمیتونم', 'از دست من کاری برنمیاد', 'طاقت ندارم', 'دستام می‌لرزه'
  ];
  const hasHelplessness = helplessnessKeywords.some(k => content.includes(k) || cue.includes(k));

  // 3. Resistance / Defensive indicators
  const resistanceKeywords = [
    'نمی‌خوام در این مورد حرف بزنم', 'ربطی نداره', 'به نظر شما چیه', 'چرا می‌پرسید', 
    'نمی‌دونم چرا اینجام', 'شما هم مثل بقیه', 'تلف کردن وقته'
  ];
  const hasResistance = resistanceKeywords.some(k => content.includes(k)) || (state && state.resistance >= 65);

  if (hasSilenceCue || content === '...' || content === '') {
    return {
      isDetected: true,
      trigger: 'silence',
      title: 'لحظه سکوت یا وقفه دراماتیک بالینی (Clinical Silence)',
      description: 'مراجع دچار وقفه کلامی شده یا به نشانه‌های غیرکلامی پناه برده است؛ زمان طلایی برای بازتاب احساس یا پردازش حضور.'
    };
  }

  if (hasHelplessness || (state && state.anxiety >= 75)) {
    return {
      isDetected: true,
      trigger: 'helplessness',
      title: 'درماندگی، خستگی مفرط یا بن‌بست شناختی (Client Helplessness)',
      description: 'مراجع احساس بی‌اثری، انسداد شناختی یا خستگی هیجانی ابراز می‌کند و نیازمند تثبیت امن و اعتبارسنجی است.'
    };
  }

  if (hasResistance) {
    return {
      isDetected: true,
      trigger: 'resistance',
      title: 'مقاومت تدافعی یا محافظت عاطفی (Defensive Withdrawal)',
      description: 'مراجع با عقب‌نشینی یا تردید کلامی در حال محافظت از خود در برابر درد عاطفی است.'
    };
  }

  return {
    isDetected: false,
    trigger: 'general',
    title: 'تداوم گفتگوی بالینی',
    description: 'جهت پیشبرد ساختارمند جلسه می‌توانید از یکی از ۳ مداخله تأیید شده استفاده کنید.'
  };
}

/**
 * Generates 3 approved clinical interventions tailored to the specific case,
 * trigger (silence / helplessness), and psychological dynamics.
 */
export function generateLocalClinicalInterventions(
  currentCase: ClinicalCase,
  lastPatientMessageContent: string,
  trigger: 'silence' | 'helplessness' | 'resistance' | 'general'
): InterventionSuggesterResult {
  const patientName = currentCase.patientName || 'مراجع';
  const cleanSpeech = lastPatientMessageContent ? `«${lastPatientMessageContent.slice(0, 70)}${lastPatientMessageContent.length > 70 ? '...' : ''}»` : '';

  // 1. بازتاب احساس (Feeling Reflection)
  let reflectionOption: ClinicalInterventionOption;
  // 2. شفاف‌سازی (Clarification)
  let clarificationOption: ClinicalInterventionOption;
  // 3. مواجهه بالینی ملایم (Gentle Confrontation)
  let confrontationOption: ClinicalInterventionOption;

  if (trigger === 'silence') {
    reflectionOption = {
      id: 'opt-reflection-silence',
      category: 'reflection',
      categoryLabel: 'بازتاب احساس (Feeling Reflection)',
      shortCategory: 'بازتاب احساس',
      therapeuticSchool: 'مراجع‌محور و متمرکز بر هیجان (EFT)',
      clinicalObjective: 'نام‌گذاری هیجان ناگفته در بطن سکوت بدون قطع ناگهانی فضای امن مراجع',
      suggestedPhrasing: `متوجه این سکوت و سنگینی فضا می‌شم، ${patientName} جان. حس می‌کنم درست در همین لحظه کلماتی هستن که گفتنشون برات بی‌نهایت سخته یا حجم احساساتت اون‌قدر بالاست که توی کلمات جا نمی‌شن... مایلید کمی با هم در همین حس بمونیم؟`,
      rationale: 'سکوت بالینی نباید فوراً با سوال شکسته شود. بازتاب عاطفی به مراجع نشان می‌دهد که درمانگر تنهایی و بار ناگفته او را تاب می‌آورد.',
      watchOutWarning: 'به هیچ وجه بلافاصله پس از سکوت، سوال بله/خیر نپرسید؛ ریتم تنفس و طنین صدای خود را آرام نگه دارید.',
      expectedAllianceImpact: '+۲ (تقویت امنیت دلبستگی درمانی)'
    };

    clarificationOption = {
      id: 'opt-clarification-silence',
      category: 'clarification',
      categoryLabel: 'شفاف‌سازی پدیدارشناختی (Phenomenological Clarification)',
      shortCategory: 'شفاف‌سازی',
      therapeuticSchool: 'شناختی-رفتاری و پدیدارشناختی (CBT / Gestalt)',
      clinicalObjective: 'وارسی ملایم افکار و نشانه‌های بدنی همراه با سکوت در این لحظه مشخص',
      suggestedPhrasing: `الان که این سکوت بینمون حاکم شد، می‌تونیم آروم بررسی کنیم که در این چند ثانیه دقیقاً چه تصویری یا فکری از ذهنت گذشت؟ یا در بدنت (توی قفسه سینه یا گلوت) چه حسی بیدار شد؟`,
      rationale: 'شفاف‌سازی به تفکیک احساس بدنی از محتوای فکری کمک می‌کند و تجربه مبهم سکوت را به داده‌های قابل وارسی تبدیل می‌نماید.',
      watchOutWarning: 'از لحن کنجکاوی قضاوتی بپرهیزید؛ با کنجکاوی مشترک و مشارکتی پرسش کنید.',
      expectedAllianceImpact: '+۱ (ارتقای خودآگاهی مراجع)'
    };

    confrontationOption = {
      id: 'opt-confrontation-silence',
      category: 'confrontation',
      categoryLabel: 'مواجهه ملایم با سد ارتباطی (Gentle Confrontation of Impasse)',
      shortCategory: 'مواجهه ملایم',
      therapeuticSchool: 'روان‌پویشی کوتاه‌مدت (ISTDP) و بین‌فردی',
      clinicalObjective: 'مواجهه صادقانه و همدلانه با دیوار دفاعی یا ترسی که درست در همین لحظه در رابطه شکل گرفته',
      suggestedPhrasing: `متوجه شدم درست وقتی به موضوع ${currentCase.symptoms?.[0] || currentCase.chiefComplaint || 'اصلی'} نزدیک می‌شیم، ناگهان انگار یک پرده سکوت یا مانع بزرگ بین ما کشیده می‌شه. آیا این عقب‌نشینی بهت کمک می‌کنه از خودت محافظت کنی، یا نگران قضاوت من در این اتاق هستی؟`,
      rationale: 'مواجهه بالینی ملایم تعارض میان تمایل به بهبودی و مقاومت ناخودآگاه در برابر درد را روی میز می‌گذارد.',
      watchOutWarning: 'فقط زمانی استفاده شود که همدلی پایه‌ای شکل گرفته باشد؛ هرگز نباید شبیه توبیخ شنیده شود.',
      expectedAllianceImpact: '+۲ (شکستن سد دفاعی به سود اتحاد کاری)'
    };
  } else if (trigger === 'helplessness') {
    reflectionOption = {
      id: 'opt-reflection-helplessness',
      category: 'reflection',
      categoryLabel: 'بازتاب احساس (Feeling Reflection)',
      shortCategory: 'بازتاب احساس',
      therapeuticSchool: 'درمان مبتنی بر پذیرش و تعهد (ACT) و EFT',
      clinicalObjective: 'اعتبارسنجی درماندگی مراجع و رهانیدن او از احساس تنهایی در برابر رنج',
      suggestedPhrasing: `می‌شنوم که چقدر خسته‌ای و چقدر احساس می‌کنی همه‌چیز به بن‌بست رسیده. گفتن این حس درماندگی شجاعت زیادی می‌خواد، و کاملاً طبیعیه که زیر این بار سنگین احساس کنی دیگر توانی برات نمونده...`,
      rationale: 'درماندگی زمانی تشدید می‌شود که مراجع احساس کند به خاطر درماندگی‌اش قضاوت یا سرزنش می‌شود. بازتاب عمیق، احساس پذیرش بی‌قیدوشرط می‌آفریند.',
      watchOutWarning: 'از آرامش‌بخشی کاذب (مثل: «نگران نباش درست میشه») اکیداً خودداری کنید.',
      expectedAllianceImpact: '+۲ (کاهش تنش و انزوای عاطفی مراجع)'
    };

    clarificationOption = {
      id: 'opt-clarification-helplessness',
      category: 'clarification',
      categoryLabel: 'شفاف‌سازی شناختی (Cognitive Clarification & Deconstruction)',
      shortCategory: 'شفاف‌سازی',
      therapeuticSchool: 'شناختی-رفتاری (CBT)',
      clinicalObjective: 'تفکیک مفهوم کلی و تعمیم‌یافته «فایده نداره / هیچ‌کاری نمیشه کرد» به اجزای مشخص',
      suggestedPhrasing: `وقتی می‌گی «دیگه نمی‌دونم چی بگم» یا احساس می‌کنی بن‌بسته، دقیقاً از چه بخشی از ماجرا ناامید شدی؟ بیایم با هم این کلمه «بی‌فایده بودن» رو باز کنیم و ببینیم سخت‌ترین گره‌اش کجاست.`,
      rationale: 'درماندگی اغلب ناشی از اعوجاج شناختی فاجعه‌سازی و تفکر همه یا هیچ است. شفاف‌سازی ابعاد مسئله را تفکیک‌پذیر می‌کند.',
      watchOutWarning: 'از به چالش کشیدن شتابزده بپرهیزید؛ ابتدا فضا را مهیا کنید سپس به موشکافی بپردازید.',
      expectedAllianceImpact: '+۱ (هدایت مراجع از آشفتگی به نظم ذهنی)'
    };

    confrontationOption = {
      id: 'opt-confrontation-helplessness',
      category: 'confrontation',
      categoryLabel: 'مواجهه ملایم با درماندگی آموخته‌شده (Gentle Confrontation of Helplessness)',
      shortCategory: 'مواجهه ملایم',
      therapeuticSchool: 'روان‌پویشی و گشتالت',
      clinicalObjective: 'مواجهه با ناهماهنگی میان حضور در جلسه و ادعای بیهوده بودن همه‌چیز',
      suggestedPhrasing: `از یک طرف می‌گی همه‌چیز تموم شده و فایده‌ای نداره، اما از طرف دیگه، با تمام این خستگی امروز اینجایی و روبه‌روی من نشستی. این نشون می‌ده بخشی از وجودت هنوز با تمام توان داره برای نجات خودش می‌جنگه... نظرت در مورد این دو بخش وجودت چیه؟`,
      rationale: 'این مداخله نیروی سالم و متعهد مراجع را در برابر بخش ناامید و تسلیم‌شده برجسته می‌کند.',
      watchOutWarning: 'این مواجهه باید سرشار از گرما و تحسین تاب‌آوری مراجع باشد، نه مچ‌گیری منطقی.',
      expectedAllianceImpact: '+۳ (بازگرداندن حس عاملیت شخصی)'
    };
  } else if (trigger === 'resistance') {
    reflectionOption = {
      id: 'opt-reflection-resistance',
      category: 'reflection',
      categoryLabel: 'بازتاب احساس (Feeling Reflection)',
      shortCategory: 'بازتاب احساس',
      therapeuticSchool: 'روابط موضوعی و EFT',
      clinicalObjective: 'اعتبارسنجی حق مراجع برای بی‌اعتمادی یا احتیاط در فضای درمان',
      suggestedPhrasing: `احساس می‌کنم حرف زدن درباره این مسئله فشار و اضطراب زیادی بهت وارد می‌کنه و حق داری اگر در این لحظه نخوای خیلی سریع جلو بری یا به من بی‌اعتماد باشی...`,
      rationale: 'پذیرش مقاومت به جای جنگیدن با آن، دفاع‌ها را به سرعت نرم می‌کند.',
      watchOutWarning: 'اصرار به ادامه بحث نکنید؛ احترام به مقاومت خود یک مداخله قدرتمند است.',
      expectedAllianceImpact: '+۲ (کاهش حالت تدافعی)'
    };

    clarificationOption = {
      id: 'opt-clarification-resistance',
      category: 'clarification',
      categoryLabel: 'شفاف‌سازی مرزهای درمانی (Boundary Clarification)',
      shortCategory: 'شفاف‌سازی',
      therapeuticSchool: 'شناختی-رفتاری و بین‌فردی',
      clinicalObjective: 'شفاف‌سازی ابهامات مراجع در مورد اهداف و روند درمان',
      suggestedPhrasing: `می‌تونیم مشخص کنیم دقیقاً چه چیزی در این مکالمه باعث شد حس کنی در تنگنا قرار گرفتی یا احساس ناخوشایندی پیدا کنی؟ هدف ما در این اتاق حرکت با سرعت دلخواه شماست.`,
      rationale: 'شفاف‌سازی روند کنترل جلسه را به طور مشارکتی به بیمار بازمی‌گرداند.',
      watchOutWarning: 'توجیه نکنید؛ فقط روند را شفاف سازید.',
      expectedAllianceImpact: '+۱ (ترمیم اتحاد درمانی)'
    };

    confrontationOption = {
      id: 'opt-confrontation-resistance',
      category: 'confrontation',
      categoryLabel: 'مواجهه ملایم با الگوی اجتناب (Gentle Confrontation of Avoidance)',
      shortCategory: 'مواجهه ملایم',
      therapeuticSchool: 'روان‌پویشی فشرده (ISTDP)',
      clinicalObjective: 'مشخص ساختن قیمت روانی اجتناب از درد در زندگی روزمره',
      suggestedPhrasing: `آیا متوجه می‌شی که هر بار می‌خوایم به دردی که بیشترین رنج رو بهت می‌ده نزدیک بشیم، این ترمز کشیده می‌شه؟ فکر می‌کنی در زندگی بیرون از این اتاق هم این الگوی عقب‌نشینی چقدر تکرار شده؟`,
      rationale: 'وصل کردن تعارض درون جلسه به تعارضات بیرونی مراجع جهت بصیرت‌بخشی.',
      watchOutWarning: 'قبل از آماده بودن مراجع برای شنیدن، مواجهه نکنید.',
      expectedAllianceImpact: '+۲ (ارتقای بینش روانشناختی)'
    };
  } else {
    // General case
    reflectionOption = {
      id: 'opt-reflection-general',
      category: 'reflection',
      categoryLabel: 'بازتاب احساس (Feeling Reflection)',
      shortCategory: 'بازتاب احساس',
      therapeuticSchool: 'مراجع‌محور (کارل راجرز)',
      clinicalObjective: 'انعکاس بار هیجانی پیام اخیر مراجع جهت عمیق‌تر کردن پیوند درمانی',
      suggestedPhrasing: cleanSpeech 
        ? `وقتی می‌گی ${cleanSpeech}، حس می‌کنم بار هیجانی عمیقی پشت این کلماته و شاید کمتر کسی تا امروز این درد رو واقعاً درک کرده باشه...`
        : `می‌شنوم که تجربه بسیار پرتنشی رو از سر گذروندی و حس می‌کنم ناگفته‌های زیادی هنوز درونت هست که مشتاقم بشنوم...`,
      rationale: 'بازتاب احساس زیربنایی، امنیت خاطر مراجع را تضمین می‌کند.',
      watchOutWarning: 'کلمات خود مراجع را طوطی‌وار تکرار نکنید، بر احساس پنهان تمرکز کنید.',
      expectedAllianceImpact: '+۲'
    };

    clarificationOption = {
      id: 'opt-clarification-general',
      category: 'clarification',
      categoryLabel: 'شفاف‌سازی و کشف هدایت‌شده (Guided Clarification)',
      shortCategory: 'شفاف‌سازی',
      therapeuticSchool: 'شناختی-رفتاری (CBT سقراطی)',
      clinicalObjective: 'روشن ساختن گزاره‌های مبهم و اتصال رخداد به احساس و رفتار',
      suggestedPhrasing: `می‌شه کمی بیشتر برام توضیح بدی که در اون لحظه خاص، وقتی این اتفاق افتاد، اولین فکری که از سرت گذشت چی بود و چه تصمیمی گرفتی؟`,
      rationale: 'کشف هدایت‌شده بدون تحمیل دیدگاه درمانگر، مراجع را به تحلیل الگوهای خود وا می‌دارد.',
      watchOutWarning: 'از پرسیدن سوالات متوالی که حس بازجویی ایجاد کند بپرهیزید.',
      expectedAllianceImpact: '+۱'
    };

    confrontationOption = {
      id: 'opt-confrontation-general',
      category: 'confrontation',
      categoryLabel: 'مواجهه ملایم با تعارض شناختی-هیجانی (Gentle Confrontation)',
      shortCategory: 'مواجهه ملایم',
      therapeuticSchool: 'گشتالت و CBT موج سوم',
      clinicalObjective: 'آشکار ساختن تضاد میان ارزش‌ها یا خواسته‌ها با رفتارهای اجتنابی مراجع',
      suggestedPhrasing: `متوجه یک تضاد جالب در کلامت می‌شم: از یک طرف عمیقاً به ${currentCase.recommendedApproach || 'بهبودی'} و تغییر شرایط اشتیاق داری، اما از طرف دیگه هم‌زمان داری رفتاری انجام می‌دی که دقیقا تو رو دور می‌کنه... به نظرت چه چیزی مانع می‌شه؟`,
      rationale: 'مواجهه به مراجع کمک می‌کند تعارضات درونی خود را بدون احساس گناه ببیند.',
      watchOutWarning: 'لحن شما باید کاملاً مهربان، بدون قضاوت و با هدف هم‌فکری باشد.',
      expectedAllianceImpact: '+۲'
    };
  }

  const triggerTitles = {
    silence: 'لحظه سکوت یا وقفه دراماتیک بالینی (Clinical Silence)',
    helplessness: 'درماندگی، خستگی مفرط یا بن‌بست شناختی (Client Helplessness)',
    resistance: 'مقاومت تدافعی یا محافظت عاطفی (Defensive Withdrawal)',
    general: 'مداخلات بالینی راهبردی پیشنهادی'
  };

  const triggerDescs = {
    silence: 'مراجع دچار وقفه کلامی شده یا به نشانه‌های غیرکلامی پناه برده است؛ زمان طلایی برای بازتاب احساس، شفاف‌سازی یا مواجهه ملایم.',
    helplessness: 'مراجع احساس بی‌اثری، بن‌بست شناختی یا خستگی هیجانی ابراز می‌کند و نیازمند مداخله هدفمند بالینی است.',
    resistance: 'مراجع با عقب‌نشینی یا تردید کلامی در حال محافظت از خود در برابر درد عاطفی است.',
    general: 'جهت پیشبرد ساختارمند جلسه می‌توانید از یکی از ۳ مداخله تأیید شده زیر استفاده کنید.'
  };

  return {
    triggerDetected: trigger,
    triggerTitle: triggerTitles[trigger],
    triggerDescription: triggerDescs[trigger],
    interventions: [reflectionOption, clarificationOption, confrontationOption]
  };
}

/**
 * Fetches AI-tailored intervention suggestions from backend if available,
 * with instantaneous local heuristic fallback.
 */
export async function fetchInterventionSuggestions(
  currentCase: ClinicalCase,
  patientLastUtterance: string,
  clientState?: ClientState,
  triggerOverride?: 'silence' | 'helplessness' | 'resistance' | 'general'
): Promise<InterventionSuggesterResult> {
  const detection = detectSilenceOrHelplessness(
    { content: patientLastUtterance, stateSnapshot: clientState },
    clientState
  );
  const effectiveTrigger = triggerOverride || detection.trigger;

  // Local baseline (always instant and robust)
  const localResult = generateLocalClinicalInterventions(currentCase, patientLastUtterance, effectiveTrigger);

  try {
    const res = await fetch('/api/suggest-interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientLastUtterance,
        caseProfile: currentCase,
        clientState,
        triggerType: effectiveTrigger
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.interventions) && data.data.interventions.length >= 3) {
        return {
          triggerDetected: effectiveTrigger,
          triggerTitle: data.data.triggerTitle || localResult.triggerTitle,
          triggerDescription: data.data.triggerDescription || localResult.triggerDescription,
          interventions: data.data.interventions
        };
      }
    }
  } catch (err) {
    console.warn('Backend intervention suggester API unavailable, using local clinical engine:', err);
  }

  return localResult;
}
