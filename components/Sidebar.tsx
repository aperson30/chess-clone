
import React from 'react';
import { 
  StarIcon, 
  InformationCircleIcon,
  ChartBarIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/solid';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  evaluation?: number;
  showEvaluation?: boolean;
}

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick: () => void;
  color?: string;
}> = ({ icon, label, active, onClick, color = "text-orange-500" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 hover:bg-[#2b2926] transition-colors group ${active ? 'bg-[#2b2926] border-l-4 border-emerald-500 pl-3' : 'pl-4'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className={`font-bold text-lg transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{label}</span>
    </div>
    {/* <InformationCircleIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" /> */}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange, evaluation = 0, showEvaluation = false }) => {
  const displayScore = (evaluation / 100).toFixed(1);
  const scorePrefix = evaluation > 0 ? '+' : '';
  const isNeutral = Math.abs(evaluation) < 15;

  return (
    <div className="w-80 bg-[#21201d] h-full flex flex-col border-r border-[#312e2b] overflow-y-auto z-10">
      <div className="p-8 text-center border-b border-[#312e2b]">
        <h1 className="text-emerald-500 font-black tracking-widest text-xl uppercase italic">Chess<span className="text-white not-italic">Depth</span></h1>
      </div>
      
      {/* Live Score Display - Only shown when requested */}
      {showEvaluation && (
        <div className="p-6 border-b border-[#312e2b] animate-in slide-in-from-left duration-300">
          <div className="bg-[#262421] rounded-lg p-5 border border-[#312e2b] shadow-2xl">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <ChartBarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Engine Evaluation</span>
            </div>
            <div className={`text-4xl font-black tabular-nums tracking-tighter ${isNeutral ? 'text-gray-200' : (evaluation > 0 ? 'text-white' : 'text-gray-400')}`}>
              {scorePrefix}{displayScore}
            </div>
            <div className="mt-2 text-[10px] font-bold text-gray-600 uppercase">
              {isNeutral ? 'Even Position' : (evaluation > 0 ? 'White is better' : 'Black is better')}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col py-4 gap-1">
        <NavItem 
          icon={<StarIcon className="w-6 h-6" />} 
          label="Analyze Game" 
          active={currentMode === AppMode.GAME_REVIEW || currentMode === AppMode.DASHBOARD}
          onClick={() => onModeChange(AppMode.DASHBOARD)}
          color="text-emerald-500"
        />
        <NavItem 
          icon={<PuzzlePieceIcon className="w-6 h-6" />} 
          label="Puzzles" 
          active={currentMode === AppMode.PUZZLES}
          onClick={() => onModeChange(AppMode.PUZZLES)}
          color="text-orange-400"
        />
      </div>

      <div className="p-6 mt-auto">
        <div className="bg-[#262421] p-4 rounded-xl border border-white/5">
           <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">Pro Tip</p>
           <p className="text-sm text-gray-300 leading-relaxed">
             "Look for checks, captures, and threats in that order."
           </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
