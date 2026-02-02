
import React from 'react';
import { 
  StarIcon, 
  MagnifyingGlassIcon,
  BookOpenIcon,
  CheckIcon,
  XCircleIcon,
  Cog8ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  FireIcon,
  UserIcon,
  BoltIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid';
import { GameReviewData, MoveClassification } from '../types';

interface GameReviewPanelProps {
  data: GameReviewData;
  onNewGame: () => void;
  onStartReview: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentMoveIndex: number;
  totalMoves: number;
  currentMoveSAN?: string;
  currentMoveClassification?: MoveClassification;
  showBestMove: boolean;
  onToggleBestMove: () => void;
}

const StatRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  white: number; 
  black: number; 
  colorClass: string 
}> = ({ icon, label, white, black, colorClass }) => (
  <div className="flex items-center justify-between py-1.5 px-3 hover:bg-white/5 rounded-md transition-colors group">
    <span className={`w-8 text-center font-black text-[14px] ${colorClass} group-hover:scale-110 transition-transform`}>{white}</span>
    <div className="flex items-center gap-2 flex-1 justify-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colorClass} shadow-lg`}>
        {icon}
      </div>
      <span className="text-gray-400 font-bold text-[10px] min-w-[80px] uppercase tracking-widest text-center">{label}</span>
    </div>
    <span className={`w-8 text-center font-black text-[14px] ${colorClass} group-hover:scale-110 transition-transform`}>{black}</span>
  </div>
);

