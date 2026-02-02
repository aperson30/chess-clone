
import React from 'react';

interface EvalBarProps {
  score: number; // Centipawns from white's perspective
  turn: 'w' | 'b';
}

const EvalBar: React.FC<EvalBarProps> = ({ score }) => {
  // Check if it's a mate score (usually > 9000 in engine parlance)
  const isMate = Math.abs(score) > 8000;
  
  const getDisplayScore = () => {
    if (isMate) {
      const moves = 10000 - Math.abs(score);
      return `M${moves}`;
    }
    const val = Math.abs(score / 100).toFixed(1);
    return val === '0.0' ? '0.0' : (score > 0 ? `+${val}` : `-${val}`);
  };

  const getPercentage = () => {
    if (isMate) return score > 0 ? 100 : 0;
    // Standardizing +/- 5.0 as the "full" range for visual clarity
    // (Most games are decided by 5 points)
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    const normalized = clamp(score, -500, 500);
    return ((normalized + 500) / 1000) * 100;
  };

  const percentage = getPercentage();
  const displayScore = getDisplayScore();

  return (
    <div className="w-[28px] h-full bg-[#403d39] overflow-hidden flex flex-col-reverse relative shadow-lg rounded-sm border border-black/20">
      {/* White Section (Bottom) */}
      <div 
        className="bg-[#ffffff] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
        style={{ height: `${percentage}%` }}
      />
      
      {/* Dynamic Score Labels */}
      <div className="absolute inset-0 flex flex-col justify-between items-center py-2 pointer-events-none z-10 font-bold text-[11px] font-sans tracking-tighter">
        {/* Top Label (Visible when Black is winning) */}
        <span className={`
          transition-opacity duration-300
          ${percentage < 50 ? 'text-[#ffffff] opacity-100' : 'opacity-0'}
        `}>
          {displayScore}
        </span>
        
        {/* Bottom Label (Visible when White is winning/Even) */}
        <span className={`
          transition-opacity duration-300
          ${percentage >= 50 ? 'text-[#403d39] opacity-100' : 'opacity-0'}
        `}>
          {displayScore}
        </span>
      </div>

      {/* Center 0.0 line indicator */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/10 z-0 opacity-50"></div>
    </div>
  );
};

export default EvalBar;
