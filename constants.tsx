
import React from 'react';
import { Puzzle } from './types';

export const PIECE_IMAGES: Record<string, string> = {
  'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'wB': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const SAMPLE_PUZZLES: Puzzle[] = [
  {
    id: '1',
    title: 'The Opera Game',
    description: 'Paul Morphy vs. Duke of Brunswick (1858). The most famous checkmate in history.',
    rating: 1500,
    theme: 'Queen Sacrifice',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 22',
    solution: ['b3b8', 'd7b8', 'd1d8'] 
  },
  {
    id: '2',
    title: 'Philidor\'s Legacy',
    description: 'The classic Smothered Mate. The Queen sacrifices herself to trap the King.',
    rating: 1450,
    theme: 'Smothered Mate',
    fen: 'r1bq1r1k/pp4pp/2p4N/2b1p3/2Q1P3/2P5/PP3PPP/3R1RK1 w - - 0 1',
    solution: ['c4g8', 'f8g8', 'h6f7'] 
  },
  {
    id: '3',
    title: 'Boden\'s Mate',
    description: 'Schulder vs. Boden (1853). The two bishops criss-cross to deliver mate.',
    rating: 1300,
    theme: 'Mating Pattern',
    fen: '2kr1b1r/pp1n1ppp/2p1b3/4P3/2B2B2/2n2Q2/PPP2PPP/2KR3R w - - 1 13',
    solution: ['f3c6', 'b7c6', 'c4a6']
  },
  {
    id: '4',
    title: 'Legal\'s Mate',
    description: 'De Legal vs. Saint Brie (1750). A classic opening trap involving a Queen sacrifice.',
    rating: 1200,
    theme: 'Opening Trap',
    fen: 'r2qkb1r/pp1n1ppp/2p5/4p3/2B1P1b1/2N2N2/PPP2PPP/R1BQK2R w KQkq - 1 8',
    solution: ['f3e5', 'g4d1', 'c4f7', 'e8e7', 'c3d5']
  },
  {
    id: '5',
    title: 'Anastasia\'s Mate',
    description: 'The Knight and Rook coordinate to deliver a beautiful mate.',
    rating: 1300,
    theme: 'Mating Pattern',
    fen: '5r1k/1p2Nppp/8/7Q/8/8/5PPP/3R2K1 w - - 0 1',
    solution: ['h5h7', 'h8h7', 'd1d3', 'g7g6', 'd3h3'] 
  },
  {
    id: '6',
    title: 'The Hook Mate',
    description: 'The rook is protected by a knight, creating a hook that the king cannot escape.',
    rating: 1350,
    theme: 'Pattern Recognition',
    fen: '8/8/4R3/8/5k2/5P2/5K2/8 w - - 0 1',
    solution: ['e6e4', 'f4f5', 'g2g4']
  },
  {
    id: '7',
    title: 'Arabian Mate',
    description: 'One of the oldest known checkmates (9th Century), using Knight and Rook.',
    rating: 1100,
    theme: 'Endgame Tactic',
    fen: '7k/1R6/5N2/8/8/8/8/7K w - - 0 1',
    solution: ['b7h7']
  },
  {
    id: '8',
    title: 'The Windmill',
    description: 'Torre vs. Lasker (1925). A series of discovered checks that devastates Black.',
    rating: 1600,
    theme: 'Mating Pattern',
    fen: '2r2rk1/pp3ppp/2n5/4N3/2B5/2n5/PPP2PPP/2KR3R w - - 0 1',
    solution: ['e5f7', 'f8f7', 'd1d8']
  },
  {
    id: '9',
    title: 'Greco\'s Mate',
    description: 'A bishop sacrifices itself to open the h-file for the rook.',
    rating: 1400,
    theme: 'File Opening',
    fen: 'r1b3k1/pp3ppp/2p5/8/2B1r3/8/PPP2PPP/3R1K1R w - - 0 1',
    solution: ['d1d8', 'e4e8', 'd8e8']
  },
  {
    id: '10',
    title: 'Damiano\'s Mate',
    description: 'A classic method of attacking the castled King.',
    rating: 1350,
    theme: 'King Hunt',
    fen: '6k1/5p1p/8/6r1/8/5p2/7P/7K b - - 0 1',
    solution: ['g5g1', 'h1g1', 'f3f2']
  },
  {
    id: '11',
    title: 'Lolli\'s Mate',
    description: 'A pawn on f6 (or f3) creates a deadly mating net.',
    rating: 1400,
    theme: 'Mating Pattern',
    fen: '6k1/5p2/5P2/8/6Q1/8/8/7K w - - 0 1',
    solution: ['g4g7']
  },
  {
    id: '12',
    title: 'Back Rank Mate',
    description: 'A fundamental pattern every beginner must master.',
    rating: 800,
    theme: 'Basic Checkmate',
    fen: '3r2k1/p4ppp/2p5/8/4q3/8/PPP2PPP/3Q2K1 w - - 0 1',
    solution: ['d1d8', 'e4e8', 'd8e8']
  },
  {
    id: '13',
    title: 'The Immortal Game',
    description: 'Anderssen vs. Kieseritzky (1851). A sacrifice-filled finish for the ages.',
    rating: 1600,
    theme: 'Historical Masterpiece',
    fen: 'r1bk2nr/p2p1pNp/n2B4/1p1NP2P/6P1/3P1Q2/P1P1K3/q5b1 w - - 0 18',
    solution: ['f3f6', 'g8f6', 'd6e7']
  },
  {
    id: '14',
    title: 'Rook Lift Mate',
    description: 'Lifting the rook to the 3rd or 4th rank to join the attack.',
    rating: 1150,
    theme: 'Attacking Pattern',
    fen: '5rk1/5p1p/6p1/8/8/2B5/8/R6K w - - 0 1',
    solution: ['a1g1']
  },
  {
    id: '15',
    title: 'Scholar\'s Mate',
    description: 'The infamous four-move checkmate that catches many beginners.',
    rating: 400,
    theme: 'Opening Trap',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: ['f3f7']
  },
  {
    id: '16',
    title: 'Fool\'s Mate',
    description: 'The quickest possible checkmate in chess.',
    rating: 300,
    theme: 'Opening Catastrophe',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
    solution: ['d8h4']
  },
  {
    id: '17',
    title: 'Blind Swine Mate',
    description: 'Two rooks on the 7th rank devour everything in their path.',
    rating: 1250,
    theme: 'Endgame Pattern',
    fen: '1r5k/2RR4/8/8/8/8/8/7K w - - 0 1',
    solution: ['d7h7', 'h8g8', 'c7g7']
  },
  {
    id: '18',
    title: 'Epaulette Mate',
    description: 'The King is boxed in by his own pieces on both sides.',
    rating: 1300,
    theme: 'Mating Pattern',
    fen: '3rkr2/8/8/4Q3/8/8/8/6K1 w - - 0 1',
    solution: ['e5e6']
  },
  {
    id: '19',
    title: 'Ladder Mate',
    description: 'Two major pieces work together to push the King to the edge.',
    rating: 500,
    theme: 'Basic Checkmate',
    fen: 'k7/7R/1R6/8/8/8/8/7K w - - 0 1',
    solution: ['h7a7']
  },
  {
    id: '20',
    title: 'Anderssen\'s Mate',
    description: 'A rook and a supporting pawn (or piece) deliver mate in the corner.',
    rating: 1100,
    theme: 'Mating Pattern',
    fen: '6k1/6P1/5K2/8/8/8/8/7R w - - 0 1',
    solution: ['h1h8']
  },
  {
    id: '21',
    title: 'Caro-Kann Smother',
    description: 'A famous 6-move checkmate in the Caro-Kann Defense.',
    rating: 1200,
    theme: 'Opening Trap',
    fen: 'r1bqkb1r/pp1npppp/2p2n2/8/3PN3/8/PPP1QPPP/R1B1KBNR w KQkq - 1 6',
    solution: ['e4d6']
  }
];
