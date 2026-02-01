
import React from 'react';
import { 
  StarIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XCircleIcon,
  QuestionMarkCircleIcon,
  SpeakerWaveIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid';
import { GameReviewData, MoveClassification } from '../types';

interface GameReviewPanelProps {
  data: GameReviewData;
  onNewGame: () => void;
}

const MoveStat: React.FC<{ icon: React.ReactNode; label: string; white: number; black: number; color: string }> = ({ icon, label, white, black, color }) => (
  <div className="flex items-center justify-between py-1 text-sm">
    <span className={`w-8 text-center font-bold ${color}`}>{white}</span>
    <div className="flex items-center gap-2 flex-1 justify-center">
      <div className={`w-5 h-5 ${color}`}>{icon}</div>
      <span className="text-gray-400 font-medium text-xs min-w-[60px]">{label}</span>
    </div>
    <span className={`w-8 text-center font-bold ${color}`}>{black}</span>
  </div>
);

const GameReviewPanel: React.FC<GameReviewPanelProps> = ({ data, onNewGame }) => {
  const renderGraph = () => {
    const max = Math.max(...data.evalHistory.map(Math.abs), 500);
    const points = data.evalHistory.map((val, i) => {
      const x = (i / (data.evalHistory.length - 1)) * 100;
      const y = 50 - (val / max) * 50;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="h-24 bg-[#1a1917] rounded p-1 border border-[#312e2b] relative overflow-hidden mt-4">
        <svg viewBox="0 0 100 100" className="w-full h-full preserve-aspect-none" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            points={points}
          />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#312e2b" strokeWidth="1" strokeDasharray="2" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-full border-t border-gray-500"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-[#262421] h-full flex flex-col border-l border-[#312e2b] overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#312e2b]">
        <div className="flex items-center gap-2 font-bold text-gray-300">
          <StarIcon className="w-5 h-5 text-yellow-500" />
          Game Review
        </div>
        <div className="flex gap-2">
          <SpeakerWaveIcon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Coach Greeting */}
      <div className="p-4 flex gap-3">
        <div className="w-12 h-12 rounded bg-indigo-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="coach" />
        </div>
        <div className="bg-white text-black p-3 rounded-lg text-xs relative">
           <div className="absolute left-0 top-3 -ml-1.5 w-3 h-3 bg-white rotate-45"></div>
           You had a nice tactical find in this game. Let's review!
        </div>
      </div>

      {/* Eval Graph */}
      <div className="px-4">
        {renderGraph()}
        <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase font-bold px-2">
          <span>CPersoon</span>
          <span>kingiskong01</span>
        </div>
      </div>

      {/* Accuracy Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold px-2">
          <span>PLAYERS</span>
          <div className="flex gap-8">
             <div className="w-10 h-10 rounded overflow-hidden border border-gray-600">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Todoroki" alt="p1" />
             </div>
             <div className="w-10 h-10 rounded overflow-hidden border border-gray-600">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kong" alt="p2" />
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 font-bold px-2">
          <span>ACCURACY</span>
          <div className="flex gap-2">
            <div className="bg-white text-black px-3 py-1 rounded font-black text-lg">{data.white.accuracy.toFixed(1)}</div>
            <div className="bg-[#312e2b] text-white px-3 py-1 rounded font-black text-lg">{data.black.accuracy.toFixed(1)}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 border-t border-[#312e2b] pt-4">
          <MoveStat color="text-cyan-400" label="Brilliant" white={data.white.moves.BRILLIANT} black={data.black.moves.BRILLIANT} icon={<StarIcon />} />
          <MoveStat color="text-blue-400" label="Great" white={data.white.moves.GREAT} black={data.black.moves.GREAT} icon={<ExclamationCircleIcon />} />
          <MoveStat color="text-green-400" label="Best" white={data.white.moves.BEST} black={data.black.moves.BEST} icon={<StarIcon />} />
          <MoveStat color="text-orange-400" label="Mistake" white={data.white.moves.MISTAKE} black={data.black.moves.MISTAKE} icon={<QuestionMarkCircleIcon />} />
          <MoveStat color="text-red-400" label="Miss" white={data.white.moves.MISS} black={data.black.moves.MISS} icon={<XCircleIcon />} />
          <MoveStat color="text-red-600" label="Blunder" white={data.white.moves.BLUNDER} black={data.black.moves.BLUNDER} icon={<QuestionMarkCircleIcon />} />
          
          <div className="flex justify-center py-2">
            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Rating Estimates */}
        <div className="space-y-3 pt-4 border-t border-[#312e2b]">
           <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Game Rating</span>
              <div className="flex gap-4">
                <span className="bg-white text-black px-3 py-1 rounded w-12 text-center">{data.white.ratingEstimate}</span>
                <span className="bg-[#312e2b] text-white px-3 py-1 rounded w-12 text-center">{data.black.ratingEstimate}</span>
              </div>
           </div>
           
           <div className="space-y-2">
             <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Opening</span>
                <div className="flex gap-8 px-4">
                  <StarIcon className="w-4 h-4 text-green-500" />
                  <QuestionMarkCircleIcon className="w-4 h-4 text-orange-500" />
                </div>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Middlegame</span>
                <div className="flex gap-8 px-4">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-orange-500" />
                  <QuestionMarkCircleIcon className="w-4 h-4 text-yellow-500" />
                </div>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Endgame</span>
                <div className="flex gap-8 px-4">
                  <ExclamationCircleIcon className="w-4 h-4 text-blue-400" />
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <button 
          onClick={onNewGame}
          className="w-full bg-[#312e2b] hover:bg-[#3d3a37] text-white font-bold py-3 rounded-lg transition-colors border-b-4 border-[#1a1917]"
        >
          New 10 min
        </button>
      </div>
    </div>
  );
};

export default GameReviewPanel;
