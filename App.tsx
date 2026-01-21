import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus } from './types';
import Game from './components/Game';
import { soundEngine } from './utils/sound';
import { Play, RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [lastScore, setLastScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const idleTimeoutRef = useRef<number | null>(null);

  // Kiosk Idle Reset Logic
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (status === GameStatus.GAME_OVER) {
        idleTimeoutRef.current = window.setTimeout(() => {
          setStatus(GameStatus.IDLE);
        }, 10000); // 10 seconds auto-restart
      }
    };

    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    return () => {
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [status]);

  const startGame = () => {
    soundEngine.playWhack(); // Init audio context
    setStatus(GameStatus.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    if (score > highScore) setHighScore(score);
    soundEngine.playGameOver();
    setStatus(GameStatus.GAME_OVER);
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    soundEngine.setMute(newState);
  };

  return (
    <div className="w-full h-screen bg-stone-900 text-white overflow-hidden font-sans select-none touch-none" onContextMenu={e => e.preventDefault()}>
      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {status === GameStatus.IDLE && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-stone-800 p-4 md:p-8 text-center"
          >
            <motion.h1 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="text-5xl md:text-9xl font-black text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] mb-6 md:mb-8 game-font"
              style={{ WebkitTextStroke: '1px #000' }}
            >
              WHACK 'EM ALL
            </motion.h1>
            
            <div className="bg-white/10 p-4 md:p-6 rounded-2xl backdrop-blur-md mb-8 md:mb-12 border border-white/20 max-w-md md:max-w-2xl">
              <p className="text-lg md:text-2xl mb-2 text-green-100">🐹 Hit Moles (+1) & Gold (+3)</p>
              <p className="text-lg md:text-2xl text-red-200">💣 Avoid Bombs (-1 Life)</p>
            </div>

            <button 
              onClick={startGame}
              className="group relative px-8 py-4 md:px-12 md:py-6 bg-yellow-500 rounded-3xl shadow-[0_6px_0_rgb(180,83,9)] md:shadow-[0_10px_0_rgb(180,83,9)] active:shadow-none active:translate-y-[6px] md:active:translate-y-[10px] transition-all duration-100"
            >
              <div className="flex items-center gap-3 md:gap-4 text-2xl md:text-5xl font-black text-amber-900 uppercase tracking-wider game-font">
                <Play fill="currentColor" className="w-6 h-6 md:w-10 md:h-10" />
                Tap to Start
              </div>
            </button>
          </motion.div>
        )}

        {/* GAME SCREEN */}
        {status === GameStatus.PLAYING && (
          <motion.div 
            key="game"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Game 
              onGameOver={handleGameOver} 
              isMuted={isMuted} 
              toggleMute={toggleMute}
            />
          </motion.div>
        )}

        {/* GAME OVER SCREEN */}
        {status === GameStatus.GAME_OVER && (
          <motion.div 
            key="over"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col items-center justify-center bg-stone-900/95 p-4 md:p-8 text-center z-50 absolute inset-0"
          >
            <h2 className="text-5xl md:text-8xl text-white font-black game-font mb-4">GAME OVER</h2>
            
            <div className="flex flex-col gap-4 mb-8 md:mb-12">
              <div className="bg-white/10 p-6 md:p-8 rounded-3xl border-4 border-white/10 min-w-[200px] md:min-w-[300px]">
                <div className="text-xl md:text-2xl uppercase text-stone-400 mb-2 font-bold">Your Score</div>
                <div className="text-6xl md:text-9xl text-yellow-400 font-black game-font drop-shadow-lg">{lastScore}</div>
              </div>
              
              {lastScore >= highScore && lastScore > 0 && (
                 <div className="flex items-center justify-center gap-2 text-yellow-300 animate-pulse">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                    <span className="text-xl md:text-2xl font-bold">New High Score!</span>
                 </div>
              )}
            </div>

            <div className="flex gap-6">
              <button 
                onClick={startGame}
                className="px-8 py-4 md:px-10 md:py-5 bg-green-500 rounded-2xl shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[6px] md:active:translate-y-[8px] transition-all duration-100"
              >
                <div className="flex items-center gap-2 md:gap-3 text-xl md:text-4xl font-black text-white uppercase game-font">
                  <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
                  Play Again
                </div>
              </button>
            </div>

            <div className="absolute bottom-4 md:bottom-8 text-white/30 text-sm md:text-lg animate-pulse">
              Returning to start in 10s...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Mute Button for non-game screens */}
      {status !== GameStatus.PLAYING && (
        <button 
          onClick={toggleMute} 
          className="absolute top-4 right-4 md:top-8 md:right-8 p-3 md:p-4 bg-black/30 rounded-full text-white/70 hover:text-white hover:bg-black/50 transition z-50"
        >
          {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8" /> : <Volume2 className="w-6 h-6 md:w-8 md:h-8" />}
        </button>
      )}
    </div>
  );
};

export default App;