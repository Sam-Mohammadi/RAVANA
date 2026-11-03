import React, { useState } from 'react';
import { 
  PlusCircle, 
  X, 
  Sparkles, 
  ShieldAlert, 
  BookOpen, 
  User, 
  Save 
} from 'lucide-react';
import type { ClinicalCase, ClinicalDifficulty, TherapeuticApproach } from '../types';

interface CaseCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCase: (newCase: ClinicalCase) => Promise<void>;
}

export const CaseCreatorModal: React.FC<CaseCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveCase,
}) => {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [occupation, setOccupation] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('مجرد');
  const [title, setTitle] = useState('');
  const [dsmDiagnosis, setDsmDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [history, setHistory] = useState('');
  const [difficulty, setDifficulty] = useState<ClinicalDifficulty>('intermediate');
  const [approach, setApproach] = useState<TherapeuticApproach>('CBT');
  const [defenses, setDefenses] = useState('فاجعه‌سازی، اجتناب، توجیه‌تراشی');
  const [schemas, setSchemas] = useState('معیارهای سرسختانه، نقص و شرم');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !chiefComplaint.trim() || !dsmDiagnosis.trim()) return;

    setIsSaving(true);
    const newCase: ClinicalCase = {
      id: `custom-case-${Date.now()}`,
      title: title.trim() || `کیس بالینی: ${patientName}`,
      patientName: patientName.trim(),
      age: Number(age) || 28,
      gender,
      occupation: occupation.trim() || 'کارمند',
      maritalStatus: maritalStatus.trim() || 'مجرد',
      avatarColor: gender === 'female' ? 'from-purple-600 to-pink-600' : 'from-indigo-600 to-cyan-600',
      chiefComplaint: chiefComplaint.trim(),
      historyOfPresentIllness: history.trim() || chiefComplaint.trim(),
      dsmDiagnosis: dsmDiagnosis.trim(),
      coreSchemas: schemas.split('،').map((s) => s.trim()).filter(Boolean),
      defenseMechanisms: defenses.split('،').map((d) => d.trim()).filter(Boolean),
      personalityTraits: ['حساس', 'درون‌گرا'],
      difficulty,
      recommendedApproach: approach,
      suggestedQuestions: [
        'در اون لحظات دقیقاً چه فکری از ذهنتون می‌گذره؟',
        'چه چیزی بیشتر از همه نگرانتون می‌کنه؟',
      ],
      initialAnxiety: difficulty === 'advanced' ? 85 : difficulty === 'beginner' ? 50 : 70,
      initialRapport: difficulty === 'advanced' ? 25 : difficulty === 'beginner' ? 55 : 40,
      isCustom: true,
    };

    try {
      await onSaveCase(newCase);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-stone-200 shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">طراحی سناریو و پرونده بالینی جدید</h3>
              <p className="text-[11px] text-stone-500">طراحی مراجع فرضی برای شبیه‌سازی در کلاس یا آزمون</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold block mb-1">نام مراجع (فرضی):</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="مثلاً: مریم احمدی"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">سن:</label>
              <input
                type="number"
                min="14"
                max="85"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">جنسیت:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              >
                <option value="female">زن</option>
                <option value="male">مرد</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">شغل یا وضعیت تحصیلی:</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="مثلاً: کارمند بانک"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">وضعیت تأهل:</label>
              <input
                type="text"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                placeholder="مثلاً: مجرد / متأهل"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">عنوان کیس / اختلال:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: اضطراب اجتماعی و هراس از سخنرانی"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">تشخیص بر اساس DSM-5-TR:</label>
              <input
                type="text"
                required
                value={dsmDiagnosis}
                onChange={(e) => setDsmDiagnosis(e.target.value)}
                placeholder="مثلاً: Social Anxiety Disorder (300.23)"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">شکایت اصلی مراجع (از زبان خودش):</label>
            <textarea
              required
              rows={2}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="مثلاً: «حس می‌کنم هر بار که حرف می‌زنم همه چشم‌ها به منه و الان سوتی می‌دم...»"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">تاریخچه و پیشینه بالینی (HPI):</label>
            <textarea
              rows={3}
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="شرح مختصری از شروع علائم، تعارضات بین فردی، و وضعیت عملکردی بیمار..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">سطح دشواری و مقاومت بیمار:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              >
                <option value="beginner">سطح ۱: مراجع همکار (مبتدی)</option>
                <option value="intermediate">سطح ۲: مقاومت متوسط</option>
                <option value="advanced">سطح ۳: مقاومت شدید و چالش بالا</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">رویکرد درمانی پیشنهادی:</label>
              <select
                value={approach}
                onChange={(e) => setApproach(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              >
                <option value="CBT">شناختی-رفتاری (CBT)</option>
                <option value="ACT">پذیرش و تعهد (ACT)</option>
                <option value="SchemaTherapy">طرح‌واره‌درمانی</option>
                <option value="Psychodynamic">روان‌پویشی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">مکانیزم‌های دفاعی (با ویرگول جدا کنید):</label>
              <input
                type="text"
                value={defenses}
                onChange={(e) => setDefenses(e.target.value)}
                placeholder="مثلاً: اجتناب، سرکوب، فاجعه‌سازی"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">طرح‌واره‌ها (با ویرگول جدا کنید):</label>
              <input
                type="text"
                value={schemas}
                onChange={(e) => setSchemas(e.target.value)}
                placeholder="مثلاً: شرم و نقص، انزوای اجتماعی"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره و افزودن کیس'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
