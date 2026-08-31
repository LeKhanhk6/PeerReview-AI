import React from 'react';
import { Sparkles } from 'lucide-react';
import { authMessages } from '@/constants/messages/auth';

interface AuthIllustrationPanelProps {
  title?: string;
  subtitle?: string;
}

export const AuthIllustrationPanel: React.FC<AuthIllustrationPanelProps> = ({
  title = authMessages.welcomeBack,
  subtitle = authMessages.loginPageSubtext,
}) => {
  return (
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-50/90 via-slate-50 to-brand-soft-bg/80 border-r border-slate-100/80 p-5 lg:p-7 flex-col justify-between relative overflow-hidden text-slate-900 shrink-0">
      
      {/* Top Header Section */}
      <div className="relative z-10 space-y-1">
        <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-[11px] lg:text-xs text-slate-600 font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Center Official Logo Display (Sleek 200px Max-Width) */}
      <div className="relative z-10 my-auto py-3 flex flex-col items-center justify-center">
        <img
          src="/logo_PeerReview-AI.png"
          alt="PeerReview-AI Official Logo"
          className="max-w-[170px] lg:max-w-[200px] w-full h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Bottom Tagline Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-brand-heavy-text bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg border border-brand-soft-border shadow-xs">
          <Sparkles className="w-3 h-3 text-brand-primary shrink-0" />
          <span>Đánh giá peer • Học hỏi cùng AI • Vươn xa cùng nhau</span>
        </div>
      </div>

      {/* Decorative Subtle Background SVG Circles */}
      <svg
        className="absolute -bottom-16 -left-16 w-48 h-48 opacity-25 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="80" stroke="#0B57D0" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="50" stroke="#0B57D0" strokeWidth="1" />
      </svg>
    </div>
  );
};
