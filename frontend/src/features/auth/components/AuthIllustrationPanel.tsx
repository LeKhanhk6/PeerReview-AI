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
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-50/90 via-slate-50 to-brand-soft-bg/80 border-r border-slate-100/80 p-6 lg:p-8 flex-col justify-between relative overflow-hidden text-slate-900 shrink-0">
      
      {/* Top Header Section */}
      <div className="relative z-10 space-y-1.5">
        <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Center Official Logo Display (Compact & Elegant) */}
      <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center">
        <img
          src="/logo_PeerReview-AI.png"
          alt="PeerReview-AI Official Logo"
          className="max-w-[210px] lg:max-w-[250px] w-full h-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Bottom Tagline Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-heavy-text bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-brand-soft-border shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span>Đánh giá peer • Học hỏi cùng AI • Vươn xa cùng nhau</span>
        </div>
      </div>

      {/* Decorative Subtle Background SVG Circles */}
      <svg
        className="absolute -bottom-16 -left-16 w-56 h-56 opacity-30 pointer-events-none"
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
