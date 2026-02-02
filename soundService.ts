
import { Chess, Move } from 'chess.js';

// Using standard open-source chess sounds
const SOUNDS = {
  move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/move-self.mp3'),
  capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/capture.mp3'),
  check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/move-check.mp3'),
  castle: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/castle.mp3'),
  promote: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/promote.mp3'),
  notify: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/notify.mp3'), // Puzzle Success
  illegal: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/illegal.mp3'), // Wrong Move
  gameEnd: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/default/game-end.mp3'),
};

// Pre-load sounds
Object.values(SOUNDS).forEach(audio => {
  audio.load();
  audio.volume = 0.5;
});

export const playMoveSound = (game: Chess, move: Move) => {
  const isCheck = game.isCheck();
  const isCapture = move.captured !== undefined;
  const isCastle = move.san.includes('O-O');
  const isPromote = move.promotion !== undefined;

  // Reset current time to allow rapid re-play
  const play = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("Audio play failed", e));
  };

  if (isCheck) {
    play(SOUNDS.check);
  } else if (isPromote) {
    play(SOUNDS.promote);
  } else if (isCastle) {
    play(SOUNDS.castle);
  } else if (isCapture) {
    play(SOUNDS.capture);
  } else {
    play(SOUNDS.move);
  }
};

export const playFeedbackSound = (type: 'success' | 'failure' | 'game-end') => {
  const play = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("Audio play failed", e));
  };

  if (type === 'success') {
    play(SOUNDS.notify);
  } else if (type === 'failure') {
    play(SOUNDS.illegal);
  } else if (type === 'game-end') {
    play(SOUNDS.gameEnd);
  }
};
