import React from 'react';

interface RavanaLogoProps {
  variant?: 'icon' | 'horizontal' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const RavanaLogo: React.FC<RavanaLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  // Size presets for the icon mark
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  // SVG Icon mark rendering the exact uploaded logo symbol (Neural 'R' with synapse and orange nucleus)
  const IconMark = (
    <div className={`relative shrink-0 ${iconDimensions} ${className}`}>
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-2xs transition-transform hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="ravanaSynapseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="ravanaNavyStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#142c4c" />
            <stop offset="50%" stopColor="#0f233d" />
            <stop offset="100%" stopColor="#163863" />
          </linearGradient>

          <linearGradient id="ravanaTealStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" rx="64" fill="#ffffff" />

        <g transform="translate(10, 10)">
          {/* Synaptic Glow Field */}
          <circle cx="150" cy="140" r="62" fill="url(#ravanaSynapseGlow)" />

          {/* Lower Right Teal Synaptic Loop */}
          <path
            d="M 125 170 C 142 215, 222 205, 212 162 C 203 125, 162 136, 130 170 Z"
            fill="none"
            stroke="url(#ravanaTealStroke)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Lower Left Navy Loop */}
          <path
            d="M 142 162 C 125 184, 95 220, 68 202 C 45 184, 72 158, 108 150"
            fill="none"
            stroke="url(#ravanaNavyStroke)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Upper Body of 'R' */}
          <path
            d="M 105 56 
               C 174 52, 212 78, 212 121 
               C 212 170, 152 182, 118 168 
               C 74 150, 66 89, 118 58 
               C 161 32, 187 97, 148 140"
            fill="none"
            stroke="url(#ravanaNavyStroke)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Internal neural connection line */}
          <path
            d="M 105 65 C 160 82, 178 112, 152 142 C 130 164, 105 172, 92 190"
            fill="none"
            stroke="url(#ravanaNavyStroke)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Synaptic Core Nucleus (Orange node) */}
          <circle cx="150" cy="140" r="12" fill="#f97316" />
          <circle cx="150" cy="140" r="7" fill="#ffedd5" opacity="0.45" />
        </g>
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return IconMark;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="w-20 h-20 mb-2">
          {IconMark}
        </div>
        <div className="relative">
          <h1 className="text-2xl font-extrabold tracking-widest text-[#0f233d] font-sans">
            RAVĀNA
          </h1>
          <span className="absolute top-[-3px] left-[58%] -translate-x-1/2 w-4 h-[2.5px] bg-[#0f233d] rounded-full" />
        </div>
        <div className="text-[11px] tracking-[0.25em] font-semibold text-slate-600 uppercase font-sans mt-0.5">
          AI-POWERED CLINICAL TRAINING
        </div>
        {showSubtitle && (
          <p className="text-xs text-stone-500 font-medium mt-1">
            روانا • سامانه هوشمند آموزش بالینی روان‌درمانی
          </p>
        )}
      </div>
    );
  }

  // Default: horizontal layout for Navbar / headers
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {IconMark}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight flex items-baseline gap-1">
            <span>روانا</span>
            <span className="text-xs font-semibold text-indigo-700/80 font-sans tracking-wider hidden sm:inline">
              (Ravāna)
            </span>
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full">
            شبیه‌ساز بالینی
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-stone-500 hidden md:block">
            آموزش کیس‌محور بالینی با هوش مصنوعی
          </p>
        )}
      </div>
    </div>
  );
};
