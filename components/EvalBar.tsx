
import React from 'react';

interface EvalBarProps {
  score: number; // centipawns
  turn: 'w' | 'b';
}

const EvalBar: React.FC<EvalBarProps> = ({ score, turn }) => {
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  
  const normalized = clamp(score, -1000, 1000);
  const percentage = ((normalized + 1000) / 2000) * 100;

  const displayScore = (score / 100).toFixed(1);

  return (
    <div className="w-4 h-full bg-[#1a1917] rounded-full overflow-hidden flex flex-col-reverse border border-[#312e2b] relative group">
      <div 
        className="bg-[#eeeed2] transition-all duration-500 ease-out"
        style={{ height: `${percentage}%` }}
      />
      
      {/* Visual score at the top */}
      <div className="absolute top-2 left-0 w-full flex justify-center pointer-events-none z-10">
        <span className="text-[7px] font-black text-white mix-blend-difference opacity-80">
          {displayScore}
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col justify-between items-center py-2 pointer-events-none">
        {/* We can hide the internal score if it's too small/cluttered */}
      </div>

      {/* Tooltip */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#262421] px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-[#312e2b]">
        Engine Eval: {displayScore}
      </div>
    </div>
  );
};

export default EvalBar;
