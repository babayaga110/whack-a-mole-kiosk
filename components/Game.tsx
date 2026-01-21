import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Volume2, VolumeX, Pause } from 'lucide-react';
import Hole from './Hole';
import { GameEntity, GameStatus, GridState, EntityType } from '../types';
import { soundEngine } from '../utils/sound';

interface GameProps {
  onGameOver: (score: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// Game Constants
const GRID_SIZE = 12; // 3 rows x 4 cols (or 4 rows x 3 cols)
const GAME_DURATION = 30; // seconds
const SPAWN_INTERVAL_START = 800;
const SPAWN_INTERVAL_END = 400;
const MOLE_DURATION_START = 1500;
const MOLE_DURATION_END = 700;

const Game: React.FC<GameProps> = ({ onGameOver, isMuted, toggleMute }) => {
  // State
  const [grid, setGrid] = useState<GridState>(Array(GRID_SIZE).fill(null));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs for loop management
  const lastSpawnTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const startTime = useRef<number>(Date.now());
  const pausedTime = useRef<number>(0);

  // Difficulty scaling factor (0 to 1, where 1 is hardest)
  const getDifficulty = () => {
    const elapsed = GAME_DURATION - timeLeft;
    return Math.min(Math.max(elapsed / GAME_DURATION, 0), 1);
  };

  const spawnEntity = useCallback(() => {
    const difficulty = getDifficulty();
    
    // Determine number of concurrent moles allowed based on difficulty
    const maxConcurrent = 1 + Math.floor(difficulty * 2); 
    const currentCount = grid.filter(e => e !== null && !e.isHit).length;

    if (currentCount >= maxConcurrent) return;

    // Find empty holes
    const emptyIndices = grid.map((e, i) => e === null ? i : -1).filter(i => i !== -1);
    if (emptyIndices.length === 0) return;

    // Pick random hole
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    // Determine type
    const roll = Math.random();
    let type: EntityType = 'mole';
    if (roll > 0.85) type = 'bomb';
    else if (roll > 0.7) type = 'golden';

    // Determine duration
    const duration = MOLE_DURATION_START - (difficulty * (MOLE_DURATION_START - MOLE_DURATION_END));

    const newEntity: GameEntity = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      spawnTime: Date.now(),
      duration,
      isHit: false
    };

    setGrid(prev => {
      const next = [...prev];
      next[randomIndex] = newEntity;
      return next;
    });
  }, [grid, timeLeft]);

  const handleWhack = useCallback((index: number) => {
    const entity = grid[index];
    if (!entity || entity.isHit) return;

    // Mark as hit immediately for UI
    setGrid(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index]!, isHit: true };
      }
      return next;
    });

    // Score Logic
    if (entity.type === 'bomb') {
      soundEngine.playBomb();
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
           // Defer game over slightly to show explosion
           setTimeout(() => onGameOver(score), 500);
        }
        return newLives;
      });
      // Screen shake effect logic could go here
    } else {
      if (entity.type === 'golden') {
        soundEngine.playGolden();
        setScore(s => s + 3);
      } else {
        soundEngine.playWhack();
        setScore(s => s + 1);
      }
    }
  }, [grid, onGameOver, score]);

  // Main Game Loop
  useEffect(() => {
    const loop = () => {
      if (isPaused) {
        animationFrameId.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      
      // Update Timer
      const elapsed = (now - startTime.current) / 1000;
      const newTimeLeft = Math.max(GAME_DURATION - elapsed, 0);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        onGameOver(score);
        return;
      }

      // Despawn expired entities
      setGrid(prev => prev.map(entity => {
        if (!entity) return null;
        if (entity.isHit && now - entity.spawnTime > entity.duration + 500) return null; // Remove hit after anim
        if (!entity.isHit && now - entity.spawnTime > entity.duration) return null; // Missed
        return entity;
      }));

      // Spawn new entities
      const difficulty = (GAME_DURATION - newTimeLeft) / GAME_DURATION;
      const currentSpawnInterval = SPAWN_INTERVAL_START - (difficulty * (SPAWN_INTERVAL_START - SPAWN_INTERVAL_END));

      if (now - lastSpawnTime.current > currentSpawnInterval) {
        spawnEntity();
        lastSpawnTime.current = now;
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isPaused, score, spawnEntity, onGameOver, timeLeft]); // Warning: Dependencies usually need careful management in loop

  // Pause handling logic update
  useEffect(() => {
     // Adjust start time when unpausing to not lose time
     if (!isPaused && pausedTime.current > 0) {
         const pauseDuration = Date.now() - pausedTime.current;
         startTime.current += pauseDuration;
         pausedTime.current = 0;
     } else if (isPaused) {
         pausedTime.current = Date.now();
     }
  }, [isPaused]);


  return (
    <div className="relative w-full h-full flex flex-col bg-green-800 overflow-hidden touch-none select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      {/* HUD */}
      <div className="relative z-50 shrink-0 flex justify-between items-center px-4 py-2 md:p-6 bg-black/20 backdrop-blur-sm text-white border-b-4 border-black/10">
        <div className="flex-1">
          <div className="text-sm md:text-2xl uppercase opacity-75 font-bold">Score</div>
          <div className="text-3xl md:text-6xl game-font text-yellow-400 drop-shadow-md leading-none">{score}</div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="text-sm md:text-2xl uppercase opacity-75 font-bold">Time</div>
          <div className={`text-4xl md:text-7xl game-font drop-shadow-md leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.ceil(timeLeft)}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-end gap-1 md:gap-2">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-6 h-6 md:w-12 md:h-12 ${i < lives ? 'fill-red-500 text-red-600' : 'fill-gray-700 text-gray-800'}`} 
              />
            ))}
          </div>
          <div className="flex gap-2 mt-1">
             <button onClick={toggleMute} className="p-1 md:p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
               {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
             </button>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      {/* landscape:grid-cols-4 ensures 4 columns on mobile landscape to fit 3 rows vertically */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-4 grid grid-cols-3 landscape:grid-cols-4 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8 justify-items-center items-center content-center">
        {grid.map((entity, i) => (
          <Hole 
            key={i} 
            index={i} 
            entity={entity} 
            onWhack={handleWhack} 
          />
        ))}
      </div>
    </div>
  );
};

export default Game;