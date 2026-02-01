
import React, { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PGNUploadProps {
  onUpload: (pgn: string) => void;
}

const PGNUpload: React.FC<PGNUploadProps> = ({ onUpload }) => {
  const [pgn, setPgn] = useState('');

  const handleUpload = () => {
    if (pgn.trim()) {
      onUpload(pgn);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#262421] rounded-xl border border-[#312e2b] shadow-2xl p-8 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
        <CloudArrowUpIcon className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Review Your Games</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        Paste your PGN below or upload a file to get a detailed accuracy analysis, move classification, and AI coaching insights.
      </p>

      <textarea
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder="[Event 'Live Chess']
[Site 'Chess.com']
[Date '2024.10.15']
..."
        className="w-full h-48 bg-[#1a1917] border border-[#312e2b] rounded-lg p-4 text-sm font-mono focus:border-indigo-500 focus:outline-none transition-colors mb-6 resize-none"
      />

      <div className="flex gap-4 w-full">
        <button
          onClick={handleUpload}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <DocumentTextIcon className="w-5 h-5" />
          Review Game
        </button>
        <label className="flex-1 bg-[#312e2b] hover:bg-[#3d3a37] text-white font-bold py-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-colors border-b-4 border-[#1a1917]">
          <CloudArrowUpIcon className="w-5 h-5" />
          Upload File
          <input 
            type="file" 
            className="hidden" 
            accept=".pgn" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (re) => onUpload(re.target?.result as string);
                reader.readAsText(file);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};

export default PGNUpload;
