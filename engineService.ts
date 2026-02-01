
export interface EngineAnalysis {
  score: number; // centipawns (absolute: + is white advantage)
  bestMove: string;
  depth: number;
  pv: string;
}

class StockfishEngine {
  private worker: Worker | null = null;
  private onMessage: (msg: string) => void = () => {};

  async init(): Promise<void> {
    if (this.worker) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.worker) resolve(); // Proceed even if no readyok (worker may still work)
      }, 8000);
      try {
        // Stockfish.js@16.0.0 doesn't exist - use 'stockfish' package (v16) instead.
        // Single-threaded build works in most browsers; worker needs direct URL so .wasm loads from same CDN path.
        const stockfishWorkerUrl = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.js';
        this.worker = new Worker(stockfishWorkerUrl);

        this.worker.onmessage = (e) => {
          const msg = typeof e.data === 'string' ? e.data : (e.data?.data ?? String(e.data ?? ''));
          if (msg === 'readyok') {
            clearTimeout(timeout);
            resolve();
          }
          this.onMessage(msg);
        };

        this.worker.onerror = (err) => {
          clearTimeout(timeout);
          console.error("Stockfish worker error:", err);
          reject(err);
        };

        this.sendCommand('uci');
        this.sendCommand('setoption name Hash value 32');
        this.sendCommand('ucinewgame');
        this.sendCommand('isready');
      } catch (error) {
        clearTimeout(timeout);
        console.error("Failed to initialize Stockfish:", error);
        reject(error);
      }
    });
  }

  sendCommand(command: string) {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  analyze(fen: string, depth: number = 18, callback: (analysis: EngineAnalysis) => void) {
    if (!this.worker) return;

    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);

    const turn = fen.split(' ')[1];
    let currentAnalysis: Partial<EngineAnalysis> = { depth };

    this.onMessage = (msg: string) => {
      if (msg.startsWith('info depth')) {
        const scoreMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        const pvMatch = msg.match(/ pv (.+)/);

        if (scoreMatch) {
          let cp = parseInt(scoreMatch[1], 10);
          // Standardize score to white's perspective
          currentAnalysis.score = turn === 'w' ? cp : -cp;
        } else if (mateMatch) {
          const mateIn = parseInt(mateMatch[1], 10);
          const score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
          currentAnalysis.score = turn === 'w' ? score : -score;
        }

        if (pvMatch) {
          const pv = pvMatch[1].split(' ');
          currentAnalysis.bestMove = pv[0];
          currentAnalysis.pv = pv.slice(0, 5).join(' ');
        }
        
        const depthMatch = msg.match(/depth (\d+)/);
        if (depthMatch) {
          currentAnalysis.depth = parseInt(depthMatch[1], 10);
        }

        if (currentAnalysis.score !== undefined && currentAnalysis.bestMove) {
          callback(currentAnalysis as EngineAnalysis);
        }
      }
    };
  }

  stop() {
    this.sendCommand('stop');
  }
}

export const engine = new StockfishEngine();
