
import React, { useState, useEffect } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import { PIECE_IMAGES } from '../constants';
import { MoveClassification } from '../types';
import { 
  StarIcon, 
  CheckIcon, 
  XMarkIcon,
  HandThumbUpIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid';

interface ChessBoardProps {
  fen: string;
  onMove?: (move: any) => void;
  isDraggable?: boolean;
  lastMove?: {
    from: string;
    to: string;
    classification?: MoveClassification;
  } | null;
  bestMove?: string | null; 
  showBestMove?: boolean;
}

const getSquareCoords = (square: string) => {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0, 8=7
  return { x: file * 12.5 + 6.25, y: (7 - rank) * 12.5 + 6.25 };
};

const Arrow: React.FC<{ from: string; to: string; color: string; opacity?: number }> = ({ from, to, color, opacity = 0.5 }) => {
  const start = getSquareCoords(from);
  const end = getSquareCoords(to);
  
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headSize = 0.4; // Very small arrowhead
  const arrowEnd = {
    x: end.x - headSize * Math.cos(angle),
    y: end.y - headSize * Math.sin(angle)
  };

  const id = `arrowhead-${color.replace('#', '')}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]" viewBox="0 0 100 100">
      <defs>
        <marker id={id} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill={color} fillOpacity={opacity} />
        </marker>
      </defs>
      <line 
        x1={start.x} y1={start.y} 
        x2={arrowEnd.x} y2={arrowEnd.y} 
        stroke={color} 
        strokeWidth="1.2" 
        strokeOpacity={opacity}
        markerEnd={`url(#${id})`}
        strokeLinecap="round"
      />
    </svg>
  );
};

const QualityMarker: React.FC<{ classification: MoveClassification }> = ({ classification }) => {
  const baseClass = "absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#1a1917] z-30 shadow-xl";
  
  switch (classification) {
    case MoveClassification.BRILLIANT:
      return <div className={`${baseClass} bg-cyan-400 text-white font-black text-[10px]`}>!!</div>;
    case MoveClassification.GREAT:
      return <div className={`${baseClass} bg-blue-500 text-white font-black text-[10px]`}>!</div>;
    case MoveClassification.BEST:
      return <div className={`${baseClass} bg-green-500 text-white`}><StarIcon className="w-4 h-4" /></div>;
    case MoveClassification.GOOD:
      return <div className={`${baseClass} bg-emerald-400 text-white`}><CheckIcon className="w-4 h-4 stroke-[3]" /></div>;
    case MoveClassification.BOOK:
      return <div className={`${baseClass} bg-[#d5a077] text-white`}><BookOpenIcon className="w-4 h-4" /></div>;
    case MoveClassification.MISS:
      return <div className={`${baseClass} bg-red-400 text-white`}><XMarkIcon className="w-4 h-4 stroke-[3]" /></div>;
    case MoveClassification.BLUNDER:
      return <div className={`${baseClass} bg-red-600 text-white font-black text-[10px]`}>??</div>;
    default:
      return null;
  }
};

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, onMove, isDraggable = true, lastMove, bestMove, showBestMove }) => {
  const [game, setGame] = useState(new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  useEffect(() => {
    setGame(new Chess(fen));
  }, [fen]);

  const handleSquareClick = (square: string) => {
    if (!isDraggable) return;

    if (selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          onMove?.(move);
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      } catch (e) {}
    }

    const piece = game.get(square as ChessSquare);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square: square as ChessSquare, verbose: true });
      setValidMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const renderBoard = () => {
    const squares = [];
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = r;
        const col = c;
        const squareName = `${String.fromCharCode(97 + col)}${8 - row}`;
        const piece = board[row][col];
        const isDark = (row + col) % 2 === 1;
        const isSelected = selectedSquare === squareName;
        const isValidMove = validMoves.includes(squareName);
        const isLastMoveOrigin = lastMove?.from === squareName;
        const isLastMoveTarget = lastMove?.to === squareName;

        squares.push(
          <div
            key={squareName}
            onClick={() => handleSquareClick(squareName)}
            className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200
              ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
              ${isSelected ? 'bg-yellow-200/60' : ''}
              ${(isLastMoveOrigin || isLastMoveTarget) ? 'bg-yellow-400/30' : ''}
              ${isValidMove ? 'after:content-[""] after:w-4 after:h-4 after:bg-black/20 after:rounded-full after:z-10' : ''}
            `}
          >
            {piece && (
              <img
                src={PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`]}
                alt={`${piece.color}${piece.type}`}
                className="w-[85%] h-[85%] select-none pointer-events-none z-10"
              />
            )}
            
            {isLastMoveTarget && lastMove?.classification && (
              <QualityMarker classification={lastMove.classification} />
            )}

            {col === 0 && (
              <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>
                {8 - row}
              </span>
            )}
            {row === 7 && (
              <span className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>
                {String.fromCharCode(97 + col)}
              </span>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="relative w-full max-w-[600px] aspect-square rounded shadow-2xl overflow-hidden border-4 border-[#312e2b] bg-[#312e2b]">
      <div className="chess-board-grid h-full relative z-0">
        {renderBoard()}
      </div>
      
      {showBestMove && bestMove && bestMove.length >= 4 && (
        <Arrow 
          from={bestMove.slice(0, 2)} 
          to={bestMove.slice(2, 4)} 
          color="#22c55e" 
          opacity={0.6}
        />
      )}
    </div>
  );
};

export default ChessBoard;
