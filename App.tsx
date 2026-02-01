
import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import Sidebar from './components/Sidebar';
import ChessBoard from './components/ChessBoard';
import EvalBar from './components/EvalBar';
import GameReviewPanel from './components/GameReviewPanel';
import PGNUpload from './components/PGNUpload';
import { AppMode, CoachMessage, AnalysisResult, GameReviewData, MoveClassification } from './types';
import { INITIAL_FEN } from './constants';
import { getCoachResponse, analyzePosition } from './geminiService';
import { engine, EngineAnalysis } from './engineService';
import { 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon, 
  ArrowPathIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GAME_REVIEW);
  const [fen, setFen] = useState(INITIAL_FEN);
  const [game, setGame] = useState(new Chess(INITIAL_FEN));
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<AnalysisResult | null>(null);
  const [stockfishAnalysis, setStockfishAnalysis] = useState<EngineAnalysis | null>(null);
  const [isEngineEnabled, setIsEngineEnabled] = useState(true);
  
  const [lastMoveInfo, setLastMoveInfo] = useState<{from: string, to: string, classification?: MoveClassification} | null>(null);
  const [reviewData, setReviewData] = useState<GameReviewData | null>(null);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [moves, setMoves] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engine.init().then(() => {
      runEngineAnalysis(INITIAL_FEN);
    });
  }, []);

  const runEngineAnalysis = (currentFen: string) => {
    if (!isEngineEnabled) return;
    engine.analyze(currentFen, 18, (analysis) => {
      setStockfishAnalysis(analysis);
    });
  };

  const handleMove = async (move: any) => {
    const newGame = new Chess(game.fen());
    newGame.move(move);
    setGame(newGame);
    setFen(newGame.fen());
    
    // Quick classification based on engine recommendation from PREVIOUS position
    let classification = MoveClassification.GOOD;
    if (stockfishAnalysis && move.lan === stockfishAnalysis.bestMove) {
      classification = MoveClassification.BEST;
    } else if (move.flags.includes('b')) {
      classification = MoveClassification.BOOK;
    }
    
    setLastMoveInfo({ from: move.from, to: move.to, classification });
    runEngineAnalysis(newGame.fen());

    if (mode === AppMode.PLAY_COACH) {
      setIsLoading(true);
      try {
        const response = await getCoachResponse(newGame.fen(), move.san, messages);
        addMessage(response || "Interesting move!", 'coach');
      } catch (error) {
        console.error("Coach failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addMessage = (text: string, role: CoachMessage['role']) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      text,
      timestamp: Date.now()
    }]);
  };

  const handleUploadPGN = async (pgn: string) => {
    setIsLoading(true);
    try {
      const tempGame = new Chess();
      tempGame.loadPgn(pgn);
      const history = tempGame.history({ verbose: true });
      setMoves(history.map(m => m.lan));
      
      const dummyReview: GameReviewData = {
        white: {
          accuracy: 72.4, ratingEstimate: 950,
          moves: { [MoveClassification.BRILLIANT]: 0, [MoveClassification.GREAT]: 2, [MoveClassification.BEST]: 15, [MoveClassification.EXCELLENT]: 10, [MoveClassification.GOOD]: 10, [MoveClassification.BOOK]: 4, [MoveClassification.INACCURACY]: 2, [MoveClassification.MISTAKE]: 1, [MoveClassification.MISS]: 0, [MoveClassification.BLUNDER]: 0 }
        },
        black: {
          accuracy: 68.1, ratingEstimate: 900,
          moves: { [MoveClassification.BRILLIANT]: 0, [MoveClassification.GREAT]: 1, [MoveClassification.BEST]: 12, [MoveClassification.EXCELLENT]: 12, [MoveClassification.GOOD]: 12, [MoveClassification.BOOK]: 4, [MoveClassification.INACCURACY]: 3, [MoveClassification.MISTAKE]: 2, [MoveClassification.MISS]: 1, [MoveClassification.BLUNDER]: 1 }
        },
        evalHistory: history.map((_, i) => Math.sin(i / 5) * 150 + (Math.random() - 0.5) * 50),
        moveHistory: history.map(m => m.san)
      };

      setReviewData(dummyReview);
      setGame(new Chess());
      setFen(INITIAL_FEN);
      setMoveIndex(-1);
      setLastMoveInfo(null);
    } catch (e) {
      alert("Invalid PGN file.");
    } finally {
      setIsLoading(false);
    }
  };

  const jumpToMove = (index: number) => {
    if (index < -1 || index >= moves.length) return;
    const tempGame = new Chess();
    let lastMoveObj = null;
    for (let i = 0; i <= index; i++) {
      lastMoveObj = tempGame.move(moves[i]);
    }
    setGame(tempGame);
    setFen(tempGame.fen());
    setMoveIndex(index);
    if (lastMoveObj) {
      setLastMoveInfo({ from: lastMoveObj.from, to: lastMoveObj.to, classification: MoveClassification.GOOD });
    } else {
      setLastMoveInfo(null);
    }
    runEngineAnalysis(tempGame.fen());
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode !== AppMode.GAME_REVIEW) setReviewData(null);
  };

  const handleGeminiAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await analyzePosition(game.fen());
      addMessage(`Strategic Advice: ${result.explanation}`, 'coach');
    } catch (e) {
      addMessage("Gemini analysis failed.", 'system');
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGame(new Chess(INITIAL_FEN));
    setFen(INITIAL_FEN);
    setMessages([]);
    setStockfishAnalysis(null);
    setReviewData(null);
    setMoveIndex(-1);
    setLastMoveInfo(null);
    runEngineAnalysis(INITIAL_FEN);
  };

  return (
    <div className="flex h-screen bg-[#1a1917] overflow-hidden text-white">
      <Sidebar 
        currentMode={mode} 
        onModeChange={handleModeChange} 
        evaluation={stockfishAnalysis?.score || 0}
      />

      <main className="flex-1 flex flex-col items-center justify-center overflow-auto p-4 md:p-8 gap-6">
        {mode === AppMode.GAME_REVIEW && !reviewData ? (
          <PGNUpload onUpload={handleUploadPGN} />
        ) : (
          <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6">
            <div className="flex-shrink-0 flex flex-col gap-4">
              <div className="bg-[#262421] p-4 rounded-lg shadow-xl flex items-center justify-between border border-[#312e2b]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xl shadow-lg">AI</div>
                  <div>
                    <h3 className="font-bold text-sm">{mode === AppMode.GAME_REVIEW ? "Analysis Mode" : "Chess Helper"}</h3>
                    <p className="text-xs text-gray-400">Stockfish 16.1 Active</p>
                  </div>
                </div>
                {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
              </div>

              <div className="flex gap-4">
                <EvalBar score={stockfishAnalysis?.score || 0} turn={game.turn()} />
                <ChessBoard 
                  fen={fen} 
                  onMove={handleMove} 
                  isDraggable={mode !== AppMode.GAME_REVIEW} 
                  lastMove={lastMoveInfo}
                  showBestMove={false} // Removed automatic best move arrow as per user request
                />
              </div>

              <div className="bg-[#262421] p-3 rounded-lg flex items-center gap-4 justify-center border border-[#312e2b] shadow-inner">
                <div className="flex items-center gap-2">
                  <button onClick={resetGame} className="p-2 hover:bg-[#312e2b] rounded transition-colors text-gray-400" title="Reset Game">
                    <ArrowPathIcon className="w-6 h-6" />
                  </button>
                  <button className="p-2 hover:bg-[#312e2b] rounded transition-colors text-gray-400" title="Toggle Engine" onClick={() => setIsEngineEnabled(!isEngineEnabled)}>
                    <ChartBarIcon className={`w-6 h-6 ${isEngineEnabled ? 'text-blue-400' : 'text-gray-600'}`} />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-[#312e2b]" />

                <div className="flex items-center gap-1">
                  <button disabled={moveIndex < 0} onClick={() => jumpToMove(moveIndex - 1)} className="p-2 hover:bg-[#312e2b] rounded transition-colors text-gray-400 disabled:opacity-30">
                    <ChevronDoubleLeftIcon className="w-6 h-6" />
                  </button>
                  <button disabled={moveIndex >= moves.length - 1} onClick={() => jumpToMove(moveIndex + 1)} className="p-2 hover:bg-[#312e2b] rounded transition-colors text-gray-400 disabled:opacity-30">
                    <ChevronDoubleRightIcon className="w-6 h-6" />
                  </button>
                  <button onClick={handleGeminiAnalysis} className="p-2 hover:bg-[#312e2b] rounded transition-colors text-green-500">
                    <SparklesIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            {reviewData && <GameReviewPanel data={reviewData} onNewGame={resetGame} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
