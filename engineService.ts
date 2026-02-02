
export interface EngineAnalysis {
  score: number; // centipawns (absolute: + is white advantage)
  bestMove: string;
  depth: number;
  pv: string;
}

class StockfishEngine {
  private worker: Worker | null = null;
  private onMessage: (msg: string) => void = () => {};
  private isInitializing: boolean = false;
  private isReady: boolean = false;

  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.isInitializing) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.isInitializing = true;

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.isReady) {
          this.isInitializing = false;
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
          reject(new Error("Stockfish initialization timed out."));
        }
      }, 25000);

      try {
        // Candidate URLs for Stockfish
        // We try modern WASM versions first, then fall back to older ASM.js versions if needed
        const candidates = [
          {
            name: 'jsDelivr (16.1)',
            url: 'https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js',
            baseUrl: 'https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/'
          },
          {
            name: 'Unpkg (16.1)',
            url: 'https://unpkg.com/stockfish@16.1.0/src/stockfish.js',
            baseUrl: 'https://unpkg.com/stockfish@16.1.0/src/'
          },
          {
            name: 'cdnjs (10.0.2 - Fallback)',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js',
            baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/'
          }
        ];

        let scriptContent = '';
        let activeBaseUrl = '';

        for (const c of candidates) {
          try {
            console.log(`Attempting to load Stockfish from ${c.name}...`);
            const res = await fetch(c.url);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            scriptContent = await res.text();
            activeBaseUrl = c.baseUrl;
            console.log(`Successfully loaded Stockfish from ${c.name}`);
            break;
          } catch (e) {
            console.warn(`Failed to load from ${c.name}:`, e);
          }
        }

        if (!scriptContent) {
          throw new Error("Failed to download Stockfish engine from all available CDNs.");
        }

        // Construct the worker source with inlined engine code
        // We set Module.locateFile to help it find the .wasm/.nnue files relative to the CDN, not the blob
        const workerSource = `
          var baseUrl = "${activeBaseUrl}";
          self.Module = {
            locateFile: function(path) {
              if (path.indexOf('http') === 0) return path;
              return baseUrl + path;
            },
            onRuntimeInitialized: function() {
              self.postMessage('readyok_signal');
            },
            print: function(text) { console.log('SF:', text); },
            printErr: function(text) { console.error('SF Err:', text); }
          };

          // Compatibility for older stockfish.js versions (like 10.x) that might use different globals or immediate execution
          // We define a small timeout to signal ready if the WASM hook doesn't fire (common in ASM.js versions)
          setTimeout(function() {
             self.postMessage('readyok_signal');
          }, 1000);

          ${scriptContent}
        `;

        const blob = new Blob([workerSource], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
          const msg = typeof e.data === 'string' ? e.data : (e.data?.data ?? String(e.data ?? ''));
          
          if (msg === 'readyok_signal' || msg === 'uciok' || msg === 'readyok') {
            if (!this.isReady) {
              this.isReady = true;
              this.isInitializing = false;
              clearTimeout(timeout);
              console.log("Stockfish Engine Ready");
              resolve();
              
              // Ensure we initialize the engine protocol
              this.sendCommand('uci');
            }
          }
          
          this.onMessage(msg);
        };

        this.worker.onerror = (err) => {
          console.error("Worker Error:", err);
          // Only fail init if we haven't succeeded yet
          if (!this.isReady) {
            this.isInitializing = false;
            reject(err);
          }
        };

        // Send initial command just in case the script is already ready
        this.sendCommand('uci');

      } catch (error) {
        console.error("Engine Init Error:", error);
        this.isInitializing = false;
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  sendCommand(command: string) {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  async getAnalysis(fen: string, depth: number = 12): Promise<EngineAnalysis> {
    if (!this.isReady) await this.init();
    
    return new Promise((resolve) => {
      const turn = fen.split(' ')[1];
      let lastResult: EngineAnalysis = { score: 0, bestMove: '', depth: 0, pv: '' };
      
      const messageHandler = (msg: string) => {
        if (msg.startsWith('info depth')) {
          const scoreMatch = msg.match(/score cp (-?\d+)/);
          const mateMatch = msg.match(/score mate (-?\d+)/);
          const pvMatch = msg.match(/ pv (.+)/);
          const depthMatch = msg.match(/depth (\d+)/);

          if (depthMatch) lastResult.depth = parseInt(depthMatch[1], 10);
          
          if (scoreMatch) {
            let cp = parseInt(scoreMatch[1], 10);
            lastResult.score = turn === 'w' ? cp : -cp;
          } else if (mateMatch) {
            const m = parseInt(mateMatch[1], 10);
            const score = m > 0 ? 10000 - m : -10000 - m;
            lastResult.score = turn === 'w' ? score : -score;
          }

          if (pvMatch) {
            const pvParts = pvMatch[1].split(' ');
            lastResult.bestMove = pvParts[0];
            lastResult.pv = pvParts.slice(0, 5).join(' ');
          }
        } else if (msg.startsWith('bestmove')) {
          // Robustly grab the best move from the final line if info didn't catch it
          const parts = msg.split(' ');
          if (parts.length > 1 && parts[1] !== '(none)') {
             lastResult.bestMove = parts[1];
          }
          this.onMessage = () => {}; 
          resolve(lastResult);
        }
      };

      this.onMessage = messageHandler;
      this.sendCommand('stop');
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  analyze(fen: string, depth: number = 18, callback: (analysis: EngineAnalysis) => void) {
    if (!this.isReady) {
      this.init().then(() => this.analyze(fen, depth, callback));
      return;
    }
    
    const turn = fen.split(' ')[1];
    let currentAnalysis: EngineAnalysis = { score: 0, bestMove: '', depth: 0, pv: '' };
    
    this.onMessage = (msg: string) => {
      if (msg.startsWith('info depth')) {
        const scoreMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        const pvMatch = msg.match(/ pv (.+)/);
        const depthMatch = msg.match(/depth (\d+)/);
        
        if (depthMatch) currentAnalysis.depth = parseInt(depthMatch[1], 10);
        if (scoreMatch) {
          let cp = parseInt(scoreMatch[1], 10);
          currentAnalysis.score = turn === 'w' ? cp : -cp;
        } else if (mateMatch) {
          const m = parseInt(mateMatch[1], 10);
          const score = m > 0 ? 10000 - m : -10000 - m;
          currentAnalysis.score = turn === 'w' ? score : -score;
        }
        if (pvMatch) {
          const pvParts = pvMatch[1].split(' ');
          currentAnalysis.bestMove = pvParts[0];
          currentAnalysis.pv = pvParts.slice(0, 5).join(' ');
        }
        if (currentAnalysis.depth > 1 && currentAnalysis.bestMove) {
          callback({ ...currentAnalysis });
        }
      }
    };

    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }
}

export const engine = new StockfishEngine();
