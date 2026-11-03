import React, { useState } from 'react';
import { 
  MessageSquare, 
  FolderKanban, 
  Sparkles, 
  Award, 
  PlusCircle, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  HelpCircle,
  Stethoscope,
  Menu,
  X,
  BookHeart
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { RavanaLogo } from './RavanaLogo';

interface NavbarProps {
  activeTab: 'simulator' | 'library' | 'evidence' | 'progress' | 'journal';
  setActiveTab: (tab: 'simulator' | 'library' | 'evidence' | 'progress' | 'journal') => void;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLoginGuest: () => void;
  onLogout: () => void;
  onOpenCaseCreator: () => void;
  hasActiveSession: boolean;
  activeCaseTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginGoogle,
  onLoginGuest,
  onLogout,
  onOpenCaseCreator,
  hasActiveSession,
  activeCaseTitle,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-800 shadow-xs pt-safe">
        <div className="max-w-7xl 2xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* Logo & Platform Identity: Ravana (روانا) */}
            <div 
              onClick={() => setActiveTab('simulator')}
              className="cursor-pointer transition-opacity hover:opacity-90 shrink-0"
              title="روانا (Ravāna) - سامانه شبیه‌ساز بالینی روان‌درمانی"
            >
              <RavanaLogo variant="horizontal" size="md" />
            </div>

            {/* Desktop Navigation Tabs (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              <button
                id="nav-tab-simulator"
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>اتاق شبیه‌سازی</span>
                {hasActiveSession && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="جلسه در حال اجرا" />
                )}
              </button>

              <button
                id="nav-tab-library"
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'library'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>کتابخانه کیس‌ها</span>
              </button>

              <button
                id="nav-tab-evidence"
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'evidence'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="hidden lg:inline">شواهد و راهنمای DSM-5</span>
                <span className="lg:hidden">شواهد</span>
              </button>

              <button
                id="nav-tab-progress"
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'progress'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Award className="w-4 h-4 text-teal-600" />
                <span>کارنامه بالینی</span>
              </button>

              <button
                id="nav-tab-journal"
                onClick={() => setActiveTab('journal')}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'journal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <BookHeart className="w-4 h-4 text-rose-500" />
                <span>ژورنال تأملی</span>
              </button>
            </nav>

            {/* Actions & Auth */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-create-custom-case"
                onClick={onOpenCaseCreator}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                title="تعریف بیمار فرضی دلخواه"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden md:inline">کیس جدید</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-stone-200">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'کاربر'} 
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600" />
                  )}
                  <span className="text-xs font-medium text-stone-800 max-w-[70px] sm:max-w-[100px] truncate">
                    {currentUser.displayName || (currentUser.isAnonymous ? 'مهمان' : currentUser.email?.split('@')[0])}
                  </span>
                  <button
                    id="btn-user-logout"
                    onClick={onLogout}
                    title="خروج از حساب"
                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    id="btn-login-google"
                    onClick={onLoginGoogle}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ورود</span>
                  </button>
                  <button
                    id="btn-login-guest"
                    onClick={onLoginGuest}
                    className="hidden sm:inline-block px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                  >
                    مهمان
                  </button>
                </div>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                id="btn-toggle-mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg md:hidden hover:bg-stone-100 transition-colors"
                aria-label="منوی سریع"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu for Extra Actions */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            {activeCaseTitle && (
              <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span>مراجع فعال:</span>
                <span className="font-bold text-indigo-700">{activeCaseTitle}</span>
              </div>
            )}
            
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCaseCreator();
              }}
              className="w-full flex items-center justify-between p-2 text-xs font-medium text-teal-800 bg-teal-50 rounded-lg border border-teal-200"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-teal-600" />
                <span>طراحی کیس سفارشی جدید</span>
              </span>
              <span className="text-[10px] text-teal-600">ایجاد</span>
            </button>

            {!currentUser && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoginGuest();
                }}
                className="w-full text-right p-2 text-xs text-stone-700 bg-stone-50 rounded-lg hover:bg-stone-100"
              >
                ورود به عنوان کاربر مهمان
              </button>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Persistent on Phones/Small Tablets) */}
      <nav 
        id="mobile-bottom-navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-2 pt-1 pb-safe flex items-center justify-around"
      >
        <button
          onClick={() => {
            setActiveTab('simulator');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition-colors touch-manipulation cursor-pointer ${
            activeTab === 'simulator' 
              ? 'text-indigo-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 mb-0.5" />
            {hasActiveSession && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />
            )}
          </div>
          <span>شبیه‌ساز</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('library');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition-colors touch-manipulation cursor-pointer ${
            activeTab === 'library' 
              ? 'text-indigo-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FolderKanban className="w-4 h-4 mb-0.5" />
          <span>کیس‌ها</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('evidence');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition-colors touch-manipulation cursor-pointer ${
            activeTab === 'evidence' 
              ? 'text-indigo-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
          <span>شواهد DSM</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('progress');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition-colors touch-manipulation cursor-pointer ${
            activeTab === 'progress' 
              ? 'text-indigo-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="w-4 h-4 mb-0.5 text-teal-600" />
          <span>کارنامه</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('journal');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition-colors touch-manipulation cursor-pointer ${
            activeTab === 'journal' 
              ? 'text-indigo-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookHeart className="w-4 h-4 mb-0.5 text-rose-500" />
          <span>ژورنال</span>
        </button>
      </nav>
    </>
  );
};
