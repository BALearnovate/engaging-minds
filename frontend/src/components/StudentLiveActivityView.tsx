import React from 'react';

interface StudentLiveActivityViewProps {
  activityTitle: string;
  shareCode?: string;
  teacherName?: string;
  onExit: () => void;
}

export const StudentLiveActivityView: React.FC<StudentLiveActivityViewProps> = ({
  activityTitle,
  shareCode,
  teacherName = 'Your Teacher',
  onExit,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            ← Exit Live Activity
          </button>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE SESSION</span>
          </div>
        </div>

        {shareCode && (
          <div className="text-xs text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
            Code: <span className="text-white font-bold">{shareCode}</span>
          </div>
        )}
      </header>

      {/* Main Blank Activity Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
        <div className="max-w-3xl w-full bg-slate-800/60 border border-slate-700 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md flex flex-col items-center">
          {/* Flame / Live Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-4xl shadow-lg mb-6 animate-bounce">
            🔥
          </div>

          <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">
            Joined Live Session
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {activityTitle || 'Live Activity'}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-lg mb-8">
            Guided by <span className="text-white font-semibold">{teacherName}</span>. Get ready to participate as questions and interactive tasks are pushed to your screen!
          </p>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full text-left flex items-start gap-4">
            <div className="text-2xl mt-0.5">ℹ️</div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Waiting for teacher instructions</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                This live view will automatically update when the activity content is broadcast live.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

