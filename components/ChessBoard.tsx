
import React, { useState, useEffect, useId } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import { PIECE_IMAGES } from '../constants';
import { MoveClassification } from '../types';
import { 
  StarIcon, 
  CheckIcon, 
  XMarkIcon,
  BookOpenIcon,
  ExclamationCircleIcon
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
  bestMove?: string | null; // e.g., "e2e4"
}

const QualityMarker: React.FC<{ classification: MoveClassification }> = ({ classification }) => {
  const baseClass = "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-[#1a1917] z-30 shadow-lg scale-90";
  
  switch (classification) {
    case MoveClassification.BRILLIANT:
      return <div className={`${baseClass} bg-cyan-400 text-white font-black text-[9px]`}>!!</div>;
    case MoveClassification.GREAT:
      return <div className={`${baseClass} bg-blue-500 text-white font-black text-[9px]`}>!</div>;
    case MoveClassification.BEST:
      return <div className={`${baseClass} bg-green-500 text-white`}><StarIcon className="w-3.5 h-3.5" /></div>;
    case MoveClassification.GOOD:
      return <div className={`${baseClass} bg-emerald-400 text-white`}><CheckIcon className="w-3.5 h-3.5 stroke-[3]" /></div>;
    case MoveClassification.BOOK:
      return <div className={`${baseClass} bg-[#cc8953] text-white`}><BookOpenIcon className="w-3.5 h-3.5" /></div>;
    case MoveClassification.MISS:
      return <div className={`${baseClass} bg-red-400 text-white`}><XMarkIcon className="w-3.5 h-3.5 stroke-[3]" /></div>;
    case MoveClassification.BLUNDER:
      return <div className={`${baseClass} bg-red-600 text-white font-black text-[9px]`}>??</div>;
    case MoveClassification.MISTAKE:
      return <div className={`${baseClass} bg-orange-400 text-white`}><ExclamationCircleIcon className="w-3.5 h-3.5" /></div>;
    default:
      return null;
  }
};

const BestMoveArrow: React.FC<{ move: string }> = ({ move }) => {
  const arrowId = useId();
  if (!move || move.length < 4 || move === '(none)') return null;

  const from = move.substring(0, 2);
  const to = move.substring(2, 4);

  if (from === to) return null;

  const getCoords = (sq: string) => {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { x: col * 12.5 + 6.25, y: row * 12.5 + 6.25 };
  };

  const start = getCoords(from);
  const end = getCoords(to);

  const markerId = `arrowhead-${arrowId.replace(/:/g, '')}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
      <defs>
        <marker
          id={markerId}
          markerWidth="4"
          markerHeight="3"
          refX="3.5"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 4 1.5, 0 3" fill="#fbbf24" opacity="0.6" />
        </marker>
      </defs>
      <line
        x1={`${start.x}%`}
        y1={`${start.y}%`}
        x2={`${end.x}%`}
        y2={`${end.y}%`}
        stroke="#fbbf24"
        strokeWidth="2%"
        strokeLinecap="round"
        opacity="0.6"
        markerEnd={`url(#${markerId})`}
        markerStart="none"
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}
      />
    </svg>
  );
};

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, onMove, isDraggable = true, lastMove, bestMove }) => {
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
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
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
            className={`relative flex items-center justify-center cursor-pointer
              ${isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'}
              ${isSelected ? 'bg-yellow-200/60' : ''}
              ${(isLastMoveOrigin || isLastMoveTarget) ? 'bg-yellow-400/30' : ''}
              ${isValidMove ? 'after:content-[""] after:w-4 after:h-4 after:bg-black/10 after:rounded-full after:z-10' : ''}
            `}
          >
            {piece && (
              <img
                src={PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`]}
                alt={`${piece.color}${piece.type}`}
                className="w-[90%] h-[90%] select-none pointer-events-none z-10"
              />
            )}
            
            {isLastMoveTarget && lastMove?.classification && (
              <QualityMarker classification={lastMove.classification} />
            )}

            {col === 0 && (
              <span className={`absolute top-0.5 left-0.5 text-[11px] font-bold pointer-events-none opacity-40 ${isDark ? 'text-[#f0d9b5]' : 'text-[#b58863]'}`}>
                {8 - row}
              </span>
            )}
            {row === 7 && (
              <span className={`absolute bottom-0.5 right-0.5 text-[11px] font-bold pointer-events-none opacity-40 ${isDark ? 'text-[#f0d9b5]' : 'text-[#b58863]'}`}>
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
    <div className="relative w-full aspect-square shadow-2xl overflow-hidden bg-[#312e2b]">
      <div className="chess-board-grid h-full relative z-0">
        {renderBoard()}
      </div>
      {bestMove && <BestMoveArrow move={bestMove} />}
    </div>
  );
};

export default ChessBoard;
