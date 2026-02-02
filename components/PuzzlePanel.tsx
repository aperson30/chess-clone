
import React from 'react';
import { Puzzle } from '../types';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  LightBulbIcon,
  ForwardIcon
} from '@heroicons/react/24/solid';

interface PuzzlePanelProps {
  puzzle: Puzzle;
  status: 'solving' | 'solved' | 'failed';
  onRetry: () => void;
  onNext: () => void;
  onHint: () => void;
  isWhiteTurn: boolean;
}

const PuzzlePanel: React.FC<PuzzlePanelProps> = ({ puzzle, status, onRetry, onNext, onHint, isWhiteTurn }) => {
  return (
    <div className="w-[380px] bg-[#262421] h-[600px] flex flex-col border border-[#312e2b] rounded-xl overflow-hidden shadow-2xl ml-8 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="bg-[#21201d] p-6 border-b border-[#312e2b]">
        <div className="flex items-center justify-between mb-2">
           <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
             Puzzle #{puzzle.id}
           </span>
           <span className="text-gray-500 text-[11px] font-bold">Rating: <span className="text-white">{puzzle.rating}</span></span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight mb-1">{puzzle.title}</h2>
        <p className="text-sm text-gray-400 font-medium">{puzzle.theme}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col gap-6 relative">
        {/* Turn Indicator */}
        <div className="flex items-center gap-3 bg-[#1a1917] p-3 rounded-lg border border-white/5">
           <div className={`w-4 h-4 rounded-full border-2 ${isWhiteTurn ? 'bg-white border-gray-400' : 'bg-black border-gray-600'}`}></div>
           <span className="font-bold text-gray-300 text-sm">
             {isWhiteTurn ? "White to Move" : "Black to Move"}
           </span>
        </div>
        
        <p className="text-gray-300 leading-relaxed text-sm">
          {puzzle.description}
        </p>

        {/* Feedback Area */}
        <div className={`mt-auto transition-all duration-300 transform ${status === 'solving' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          {status === 'solved' && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-emerald-400 font-black text-lg">Solved!</p>
                <p className="text-emerald-500/80 text-xs font-bold uppercase tracking-wide">Excellent Calculation</p>
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
              <XCircleIcon className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-red-400 font-black text-lg">Incorrect</p>
                <p className="text-red-500/80 text-xs font-bold uppercase tracking-wide">Keep trying!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-[#21201d] border-t border-[#312e2b] flex flex-col gap-3">
        {status === 'solved' ? (
          <button 
             onClick={onNext}
             className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3.5 rounded-xl transition-all shadow-[0_4px_0_0_rgba(6,95,70,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <ForwardIcon className="w-5 h-5" />
            Next Puzzle
          </button>
        ) : (
          status === 'failed' && (
            <button 
              onClick={onRetry}
              className="w-full bg-[#312e2b] hover:bg-[#3d3a37] text-white font-bold py-3.5 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retry
            </button>
          )
        )}
        
        {status === 'solving' && (
           <button 
            onClick={onHint}
            className="w-full bg-[#312e2b] hover:bg-[#3d3a37] text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all border border-white/5 hover:border-white/10 flex items-center justify-center gap-2 text-sm"
           >
             <LightBulbIcon className="w-4 h-4" />
             View Hint
           </button>
        )}
      </div>
    </div>
  );
};

export default PuzzlePanel;
