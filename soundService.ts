
import { Chess, Move } from 'chess.js';

// Reliable audio sources (Lichess GitHub Raw)
// We use these because they are open source, reliable, and CORS-friendly.
const AUDIO_MAP = {
  move: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3'),
  capture: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Capture.mp3'),
  check: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/GenericNotify.mp3'),
  castle: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3'), // Lichess uses move sound for castle
  promote: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Confirmation.mp3'),
  notify: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Victory.mp3'),
  illegal: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Error.mp3'), // Use Error for failure
  gameEnd: new Audio('https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Victory.mp3'),
};

// Pre-load and configure
Object.values(AUDIO_MAP).forEach(audio => {
  audio.load();
  audio.volume = 0.7; // Good volume level
});

export const playMoveSound = (game: Chess, move: Move) => {
  const isCheck = game.isCheck();
  const isCapture = move.captured !== undefined;
  const isCastle = move.san.includes('O-O');
  const isPromote = move.promotion !== undefined;

  const play = (audio: HTMLAudioElement) => {
    // Clone to allow overlapping sounds (rapid moves)
    const sound = audio.cloneNode() as HTMLAudioElement;
    sound.volume = 0.7;
    sound.play().catch(e => console.warn("Sound play blocked or failed:", e));
  };

  if (isCheck) {
    play(AUDIO_MAP.check);
  } else if (isPromote) {
    play(AUDIO_MAP.promote);
  } else if (isCapture) {
    play(AUDIO_MAP.capture);
  } else if (isCastle) {
    play(AUDIO_MAP.castle); // Castling is technically a move, but we can check if we want a special sound
  } else {
    play(AUDIO_MAP.move);
  }
};

export const playFeedbackSound = (type: 'success' | 'failure' | 'game-end') => {
  const play = (audio: HTMLAudioElement) => {
    const sound = audio.cloneNode() as HTMLAudioElement;
    sound.volume = 0.7;
    sound.play().catch(e => console.warn("Sound play blocked or failed:", e));
  };

  if (type === 'success') {
    play(AUDIO_MAP.notify);
  } else if (type === 'failure') {
    play(AUDIO_MAP.illegal);
  } else if (type === 'game-end') {
    play(AUDIO_MAP.gameEnd);
  }
};
