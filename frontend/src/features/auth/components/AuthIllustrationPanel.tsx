import React from 'react';
import { Sparkles, BookOpen, Users, ShieldCheck } from 'lucide-react';
import { authMessages } from '@/constants/messages/auth';

interface AuthIllustrationPanelProps {
  title?: string;
  subtitle?: string;
}

export const AuthIllustrationPanel: React.FC<AuthIllustrationPanelProps> = ({
  title = authMessages.academicPlatformTitle,
  subtitle = authMessages.academicPlatformSubtitle,
}) => {
  return (
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-primary via-brand-gradient-mid to-brand-gradient-deep p-8 lg:p-10 flex-col justify-between relative overflow-hidden text-white">
      
      {/* Top Header with Official Logo */}
      <div className="relative z-10 space-y-3">
        <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-white/30 inline-block max-w-[260px] transform hover:scale-[1.02] transition-transform">
          <img
            src="/logo_PeerReview-AI.png"
            alt="PeerReview-AI Logo"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Đánh giá peer • Học hỏi cùng AI • Vươn xa cùng nhau</span>
        </div>
      </div>

      {/* Center Hero Feature Card */}
      <div className="relative z-10 my-6 space-y-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Chấm chéo Ẩn danh 2 chiều</h3>
                <p className="text-[10px] sm:text-[11px] text-blue-100">Đánh giá khách quan & Công bằng</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              Double-Blind
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Cố vấn AI Real-time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bảo mật 100%</span>
            </div>
          </div>
        </div>

        {/* Decorative Background SVG Pattern */}
        <svg
          className="absolute -top-16 -right-16 w-64 h-64 opacity-20 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="1.5" />
          <path d="M40 100 H160 M100 40 V160" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* Bottom Overlay Title & Subtitle */}
      <div className="relative z-10 space-y-1.5">
        <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white leading-snug">
          {title}
        </h2>
        <p className="text-xs text-blue-100 leading-relaxed opacity-90">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