const AccuracyCircle: React.FC<{ percentage: number; color: string; label: string; rating?: number; size?: 'sm' | 'lg' }> = ({ percentage, color, label, rating, size = 'sm' }) => {
  const isLarge = size === 'lg';
  const radius = isLarge ? 45 : 36;
  const stroke = isLarge ? 8 : 6;
  const dim = isLarge ? 110 : 80;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={dim/2}
            cy={dim/2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-[#312e2b]"
          />
          <circle
            cx={dim/2}
            cy={dim/2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={2 * Math.PI * radius}
            strokeDashoffset={2 * Math.PI * radius * (1 - percentage / 100)}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={`${isLarge ? 'text-3xl' : 'text-xl'} font-black`}>{percentage.toFixed(1)}</span>
          <span className={`${isLarge ? 'text-xs' : 'text-[8px]'} font-black opacity-60`}>%</span>
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">{label}</span>
      {rating && (
        <div className="mt-1 bg-[#312e2b] px-2 py-0.5 rounded text-[11px] font-bold text-gray-300 border border-white/5">
          {rating} Rating
        </div>
      )}
    </div>
  );
};

const GameReviewPanel: React.FC<GameReviewPanelProps> = ({ 
  data, 
  onNewGame, 
  onStartReview, 
  onNext, 
  onPrev, 
  currentMoveIndex, 
  totalMoves,
  currentMoveSAN,
  currentMoveClassification,
  showBestMove,
  onToggleBestMove
}) => {
  const isReviewing = currentMoveIndex >= 0;

  const renderEvalGraph = () => {
    const points = data.evalHistory.map((val, i) => {
      const x = (i / (data.evalHistory.length - 1)) * 100;
      const y = 50 - (val / 500) * 35;
      return `${x},${Math.min(Math.max(y, 10), 90)}`;
    }).join(' ');

    return (
      <div className="h-16 bg-[#1a1917] rounded-sm relative mt-2 border border-[#312e2b] overflow-hidden group cursor-crosshair">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#81b64c', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#81b64c', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`M 0 50 L ${points} L 100 50 Z`} fill="url(#grad)" />
          <polyline fill="none" stroke="#555" strokeWidth="0.8" points={points} className="opacity-60" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeWidth="0.5" />
          {isReviewing && (
            <line 
              x1={(currentMoveIndex / (totalMoves - 1)) * 100} 
              y1="0" 
              x2={(currentMoveIndex / (totalMoves - 1)) * 100} 
              y2="100" 
              stroke="#81b64c" 
              strokeWidth="1" 
              className="shadow-glow"
            />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-[380px] bg-[#262421] h-full flex flex-col border-l border-[#111] overflow-y-auto custom-scrollbar shadow-2xl">
      <div className="flex items-center justify-between p-3 bg-[#1a1917] sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-1.5 font-bold text-[13px] uppercase tracking-widest text-gray-400">
           <TrophyIcon className="w-4 h-4 text-emerald-500" />
           <span className="bg-[#312e2b] text-blue-400 px-1.5 py-0.5 rounded-sm mr-1 font-black">Post-Game</span> Analysis
        </div>
        <div className="flex items-center gap-3">
          <Cog8ToothIcon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      {/* Cinematic Accuracy & Summary Header */}
      {!isReviewing ? (
        <div className="bg-[#21201d] border-b border-[#111]">
          <div className="p-8 flex flex-col gap-8 items-center justify-center">
            <div className="flex flex-col items-center gap-1 mb-2">
              <BoltIcon className="w-10 h-10 text-[#81b64c]" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Game Review</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Powered by Stockfish 16.1 Lite</p>
            </div>
            
            <div className="w-full flex justify-around items-center">
              <AccuracyCircle 
                percentage={data.white.accuracy} 
                color="text-white" 
                label="White" 
                rating={data.white.ratingEstimate} 
                size="lg"
              />
              <div className="h-20 w-[1px] bg-[#312e2b]"></div>
              <AccuracyCircle 
                percentage={data.black.accuracy} 
                color="text-blue-500" 
                label="Black" 
                rating={data.black.ratingEstimate} 
                size="lg"
              />
            </div>

            <div className="bg-[#262421] rounded-xl p-4 w-full border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-[#81b64c]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-gray-200">Excellent performance!</p>
                <p className="text-[11px] text-gray-500">You played at a <b>{data.white.ratingEstimate}</b> level this game.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#21201d] border-b border-[#111] flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">White</span>
                <span className="font-black text-white text-lg">{data.white.accuracy.toFixed(0)}%</span>
              </div>
              <div className="h-6 w-[1px] bg-[#312e2b]"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Black</span>
                <span className="font-black text-blue-500 text-lg">{data.black.accuracy.toFixed(0)}%</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stockfish 16.1</p>
              <p className="text-[11px] font-black text-emerald-500">Depth 18</p>
           </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-md bg-[#312e2b] overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&mouth=smile" alt="coach" />
          </div>
          <div className="bg-white text-[#21201d] p-3 rounded-xl text-[13px] leading-snug font-bold relative shadow-2xl flex-1 border border-white/20">
             <div className="absolute left-0 top-3 -translate-x-1 w-3 h-3 bg-white rotate-45"></div>
             {isReviewing ? (
               <span>Move {currentMoveIndex + 1}: <span className="font-black text-emerald-600">{currentMoveSAN}</span> is the {currentMoveClassification?.toLowerCase().replace('_', ' ')} move!</span>
             ) : (
               "Let's look at the critical moments that decided the game. Click 'Show Review' to begin."
             )}
          </div>
        </div>
        {renderEvalGraph()}
      </div>

      <div className="p-3 space-y-0.5">
        <StatRow colorClass="text-cyan-400" label="Brilliant" white={data.white.moves.BRILLIANT} black={data.black.moves.BRILLIANT} icon={<div className="font-black text-[10px]">!!</div>} />
        <StatRow colorClass="text-blue-500" label="Great" white={data.white.moves.GREAT} black={data.black.moves.GREAT} icon={<div className="font-black text-[10px]">!</div>} />
        <StatRow colorClass="text-green-500" label="Best" white={data.white.moves.BEST} black={data.black.moves.BEST} icon={<StarIcon className="w-4 h-4" />} />
        <StatRow colorClass="text-[#cc8953]" label="Book" white={data.white.moves.BOOK} black={data.black.moves.BOOK} icon={<BookOpenIcon className="w-4 h-4" />} />
        <StatRow colorClass="text-orange-400" label="Mistake" white={data.white.moves.MISTAKE} black={data.black.moves.MISTAKE} icon={<div className="font-black text-[10px]">?</div>} />
        <StatRow colorClass="text-red-500" label="Blunder" white={data.white.moves.BLUNDER} black={data.black.moves.BLUNDER} icon={<div className="font-black text-[10px]">??</div>} />
      </div>

      {isReviewing && (
        <div className="px-4 py-4 bg-[#1a1917] border-y border-[#312e2b] mt-2 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Playback</span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleBestMove}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${showBestMove ? 'bg-orange-500/10 text-orange-400 border-orange-500/50' : 'bg-[#262421] text-gray-500 border-white/10 hover:border-white/30'}`}
              >
                 {showBestMove ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
                 Best Move
              </button>
              <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{currentMoveIndex + 1} / {totalMoves}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onPrev}
              disabled={currentMoveIndex < 0}
              className="p-3 bg-[#312e2b] rounded-lg hover:bg-[#3d3a37] disabled:opacity-30 transition-all active:scale-95 shadow-lg border border-white/5"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 bg-[#111] rounded-lg p-3 text-center font-black text-white text-xl flex items-center justify-center gap-2 border border-[#312e2b]">
              <span className="text-gray-600 text-sm font-bold mr-1">{(Math.floor(currentMoveIndex / 2) + 1)}.</span>
              {currentMoveSAN || '...'}
            </div>
            <button 
              onClick={onNext}
              disabled={currentMoveIndex >= totalMoves - 1}
              className="p-3 bg-[#312e2b] rounded-lg hover:bg-[#3d3a37] disabled:opacity-30 transition-all active:scale-95 shadow-lg border border-white/5"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto p-4 space-y-3 bg-[#1a1917] border-t border-black/30 pb-8 sticky bottom-0 z-20">
        {!isReviewing ? (
          <button 
            onClick={onStartReview}
            className="w-full bg-[#81b64c] hover:bg-[#91c55c] text-white font-black py-4 rounded-xl transition-all text-[18px] shadow-[0_5px_0_0_rgba(69,101,41,1)] active:translate-y-1 active:shadow-none uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Show Review
          </button>
        ) : (
          <button 
            onClick={onNext}
            disabled={currentMoveIndex >= totalMoves - 1}
            className={`w-full ${currentMoveIndex >= totalMoves - 1 ? 'bg-gray-700 opacity-50 cursor-not-allowed shadow-none' : 'bg-[#81b64c] hover:bg-[#91c55c] shadow-[0_5px_0_0_rgba(69,101,41,1)]'} text-white font-black py-4 rounded-xl transition-all text-[18px] active:translate-y-1 active:shadow-none uppercase tracking-widest flex items-center justify-center gap-3`}
          >
            {currentMoveIndex >= totalMoves - 1 ? 'Game Finished' : (
              <>
                <ChevronRightIcon className="w-5 h-5" />
                Next Move
              </>
            )}
          </button>
        )}
        <button 
          onClick={onNewGame}
          className="w-full bg-[#312e2b] hover:bg-[#3d3a37] text-white font-black py-3 rounded-xl transition-all text-[13px] shadow-[0_3px_0_0_rgba(17,17,17,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide opacity-80"
        >
          <XCircleIcon className="w-4 h-4" />
          Close Review
        </button>
      </div>
    </div>
  );
};

export default GameReviewPanel;
