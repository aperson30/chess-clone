
import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  BoltIcon, 
  ScaleIcon, 
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface PGNUploadProps {
  onUpload: (pgn: string, depth: number) => void;
}

const PGNUpload: React.FC<PGNUploadProps> = ({ onUpload }) => {
  const [pgn, setPgn] = useState('');
  const [depth, setDepth] = useState(12); // Default to Balanced

  const handleUpload = () => {
    if (pgn.trim()) {
      onUpload(pgn, depth);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const content = re.target?.result as string;
        if (content) {
          onUpload(content, depth);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#262421] rounded-xl border border-[#312e2b] shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-indigo-500/20">
        <CloudArrowUpIcon className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Review Your Games</h2>
      <p className="text-gray-400 mb-8 max-w-md text-sm leading-relaxed">
        Paste your PGN or upload a file for an AI-powered analysis with Move Classifications, Accuracy Scores, and Coaching.
      </p>

      {/* Depth Selector */}
      <div className="w-full mb-8 bg-[#1a1917] p-4 rounded-xl border border-[#312e2b]">
        <label className="block text-left text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Analysis Speed & Depth</label>
        <div className="grid grid-cols-4 gap-3">
           <button 
              onClick={() => setDepth(10)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 group ${depth === 10 ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-[#262421] border-[#312e2b] text-gray-500 hover:bg-[#312e2b] hover:border-gray-600'}`}
           >
              <BoltIcon className="w-6 h-6 mb-2" />
              <span className="font-bold text-[10px] uppercase tracking-wide">Fast</span>
              <span className="text-[9px] opacity-60 mt-0.5 font-mono">Dp 10</span>
              <span className={`text-[10px] font-black mt-2 transition-colors ${depth === 10 ? 'text-emerald-500' : 'text-gray-600'}`}>~10s</span>
           </button>
           <button 
              onClick={() => setDepth(12)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 group ${depth === 12 ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#262421] border-[#312e2b] text-gray-500 hover:bg-[#312e2b] hover:border-gray-600'}`}
           >
              <ScaleIcon className="w-6 h-6 mb-2" />
              <span className="font-bold text-[10px] uppercase tracking-wide">Balanced</span>
              <span className="text-[9px] opacity-60 mt-0.5 font-mono">Dp 12</span>
              <span className={`text-[10px] font-black mt-2 transition-colors ${depth === 12 ? 'text-blue-500' : 'text-gray-600'}`}>~45s</span>
           </button>
           <button 
              onClick={() => setDepth(15)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 group ${depth === 15 ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-[#262421] border-[#312e2b] text-gray-500 hover:bg-[#312e2b] hover:border-gray-600'}`}
           >
              <AcademicCapIcon className="w-6 h-6 mb-2" />
              <span className="font-bold text-[10px] uppercase tracking-wide">Deep</span>
              <span className="text-[9px] opacity-60 mt-0.5 font-mono">Dp 15</span>
              <span className={`text-[10px] font-black mt-2 transition-colors ${depth === 15 ? 'text-purple-500' : 'text-gray-600'}`}>~3m</span>
           </button>
           <button 
              onClick={() => setDepth(20)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 group ${depth === 20 ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-[#262421] border-[#312e2b] text-gray-500 hover:bg-[#312e2b] hover:border-gray-600'}`}
           >
              <TrophyIcon className="w-6 h-6 mb-2" />
              <span className="font-bold text-[10px] uppercase tracking-wide">Max</span>
              <span className="text-[9px] opacity-60 mt-0.5 font-mono">Dp 20</span>
              <span className={`text-[10px] font-black mt-2 transition-colors ${depth === 20 ? 'text-orange-500' : 'text-gray-600'}`}>~10m</span>
           </button>
        </div>
      </div>

      <textarea
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder="[Event 'Live Chess']
[Site 'Chess.com']
[Date '2024.10.15']
..."
        className="w-full h-32 bg-[#1a1917] border border-[#312e2b] rounded-lg p-4 text-xs font-mono text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors mb-6 resize-none placeholder:text-gray-600"
      />

      <div className="flex gap-4 w-full">
        <button
          onClick={handleUpload}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
        >
          <DocumentTextIcon className="w-5 h-5" />
          Start Analysis
        </button>
        <label className="flex-1 bg-[#312e2b] hover:bg-[#3d3a37] text-white font-bold py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5 hover:border-white/10">
          <CloudArrowUpIcon className="w-5 h-5 text-gray-400" />
          Upload PGN File
          <input 
            type="file" 
            className="hidden" 
            accept=".pgn" 
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};

export default PGNUpload;
