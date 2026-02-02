
import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import ChessBoard from './components/ChessBoard';
import EvalBar from './components/EvalBar';
import GameReviewPanel from './components/GameReviewPanel';
import PGNUpload from './components/PGNUpload';
import Sidebar from './components/Sidebar';
import { AppMode, GameReviewData, MoveClassification, GameStats } from './types';
import { INITIAL_FEN } from './constants';
import { engine } from './engineService';
import { BoltIcon } from '@heroicons/react/24/outline';

// Professional move classification thresholds
const classifyMove = (prevScore: number, currentScore: number, isBest: boolean, isWhite: boolean): MoveClassification => {
  const loss = isWhite ? (prevScore - currentScore) : (currentScore - prevScore);
  
  if (isBest) return MoveClassification.BEST;
  
  if (loss <= 15) return MoveClassification.EXCELLENT;
  if (loss <= 45) return MoveClassification.GOOD;
  if (loss <= 100) return MoveClassification.INACCURACY;
  if (loss <= 250) return MoveClassification.MISTAKE;
  if (loss <= 500) return MoveClassification.MISS;
  return MoveClassification.BLUNDER;
};

const createEmptyStats = (): GameStats => ({
  accuracy: 0,
  moves: {
    [MoveClassification.BRILLIANT]: 0,
    [MoveClassification.GREAT]: 0,
    [MoveClassification.BEST]: 0,
    [MoveClassification.EXCELLENT]: 0,
    [MoveClassification.GOOD]: 0,
    [MoveClassification.BOOK]: 0,
    [MoveClassification.INACCURACY]: 0,
    [MoveClassification.MISTAKE]: 0,
    [MoveClassification.MISS]: 0,
    [MoveClassification.BLUNDER]: 0,
  },
  ratingEstimate: 1200
});

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [reviewData, setReviewData] = useState<GameReviewData | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [evaluation, setEvaluation] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Initialize engine
  useEffect(() => {
    engine.init().catch(console.error);
  }, []);

  const handleMove = useCallback((move: Move) => {
    const newGame = new Chess(game.fen());
    try {
      newGame.move(move);
      setGame(newGame);
      setFen(newGame.fen());
      
      // Real-time engine eval for the board
      engine.getAnalysis(newGame.fen()).then(analysis => {
        setEvaluation(analysis.score);
      });
    } catch (e) {
      console.error("Invalid move", e);
    }
  }, [game]);

  const handlePGNUpload = async (pgn: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const tempGame = new Chess();
    try {
      tempGame.loadPgn(pgn);
    } catch (e) {
      alert("Invalid PGN format. Please check the content.");
      setIsAnalyzing(false);
      return;
    }

    const historyVerbose = tempGame.history({ verbose: true });
    if (historyVerbose.length === 0) {
      alert("This PGN contains no moves.");
      setIsAnalyzing(false);
      return;
    }

    const playbackGame = new Chess();
    const evalHistory: number[] = [0];
    const moveSANs: string[] = [];
    const moveClassifications: MoveClassification[] = [];

    const whiteStats = createEmptyStats();
    const blackStats = createEmptyStats();

    try {
      await engine.init();
      
      // Initial eval for move comparison
      const initialEvalRes = await engine.getAnalysis(INITIAL_FEN, 10);
      let lastEval = initialEvalRes.score;

      // Analyze each move
      for (let i = 0; i < historyVerbose.length; i++) {
        const move = historyVerbose[i];
        
        // Before playing the move, what was the best move in the position?
        // (Simple version: we classify based on centipawn loss)
        playbackGame.move(move);
        moveSANs.push(move.san);
        const currentFen = playbackGame.fen();
        
        const currentEval = await engine.getAnalysis(currentFen, 11);
        const score = currentEval.score;
        evalHistory.push(score);
        
        const isWhite = i % 2 === 0;
        const classification = classifyMove(lastEval, score, false, isWhite);
        moveClassifications.push(classification);
        
        const stats = isWhite ? whiteStats : blackStats;
        stats.moves[classification]++;
        
        lastEval = score;
        setAnalysisProgress(Math.round(((i + 1) / historyVerbose.length) * 100));
      }

      const calculateAccuracy = (stats: GameStats, totalMoves: number) => {
        if (totalMoves === 0) return 100;
        const weights = {
          [MoveClassification.BRILLIANT]: 1,
          [MoveClassification.GREAT]: 1,
          [MoveClassification.BEST]: 1,
          [MoveClassification.EXCELLENT]: 0.95,
          [MoveClassification.GOOD]: 0.8,
          [MoveClassification.BOOK]: 1,
          [MoveClassification.INACCURACY]: 0.5,
          [MoveClassification.MISTAKE]: 0.2,
          [MoveClassification.MISS]: 0,
          [MoveClassification.BLUNDER]: -0.5
        };
        
        let sum = 0;
        Object.entries(stats.moves).forEach(([key, count]) => {
          sum += count * weights[key as MoveClassification];
        });
        
        return Math.max(0, Math.min(100, (sum / totalMoves) * 100));
      };

      const whiteMoveCount = Math.ceil(historyVerbose.length / 2);
      const blackMoveCount = Math.floor(historyVerbose.length / 2);

      whiteStats.accuracy = calculateAccuracy(whiteStats, whiteMoveCount);
      blackStats.accuracy = calculateAccuracy(blackStats, blackMoveCount);
      whiteStats.ratingEstimate = Math.round(800 + whiteStats.accuracy * 18);
      blackStats.ratingEstimate = Math.round(800 + blackStats.accuracy * 18);

      setReviewData({
        white: whiteStats,
        black: blackStats,
        evalHistory,
        moveHistory: moveSANs,
        moveClassifications
      });
      setMode(AppMode.GAME_REVIEW);
      setGame(new Chess());
      setFen(INITIAL_FEN);
      setCurrentMoveIndex(-1);
    } catch (err) {
      console.error("Analysis Error:", err);
      alert("An error occurred during engine analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startReview = () => {
    setCurrentMoveIndex(0);
    const reviewGame = new Chess();
    if (reviewData?.moveHistory[0]) {
      reviewGame.move(reviewData.moveHistory[0]);
    }
    setGame(reviewGame);
    setFen(reviewGame.fen());
    setEvaluation(reviewData?.evalHistory[1] || 0);
  };

  const navigateReview = (direction: 'next' | 'prev') => {
    if (!reviewData) return;
    
    let newIndex = currentMoveIndex;
    if (direction === 'next' && currentMoveIndex < reviewData.moveHistory.length - 1) {
      newIndex++;
    } else if (direction === 'prev' && currentMoveIndex > 0) {
      newIndex--;
    } else if (direction === 'prev' && currentMoveIndex === 0) {
      newIndex = -1;
    } else {
      return;
    }

    const reviewGame = new Chess();
    if (newIndex === -1) {
      setGame(reviewGame);
      setFen(INITIAL_FEN);
      setCurrentMoveIndex(-1);
      setEvaluation(0);
      return;
    }

    for (let i = 0; i <= newIndex; i++) {
      reviewGame.move(reviewData.moveHistory[i]);
    }
    setGame(reviewGame);
    setFen(reviewGame.fen());
    setCurrentMoveIndex(newIndex);
    setEvaluation(reviewData.evalHistory[newIndex + 1]);
  };

  // Helper to get the last move's squares and classification for rendering
  const getCurrentMoveData = () => {
    if (currentMoveIndex < 0 || !reviewData) return null;
    const history = game.history({ verbose: true });
    const lastMove = history[history.length - 1];
    if (!lastMove) return null;

    return {
      from: lastMove.from,
      to: lastMove.to,
      classification: reviewData.moveClassifications[currentMoveIndex]
    };
  };

  return (
    <div className="flex h-screen bg-[#161512] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      <Sidebar 
        currentMode={mode} 
        onModeChange={(newMode) => {
          if (newMode === AppMode.DASHBOARD) {
            setReviewData(null);
            setGame(new Chess());
            setFen(INITIAL_FEN);
            setCurrentMoveIndex(-1);
          }
          setMode(newMode);
        }} 
        evaluation={evaluation}
        showEvaluation={mode === AppMode.GAME_REVIEW && currentMoveIndex >= 0}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-[#161512]/95 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-64 h-2 bg-[#262421] rounded-full overflow-hidden mb-6 shadow-inner">
              <div 
                className="h-full bg-[#81b64c] transition-all duration-300 shadow-[0_0_15px_rgba(129,182,76,0.4)]" 
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
               <BoltIcon className="w-10 h-10 text-[#81b64c] animate-bounce" />
               <p className="text-white font-black text-2xl tracking-tighter">STOCKFISH IS THINKING</p>
               <p className="text-[#81b64c] font-black uppercase tracking-widest text-xs opacity-80">
                 Analyzing Position {analysisProgress}%
               </p>
            </div>
          </div>
        )}

        {mode === AppMode.DASHBOARD ? (
          <PGNUpload onUpload={handlePGNUpload} />
        ) : (
          <div className="flex gap-8 items-start h-[600px] animate-in fade-in duration-500">
            <EvalBar score={evaluation} turn={game.turn()} />
            <div className="w-[600px] shadow-2xl">
              <ChessBoard 
                fen={fen} 
                onMove={handleMove}
                isDraggable={mode !== AppMode.GAME_REVIEW}
                lastMove={getCurrentMoveData()}
              />
            </div>
            {mode === AppMode.GAME_REVIEW && reviewData && (
              <GameReviewPanel 
                data={reviewData}
                onNewGame={() => setMode(AppMode.DASHBOARD)}
                onStartReview={startReview}
                onNext={() => navigateReview('next')}
                onPrev={() => navigateReview('prev')}
                currentMoveIndex={currentMoveIndex}
                totalMoves={reviewData.moveHistory.length}
                currentMoveSAN={reviewData.moveHistory[currentMoveIndex]}
                currentMoveClassification={reviewData.moveClassifications[currentMoveIndex]}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
