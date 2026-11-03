import React, { useRef, useState } from 'react';
import { 
  BookmarkPlus, 
  Clock, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  CheckCircle2, 
  FileText,
  X
} from 'lucide-react';
import type { ClinicalCase, SimulationMessage } from '../types';
import { downloadTextFile, copyToClipboard } from '../utils/reportExport';

interface ClinicalNotesWidgetProps {
  clinicalNotes: string;
  onNotesChange: (notes: string) => void;
  currentCase: ClinicalCase;
  messages: SimulationMessage[];
  lastAutoSavedTimestamp?: string | null;
  onClose?: () => void;
}

export const ClinicalNotesWidget: React.FC<ClinicalNotesWidgetProps> = ({
  clinicalNotes,
  onNotesChange,
  currentCase,
  messages,
  lastAutoSavedTimestamp,
  onClose,
}) => {
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNotesCopied, setIsNotesCopied] = useState(false);

  // Quick clinical tags to insert in notes
  const clinicalNoteTags = [
    { label: 'نشانه سوماتیک', tag: '[نشانه بدنی/تنفس: ' },
    { label: 'خطای شناختی', tag: '[خطای شناختی/فاجعه‌سازی: ' },
    { label: 'طرح‌واره', tag: '[طرح‌واره ناسازگار: ' },
    { label: 'مقاومت/دفاع', tag: '[مقاومت/دفاع: ' },
    { label: 'فرضیه تشخیصی', tag: '[فرضیه تشخیصی DSM: ' },
    { label: 'تکلیف خانگی', tag: '[تکلیف جلسه بعد: ' },
  ];

  const notesWordCount = clinicalNotes.trim() ? clinicalNotes.trim().split(/\s+/).length : 0;

  // Insert tag into notes textarea
  const handleInsertNoteTag = (tag: string) => {
    const textarea = notesTextareaRef.current;
    if (!textarea) {
      const updated = clinicalNotes ? clinicalNotes + '\n' + tag + ']' : tag + ']';
      onNotesChange(updated);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const insertion = tag + ']';
    const updated = current.substring(0, start) + insertion + current.substring(end);
    onNotesChange(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Insert timestamp into notes
  const handleInsertTimestamp = () => {
    const lastMsg = [...messages].reverse().find(m => m.timestamp)?.timestamp || '00:00';
    const tag = `[زمان ${lastMsg}] `;
    const updated = clinicalNotes ? clinicalNotes + '\n' + tag : tag;
    onNotesChange(updated);
    notesTextareaRef.current?.focus();
  };

  // Download notes
  const handleDownloadNotes = () => {
    if (!clinicalNotes.trim()) return;
    const cleanName = currentCase.patientName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const header = `======================================================\nیادداشت‌های بالینی درمانگر - پرونده مراجع: ${currentCase.patientName}\nتشخیص DSM-5-TR: ${currentCase.dsmDiagnosis}\nتاریخ جلسه: ${new Date().toLocaleDateString('fa-IR')}\n======================================================\n\n`;
    downloadTextFile(`یادداشت_بالینی_${cleanName}_${dateStr}.txt`, header + clinicalNotes);
  };

  // Copy notes
  const handleCopyNotes = async () => {
    if (!clinicalNotes.trim()) return;
    const ok = await copyToClipboard(clinicalNotes);
    if (ok) {
      setIsNotesCopied(true);
      setTimeout(() => setIsNotesCopied(false), 2500);
    }
  };

  // Clear notes with confirmation
  const handleClearNotes = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید یادداشت‌های این جلسه را پاک کنید؟')) {
      onNotesChange('');
      try {
        localStorage.removeItem(`psychosim_notes_${currentCase.id}`);
        localStorage.removeItem('psychosim_active_clinical_notes');
        localStorage.removeItem('psychosim_notes_last_saved_time');
      } catch (e) {
        console.warn('Could not clear notes from localStorage:', e);
      }
    }
  };

  return (
    <div id="clinical-notes-widget" className="flex-1 flex flex-col p-4 overflow-hidden bg-stone-50/50">
      
      {/* Notes Header Sub-bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
          <BookmarkPlus className="w-4 h-4 text-amber-600" />
          <span>مشاهدات و یادداشت‌های درمانگر</span>
          <span
            id="badge-notes-autosave-status"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
            title="ذخیره خودکار آنی فعال است: تغییرات در حافظه محلی ثبت شده و با رفرش صفحه از بین نمی‌روند."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ذخیره خودکار</span>
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleInsertTimestamp}
            title="درج زمان جاری جلسه در یادداشت"
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 font-medium transition-colors cursor-pointer"
          >
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>زمان</span>
          </button>

          {clinicalNotes.trim() && (
            <>
              <button
                type="button"
                onClick={handleCopyNotes}
                title="کپی متن یادداشت‌ها"
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 font-medium transition-colors cursor-pointer"
              >
                {isNotesCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 text-[10px] font-bold">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-stone-500" />
                    <span className="text-[10px]">کپی</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadNotes}
                title="دانلود متن یادداشت‌ها (.txt)"
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span className="text-[10px]">دانلود</span>
              </button>

              <button
                type="button"
                onClick={handleClearNotes}
                title="پاکسازی متن یادداشت"
                className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors lg:hidden cursor-pointer"
              title="بستن ویجت یادداشت"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Clinical Tags Palette */}
      <div className="mb-2.5">
        <div className="text-[10px] text-stone-500 font-medium mb-1">
          برچسب‌های آماده بالینی (کلیک برای درج):
        </div>
        <div className="flex flex-wrap gap-1">
          {clinicalNoteTags.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInsertNoteTag(item.tag)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Large Textarea for Clinical Notes */}
      <div className="flex-1 flex flex-col min-h-0">
        <textarea
          ref={notesTextareaRef}
          id="input-clinical-notes-textarea"
          value={clinicalNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="نکات کلیدی، نشانه‌های بدنی مراجع، خطاهای شناختی، سوگیری‌ها، دفاع‌ها، فرضیه‌های تشخیصی و تکالیف جلسه بعد را اینجا یادداشت کنید...

ذخیره خودکار (Auto-Save) فعال است: متن با هر بار تایپ به صورت خودکار در حافظه مرورگر ذخیره می‌شود و با رفرش صفحه از دست نمی‌رود."
          className="flex-1 w-full resize-none bg-white border border-stone-200 rounded-xl p-3 text-xs leading-relaxed text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-stone-400 font-sans shadow-2xs"
        />
      </div>

      {/* Notes Footer */}
      <div className="mt-2 pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>ذخیره خودکار در حافظه محلی</span>
          {lastAutoSavedTimestamp && (
            <span className="text-[10px] text-stone-400 font-mono">
              (آخرین ذخیره: {lastAutoSavedTimestamp})
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-stone-400">
          {notesWordCount} کلمه • {clinicalNotes.length} حرف
        </span>
      </div>

    </div>
  );
};
