
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Square {
  row: number;
  col: number;
}

export type MoveType = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  classification?: MoveClassification;
}

export enum MoveClassification {
  BRILLIANT = 'BRILLIANT',
  GREAT = 'GREAT',
  BEST = 'BEST',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  BOOK = 'BOOK',
  INACCURACY = 'INACCURACY',
  MISTAKE = 'MISTAKE',
  MISS = 'MISS',
  BLUNDER = 'BLUNDER'
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  PLAY_COACH = 'PLAY_COACH',
  ANALYSIS = 'ANALYSIS',
  PUZZLES = 'PUZZLES',
  LESSONS = 'LESSONS',
  GAME_REVIEW = 'GAME_REVIEW'
}

export interface CoachMessage {
  id: string;
  role: 'coach' | 'system' | 'user';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  evaluation: number;
  bestMove: string;
  explanation: string;
  keyConcepts: string[];
}

export interface GameStats {
  accuracy: number;
  moves: {
    [key in MoveClassification]: number;
  };
  ratingEstimate: number;
}

export interface GameReviewData {
  white: GameStats;
  black: GameStats;
  evalHistory: number[];
  moveHistory: string[]; // SAN
  moveClassifications: MoveClassification[];
  bestMoves: string[]; // LAN (e.g. "e2e4")
  depth: number;
}
