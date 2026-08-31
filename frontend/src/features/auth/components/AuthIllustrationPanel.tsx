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
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-primary via-brand-gradient-mid to-brand-gradient-deep p-10 lg:p-12 flex-col justify-between relative overflow-hidden text-white">
      {/* Top Brand Tag */}
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{authMessages.title}</span>
        </div>
      </div>

      {/* SVG Inline Academic Peer Review Illustration Pattern */}
      <div className="relative z-10 my-8 space-y-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Chấm chéo Ẩn danh 2 chiều</h3>
                <p className="text-[11px] text-blue-100">Đánh giá khách quan & Công bằng</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              Double-Blind
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Cố vấn AI Real-time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Bảo mật 100%</span>
            </div>
          </div>
        </div>

        {/* Decorative SVG Shapes */}
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

      {/* Bottom Overlay Info */}
      <div className="relative z-10 space-y-2">
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-snug">
          {title}
        </h2>
        <p className="text-xs lg:text-sm text-blue-100 leading-relaxed opacity-90">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
