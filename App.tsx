
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import ChessBoard from './components/ChessBoard';
import EvalBar from './components/EvalBar';
import GameReviewPanel from './components/GameReviewPanel';
import PuzzlePanel from './components/PuzzlePanel';
import PGNUpload from './components/PGNUpload';
import Sidebar from './components/Sidebar';
import { AppMode, GameReviewData, MoveClassification, GameStats } from './types';
import { INITIAL_FEN, SAMPLE_PUZZLES } from './constants';
import { engine } from './engineService';
import { playMoveSound, playFeedbackSound } from './soundService';
import { BoltIcon, PuzzlePieceIcon, PlayIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Analytics } from '@vercel/analytics/react';

// --- CHESS.COM STYLE MATH HELPERS ---

/**
 * Converts raw centipawns to a winning percentage (0 to 100).
 * Uses a sigmoid curve so that differences in equal positions matter more 
 * than differences in completely won/lost positions.
 */
const getWinChance = (centipawns: number): number => {
  // A standard constant used to map Stockfish CP to Win %.
  // 100 cp (1 pawn) usually equates to roughly 50% -> 60-64% win chance.
  const c = 1.5; 
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * centipawns)) - 1);
};

// Professional move classification thresholds based on Win Chance Loss, not just CP
const classifyMove = (prevScore: number, currentScore: number, isBest: boolean, isWhite: boolean): MoveClassification => {
  // Convert absolute CP scores to Win Chances
  const prevWin = getWinChance(isWhite ? prevScore : -prevScore);
  const currentWin = getWinChance(isWhite ? currentScore : -currentScore);
  
  // Calculate how much "Win Probability" was lost
  const winChanceLoss = Math.max(0, prevWin - currentWin);

  if (isBest) return MoveClassification.BEST;

  // These thresholds essentially mimic CAPS logic
  if (winChanceLoss <= 2) return MoveClassification.EXCELLENT; // Hardly lost any winning chances
  if (winChanceLoss <= 8) return MoveClassification.GOOD;
  if (winChanceLoss <= 15) return MoveClassification.INACCURACY;
  if (winChanceLoss <= 25) return MoveClassification.MISTAKE;
  if (winChanceLoss > 25) return MoveClassification.BLUNDER;
  
  // Fallback
  return MoveClassification.MISS; 
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
  ratingEstimate: 400 // Floor rating
});

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  
  // Review/Analysis State
  const [reviewData, setReviewData] = useState<GameReviewData | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [evaluation, setEvaluation] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showBestMove, setShowBestMove] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<string>('Calculating...');

  // Puzzle State
  const [showPuzzleMenu, setShowPuzzleMenu] = useState(true);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [puzzleMoveIndex, setPuzzleMoveIndex] = useState(0); // Tracks progress in solution array
  const [hintSquare, setHintSquare] = useState<string | null>(null);

  // Initialize engine
  useEffect(() => {
    engine.init().catch(console.error);
  }, []);

  // --- PUZZLE LOGIC ---

  const loadPuzzle = useCallback((index: number) => {
    if (!SAMPLE_PUZZLES[index]) return;
    const puzzle = SAMPLE_PUZZLES[index];
    const puzzleGame = new Chess(puzzle.fen);
    
    setGame(puzzleGame);
    setFen(puzzleGame.fen());
    setActivePuzzleIndex(index);
    setPuzzleStatus('solving');
    setPuzzleMoveIndex(0);
    setEvaluation(0); // Reset eval
    setShowPuzzleMenu(false); // Hide menu, show board
    setHintSquare(null);
  }, []);

  // Helper to safely reconstruct the board state at a specific point in the puzzle solution
  const getPuzzleStateAt = (puzzleIndex: number, moveIndex: number) => {
    const puzzle = SAMPLE_PUZZLES[puzzleIndex];
    if (!puzzle) return new Chess();
    
    const tmpGame = new Chess(puzzle.fen);
    
    // Replay moves up to the current index
    for (let i = 0; i < moveIndex; i++) {
      const lan = puzzle.solution[i];
      if (!lan) break;
      
      const from = lan.substring(0, 2);
      const to = lan.substring(2, 4);
      const promotion = lan.length > 4 ? lan[4] : undefined;
      
      try {
        tmpGame.move({ from, to, promotion });
      } catch (e) {
        console.error(`Failed to replay puzzle move ${lan}`, e);
      }
    }
    return tmpGame;
  };

  const handleHint = () => {
    if (puzzleStatus !== 'solving') return;
    const puzzle = SAMPLE_PUZZLES[activePuzzleIndex];
    if (!puzzle) return;
    
    // Get the current expected move LAN
    const expectedMoveLAN = puzzle.solution[puzzleMoveIndex];
    if (expectedMoveLAN) {
      setHintSquare(expectedMoveLAN.substring(0, 2));
    }
  };

  const handlePuzzleMove = (move: Move) => {
    if (puzzleStatus !== 'solving') return;

    const puzzle = SAMPLE_PUZZLES[activePuzzleIndex];
    // Expected move format: "e2e4"
    const expectedMoveLAN = puzzle.solution[puzzleMoveIndex];
    const playedMoveLAN = move.from + move.to;

    // Check if correct
    const isCorrect = playedMoveLAN === expectedMoveLAN || (move.promotion && (playedMoveLAN + move.promotion) === expectedMoveLAN);

    // Apply move to state immediately (even if incorrect, so user sees it)
    const newGame = new Chess(game.fen());
    let resultMove;
    try {
      resultMove = newGame.move(move);
    } catch (e) {
      return; // Illegal move
    }
    
    setGame(newGame);
    setFen(newGame.fen());
    playMoveSound(newGame, resultMove);

    if (isCorrect) {
      setHintSquare(null); // Clear hint on correct move
      const nextMoveIndex = puzzleMoveIndex + 1;
      setPuzzleMoveIndex(nextMoveIndex);

      if (nextMoveIndex >= puzzle.solution.length) {
        setPuzzleStatus('solved');
        playFeedbackSound('success');
      } else {
        // Opponent Move (Auto)
        setTimeout(() => {
          try {
            const opponentMoveLAN = puzzle.solution[nextMoveIndex];
            if (!opponentMoveLAN) return;
            
            const opponentFrom = opponentMoveLAN.substring(0, 2);
            const opponentTo = opponentMoveLAN.substring(2, 4);
            const opponentPromotion = opponentMoveLAN.length > 4 ? opponentMoveLAN[4] : undefined;

            const gameAfterOpponent = new Chess(newGame.fen());
            
            // Validate the move before making it to prevent crash
            const possibleMoves = gameAfterOpponent.moves({ verbose: true });
            const isValid = possibleMoves.some(m => 
              m.from === opponentFrom && 
              m.to === opponentTo && 
              (!opponentPromotion || m.promotion === opponentPromotion)
            );

            if (isValid) {
              const opResultMove = gameAfterOpponent.move({
                from: opponentFrom,
                to: opponentTo,
                promotion: opponentPromotion
              });
              
              setGame(gameAfterOpponent);
              setFen(gameAfterOpponent.fen());
              setPuzzleMoveIndex(nextMoveIndex + 1);
              
              playMoveSound(gameAfterOpponent, opResultMove);
            } else {
              console.error("Invalid puzzle opponent move configured:", opponentMoveLAN);
            }
          } catch (e) {
            console.error("Error executing opponent puzzle move:", e);
          }
        }, 500);
      }
    } else {
      // WRONG MOVE LOGIC
      setPuzzleStatus('failed');
      playFeedbackSound('failure');
      // The board has been updated with the wrong move. 
      // User must click 'Retry' to undo.
    }
  };

  // --- STANDARD GAME LOGIC ---

  const handleMove = useCallback((move: Move) => {
    if (mode === AppMode.PUZZLES) {
      handlePuzzleMove(move);
      return;
    }

    const newGame = new Chess(game.fen());
    try {
      const resultMove = newGame.move(move);
      setGame(newGame);
      setFen(newGame.fen());
      
      playMoveSound(newGame, resultMove);

      // Real-time engine eval for the board
      engine.getAnalysis(newGame.fen()).then(analysis => {
        setEvaluation(analysis.score);
      });
    } catch (e) {
      console.error("Invalid move", e);
    }
  }, [game, mode, activePuzzleIndex, puzzleStatus, puzzleMoveIndex]); // Dependencies for puzzle logic

  const handlePGNUpload = async (pgn: string, depth: number = 12) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setEstimatedTime('Preparing analysis...');
    
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
    const whiteAccuracyScores: number[] = [];
    const blackAccuracyScores: number[] = [];
    const bestMoves: string[] = [];

    const whiteStats = createEmptyStats();
    const blackStats = createEmptyStats();

    try {
      await engine.init();
      
      // Initial eval for move comparison - Use selected depth for consistency
      const initialEvalRes = await engine.getAnalysis(INITIAL_FEN, depth);
      let lastEval = initialEvalRes.score;
      bestMoves.push(initialEvalRes.bestMove);

      const startTime = performance.now();

      // Analyze each move
      for (let i = 0; i < historyVerbose.length; i++) {
        const move = historyVerbose[i];
        const isWhite = i % 2 === 0;

        playbackGame.move(move);
        moveSANs.push(move.san);
        const currentFen = playbackGame.fen();
        
        // Use selected depth for analysis
        const currentEval = await engine.getAnalysis(currentFen, depth);
        const score = currentEval.score;
        evalHistory.push(score);
        bestMoves.push(currentEval.bestMove);
        
        // --- ACCURACY CALCULATION LOGIC ---
        // 1. Get Win% of the position BEFORE the move was played
        const prevWinPercent = getWinChance(isWhite ? lastEval : -lastEval);

        // 2. Get Win% of the position AFTER the move (Actual Result)
        const currentWinPercent = getWinChance(isWhite ? score : -score);
        
        // 3. (Simplified) We assume the "Best Move" would have maintained the previous evaluation roughly
        // In a real server-side app, we would calculate the Best Move's specific eval. 
        // Here, we approximate Best Move Win % as the Prev Win % (unless user improved position).
        const bestMoveWinPercent = Math.max(prevWinPercent, currentWinPercent);

        // 4. Calculate Accuracy for this specific move (0-100)
        // Formula: 100 - (Difference in Win Probability * Weighting)
        const diff = Math.max(0, bestMoveWinPercent - currentWinPercent);
        
        // This weighting curve ensures small mistakes don't tank score, but blunders do
        const moveAccuracy = Math.max(0, 100 - (diff * 2)); 
        
        if (isWhite) whiteAccuracyScores.push(moveAccuracy);
        else blackAccuracyScores.push(moveAccuracy);

        // Classification
        const classification = classifyMove(lastEval, score, false, isWhite);
        moveClassifications.push(classification);
        
        const stats = isWhite ? whiteStats : blackStats;
        stats.moves[classification]++;
        
        lastEval = score;
        setAnalysisProgress(Math.round(((i + 1) / historyVerbose.length) * 100));

        // Update estimated time
        const now = performance.now();
        const elapsed = now - startTime;
        const movesProcessed = i + 1;
        const avgTimePerMove = elapsed / movesProcessed;
        const remainingMoves = historyVerbose.length - movesProcessed;
        const remainingMs = remainingMoves * avgTimePerMove;

        if (remainingMs > 60000) {
           setEstimatedTime(`~${Math.ceil(remainingMs / 60000)} min remaining`);
        } else {
           setEstimatedTime(`${Math.ceil(remainingMs / 1000)}s remaining`);
        }
      }

      // Final Aggregation
      const calculateAverageAccuracy = (scores: number[]) => {
        if (scores.length === 0) return 0;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      };

      const calculateRatingEstimate = (accuracy: number) => {
         // This is a rough curve fitting based on general player population stats
         // 50% ~ 400 ELO
         // 95% ~ 2400 ELO
         if (accuracy < 20) return 200;
         if (accuracy < 50) return 400 + (accuracy * 10);
         // Exponential growth for higher accuracy
         return Math.round(600 + Math.pow(accuracy, 1.65) / 10);
      };

      whiteStats.accuracy = calculateAverageAccuracy(whiteAccuracyScores);
      blackStats.accuracy = calculateAverageAccuracy(blackAccuracyScores);
      
      whiteStats.ratingEstimate = calculateRatingEstimate(whiteStats.accuracy);
      blackStats.ratingEstimate = calculateRatingEstimate(blackStats.accuracy);

      setReviewData({
        white: whiteStats,
        black: blackStats,
        evalHistory,
        moveHistory: moveSANs,
        moveClassifications,
        bestMoves,
        depth // Store the selected depth
      });
      setMode(AppMode.GAME_REVIEW);
      setGame(new Chess());
      setFen(INITIAL_FEN);
      setCurrentMoveIndex(-1);
      playFeedbackSound('game-end');
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
      const m = reviewGame.move(reviewData.moveHistory[0]);
      playMoveSound(reviewGame, m);
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

    let lastMoveObj: Move | null = null;
    for (let i = 0; i <= newIndex; i++) {
      lastMoveObj = reviewGame.move(reviewData.moveHistory[i]);
    }
    
    // Play sound for the move we just navigated to (if going forward)
    if (direction === 'next' && lastMoveObj) {
      playMoveSound(reviewGame, lastMoveObj);
    }

    setGame(reviewGame);
    setFen(reviewGame.fen());
    setCurrentMoveIndex(newIndex);
    setEvaluation(reviewData.evalHistory[newIndex + 1]);
  };

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

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === AppMode.DASHBOARD) {
      setReviewData(null);
      setGame(new Chess());
      setFen(INITIAL_FEN);
      setCurrentMoveIndex(-1);
      setShowBestMove(false);
      setMode(AppMode.DASHBOARD);
    } else if (newMode === AppMode.PUZZLES) {
      setMode(AppMode.PUZZLES);
      setShowPuzzleMenu(true); // Always show menu when entering puzzle mode
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="flex h-dvh bg-[#161512] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      <Sidebar 
        currentMode={mode} 
        onModeChange={handleModeChange} 
        evaluation={evaluation}
        showEvaluation={mode === AppMode.GAME_REVIEW && currentMoveIndex >= 0}
      />
      
      {/* 
        Modified Main Container: 
        1. Added 'overflow-y-auto' to allow vertical scrolling for long content (like the puzzle grid).
        2. Added 'custom-scrollbar' for styling.
        3. Removed 'items-center justify-center' from the parent and handled centering within children 
           where necessary, to prevent cut-off content on smaller screens.
      */}
      <main className="flex-1 flex flex-col p-8 relative overflow-y-auto custom-scrollbar">
        
        {/* Centering wrapper for content that needs to be centered (like the board or upload) */}
        <div className={`w-full flex-1 flex flex-col items-center ${mode === AppMode.PUZZLES && showPuzzleMenu ? 'justify-start' : 'justify-center'} min-h-min`}>

          {isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-[#161512]/95 backdrop-blur-md flex flex-col items-center justify-center fixed top-0 left-0 h-full w-full">
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
                 <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mt-1 animate-pulse">
                   {estimatedTime}
                 </p>
              </div>
            </div>
          )}

          {mode === AppMode.DASHBOARD && (
            <PGNUpload onUpload={handlePGNUpload} />
          )}

          {/* Puzzle Mode Logic */}
          {mode === AppMode.PUZZLES && (
            <>
              {showPuzzleMenu ? (
                <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-300 py-8">
                  <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                      <PuzzlePieceIcon className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tight mb-3">Tactical Puzzles</h2>
                    <p className="text-gray-400 text-lg">Sharpen your skills with these official patterns.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                    {SAMPLE_PUZZLES.map((puzzle, idx) => (
                      <button 
                        key={puzzle.id}
                        onClick={() => loadPuzzle(idx)}
                        className="bg-[#262421] hover:bg-[#312e2b] border border-[#312e2b] hover:border-orange-500/50 p-6 rounded-xl text-left transition-all duration-200 group relative overflow-hidden shadow-lg hover:shadow-2xl active:scale-[0.98] flex flex-col h-full"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                           <PuzzlePieceIcon className="w-32 h-32 text-white -mr-8 -mt-8 transform rotate-12" />
                        </div>
                        
                        <div className="relative z-10 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <span className="bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                              #{puzzle.id}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-[#1a1917] px-2 py-1 rounded-full">
                              <BoltIcon className="w-3 h-3 text-yellow-500" />
                              {puzzle.rating}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-1">{puzzle.title}</h3>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-6">{puzzle.theme}</p>
                          
                          <div className="mt-auto flex items-center gap-2 text-[12px] font-bold text-emerald-500 bg-emerald-500/5 p-2 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                            <PlayIcon className="w-4 h-4" />
                            <span>Start Challenge</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 w-full max-w-6xl">
                   <div className="w-full flex justify-start">
                     <button 
                       onClick={() => setShowPuzzleMenu(true)}
                       className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors mb-2 bg-[#262421] px-4 py-2 rounded-full border border-white/5 hover:border-white/10"
                     >
                       ← Back to Puzzles
                     </button>
                   </div>
                   <div className="flex flex-col lg:flex-row items-center gap-8">
                     <div className="w-[600px] shadow-2xl rounded-lg overflow-hidden border border-[#312e2b]">
                       <ChessBoard 
                         fen={fen} 
                         onMove={handleMove}
                         isDraggable={puzzleStatus === 'solving'}
                         lastMove={null} 
                         hintSquare={hintSquare}
                       />
                     </div>
                     <PuzzlePanel 
                       puzzle={SAMPLE_PUZZLES[activePuzzleIndex]}
                       status={puzzleStatus}
                       onRetry={() => {
                         setPuzzleStatus('solving');
                         const cleanGame = getPuzzleStateAt(activePuzzleIndex, puzzleMoveIndex);
                         setGame(cleanGame);
                         setFen(cleanGame.fen());
                         setHintSquare(null);
                       }}
                       onNext={() => {
                          if (activePuzzleIndex < SAMPLE_PUZZLES.length - 1) {
                            loadPuzzle(activePuzzleIndex + 1);
                          } else {
                            setShowPuzzleMenu(true);
                          }
                       }}
                       onHint={handleHint}
                       isWhiteTurn={game.turn() === 'w'}
                     />
                   </div>
                </div>
              )}
            </>
          )}

          {/* Game Review View */}
          {mode === AppMode.GAME_REVIEW && (
            <div className="flex gap-8 items-start h-[600px] animate-in fade-in duration-500">
              <EvalBar score={evaluation} turn={game.turn()} />
              <div className="w-[600px] shadow-2xl">
                <ChessBoard 
                  fen={fen} 
                  onMove={handleMove}
                  isDraggable={false}
                  lastMove={getCurrentMoveData()}
                  bestMove={showBestMove && reviewData ? reviewData.bestMoves[currentMoveIndex + 1] : null}
                />
              </div>
              {reviewData && (
                <GameReviewPanel 
                  data={reviewData}
                  onNewGame={() => handleModeChange(AppMode.DASHBOARD)}
                  onStartReview={startReview}
                  onNext={() => navigateReview('next')}
                  onPrev={() => navigateReview('prev')}
                  currentMoveIndex={currentMoveIndex}
                  totalMoves={reviewData.moveHistory.length}
                  currentMoveSAN={reviewData.moveHistory[currentMoveIndex]}
                  currentMoveClassification={reviewData.moveClassifications[currentMoveIndex]}
                  showBestMove={showBestMove}
                  onToggleBestMove={() => setShowBestMove(!showBestMove)}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Analytics />
    </div>
  );
};

export default App;
