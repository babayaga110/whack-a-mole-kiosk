import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEntity, ENTITY_CONFIG } from '../types';

interface HoleProps {
  entity: GameEntity | null;
  index: number;
  onWhack: (index: number) => void;
}

const Hole: React.FC<HoleProps> = ({ entity, index, onWhack }) => {
  // Prevent default to avoid double-firing on touch devices
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (entity && !entity.isHit) {
      onWhack(index);
    }
  };

  return (
    <div 
      className="relative w-full aspect-square flex items-center justify-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* The Dirt Hole Background */}
      <div className="absolute inset-1 md:inset-2 bg-stone-800 rounded-full shadow-inner border-b-4 border-stone-700 opacity-80" />

      {/* The Entity (Mole/Bomb) */}
      <AnimatePresence mode="popLayout">
        {entity && !entity.isHit && (
          <motion.div
            key={entity.id}
            initial={{ y: "100%", opacity: 0, scale: 0.8 }}
            animate={{ y: "10%", opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center cursor-pointer touch-manipulation z-10"
            onMouseDown={handleInteraction}
            onTouchStart={handleInteraction}
          >
             <div className="relative w-3/4 h-3/4 flex items-center justify-center select-none pointer-events-none">
                {/* Character Visuals */}
                {/* Using vmin allows scaling based on the smallest viewport dimension, perfect for both portrait/landscape */}
                {entity.type === 'mole' && (
                  <div className="text-[18vmin] md:text-[min(12vh,12vw)] drop-shadow-xl filter">🐹</div>
                )}
                {entity.type === 'golden' && (
                  <div className="text-[18vmin] md:text-[min(12vh,12vw)] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-pulse">🤖</div>
                )}
                {entity.type === 'bomb' && (
                  <div className="text-[18vmin] md:text-[min(12vh,12vw)] drop-shadow-xl animate-bounce">💣</div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hit Effect (Floating Text) */}
      <AnimatePresence>
        {entity && entity.isHit && (
          <motion.div
            key={`${entity.id}-hit`}
            initial={{ scale: 0.5, opacity: 1, y: 0 }}
            animate={{ scale: 1.5, opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute z-20 font-black text-4xl md:text-6xl ${ENTITY_CONFIG[entity.type].color} pointer-events-none`}
            style={{ textShadow: '2px 2px 0 #000' }}
          >
            {ENTITY_CONFIG[entity.type].label}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mask to hide mole when "underground" */}
      <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-stone-900 to-transparent pointer-events-none z-10 rounded-b-full opacity-50" />
    </div>
  );
};

export default memo(Hole);