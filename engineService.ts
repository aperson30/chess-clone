
export interface EngineAnalysis {
  score: number; // centipawns (absolute: + is white advantage)
  bestMove: string;
  depth: number;
  pv: string;
}

class StockfishEngine {
  private worker: Worker | null = null;
  private onMessage: (msg: string) => void = () => {};

  async init() {
    if (this.worker) return;

    try {
      // Using Stockfish 16.1 for much better accuracy and standard starting evaluations
      const stockfishUrl = 'https://cdn.jsdelivr.net/npm/stockfish.js@16.0.0/stockfish.js';
      const response = await fetch(stockfishUrl);
      const script = await response.text();
      const blob = new Blob([script], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        if (typeof e.data === 'string') {
          this.onMessage(e.data);
        }
      };

      this.sendCommand('uci');
      this.sendCommand('setoption name Hash value 32');
      this.sendCommand('ucinewgame');
      this.sendCommand('isready');
    } catch (error) {
      console.error("Failed to initialize Stockfish:", error);
    }
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
