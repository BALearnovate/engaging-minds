import React from 'react';

interface LiveActivityPopupModalProps {
  isOpen: boolean;
  activityTitle: string;
  teacherName?: string;
  shareCode?: string;
  onJoin: () => void;
  onClose: () => void;
}

export const LiveActivityPopupModal: React.FC<LiveActivityPopupModalProps> = ({
  isOpen,
  activityTitle,
  teacherName = 'Mrs. Sarah Jenkins',
  onJoin,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl relative border-2 border-[#84cc16] bg-gradient-to-br from-[#059669] via-[#0d9488] to-[#0284c7] p-6 sm:p-8 text-center text-white"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(132, 204, 22, 0.4)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-9 h-9 flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Live Activity Badge with Flame Icon */}
        <div className="flex justify-center items-center mb-5">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-black text-xs sm:text-sm tracking-wider uppercase border border-white/30 shadow-sm">
            <span className="text-base animate-pulse">🔥</span>
            <span>LIVE ACTIVITY DETECTED!</span>
          </div>
        </div>

        {/* Active Lesson Header */}
        <div className="text-emerald-200 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
          Active Lesson:
        </div>

        {/* Activity Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3 drop-shadow-sm">
          {activityTitle || 'Interactive Classroom Activity'}
        </h2>

        {/* Teacher Instruction Text */}
        <p className="text-emerald-100/90 text-sm sm:text-base font-medium mb-8 max-w-md mx-auto leading-relaxed">
          {teacherName} has shared this activity. Tap to participate!
        </p>

        {/* Join Button */}
        <button
          onClick={onJoin}
          className="w-full bg-white hover:bg-emerald-50 text-[#16a34a] font-extrabold text-base sm:text-lg py-4 px-6 rounded-full shadow-xl hover:shadow-2xl transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wide"
        >
          <span>JOIN LIVE ACTIVITY</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
};
