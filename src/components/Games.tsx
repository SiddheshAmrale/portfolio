import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';

const Games: React.FC = () => {
  return (
    <section id="games" className="py-20 bg-netflix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎮 Mini Games
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            Take a break and enjoy these interactive games! Test your reflexes, memory, and jumping skills.
          </p>
        </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Catch the Objects Mini Game */}
           <CatchTheObjectsGame />
           
           {/* Memory Card Game */}
           <MemoryCardGame />
         </div>

         {/* T-Rex Game - New Row */}
         <div className="mt-8">
           <TRexGame />
         </div>
      </div>
    </section>
  );
};

// Catch the Falling Objects Mini Game
const CatchTheObjectsGame: React.FC = () => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'finished'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);
  const [basketPosition, setBasketPosition] = useState(50); // Percentage from left
  const [fallingObjects, setFallingObjects] = useState<Array<{id: number, x: number, y: number, type: 'good' | 'bad', emoji: string}>>([]);
  const [gameSpeed, setGameSpeed] = useState(1);

  const goodObjects = useMemo(() => ['🍎', '🍌', '🍇', '🍓', '🥝', '🍊', '🍋', '🍑'], []);
  const badObjects = useMemo(() => ['💣', '🔥', '⚡', '💀', '☠️', '💢', '❌', '🚫'], []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setLives(3);
    setBasketPosition(50);
    setFallingObjects([]);
    setGameSpeed(1);
    setGameState('playing');
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    setTimeLeft(30);
    setLives(3);
    setBasketPosition(50);
    setFallingObjects([]);
    setGameSpeed(1);
  };

  const moveBasket = useCallback((direction: 'left' | 'right') => {
    if (gameState !== 'playing') return;
    
    setBasketPosition(prev => {
      const newPosition = direction === 'left' ? prev - 10 : prev + 10;
      return Math.max(0, Math.min(90, newPosition));
    });
  }, [gameState]);

  const catchObject = useCallback((objectId: number) => {
    setFallingObjects(prev => {
      const object = prev.find(obj => obj.id === objectId);
      if (!object) return prev;

      if (object.type === 'good') {
        setScore(scorePrev => scorePrev + 10);
      } else {
        setLives(livesPrev => {
          const newLives = livesPrev - 1;
          if (newLives <= 0) {
            setGameState('finished');
          }
          return newLives;
        });
      }

      return prev.filter(obj => obj.id !== objectId);
    });
  }, []);

  // Game loop effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameInterval = setInterval(() => {
      // Spawn new objects
      if (Math.random() < 0.3) {
        const isGood = Math.random() < 0.7; // 70% chance for good objects
        const newObject = {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10, // 10% to 90% of screen width
          y: 0,
          type: isGood ? 'good' : 'bad' as 'good' | 'bad',
          emoji: isGood 
            ? goodObjects[Math.floor(Math.random() * goodObjects.length)]
            : badObjects[Math.floor(Math.random() * badObjects.length)]
        };
        
        setFallingObjects(prev => [...prev, newObject]);
      }

      // Move existing objects down
      setFallingObjects(prev => 
        prev.map(obj => ({
          ...obj,
          y: obj.y + gameSpeed
        })).filter(obj => {
          // Check if object reached basket level
          if (obj.y >= 150) {
            // Check if caught by basket
            const basketLeft = basketPosition;
            const basketRight = basketPosition + 20;
            const objectLeft = obj.x;
            const objectRight = obj.x + 10;
            
            if (objectLeft >= basketLeft && objectRight <= basketRight) {
              catchObject(obj.id);
            }
            return false; // Remove object
          }
          return true;
        })
      );

      // Increase game speed over time
      setGameSpeed(prev => Math.min(prev + 0.01, 3));
    }, 50);

    return () => clearInterval(gameInterval);
  }, [gameState, basketPosition, lives, gameSpeed, goodObjects, badObjects, catchObject]);

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveBasket('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveBasket('right');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [gameState, moveBasket]);

  return (
    <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🎯 Catch the Objects</h3>
        <p className="text-netflix-light-gray text-sm">Catch good objects, avoid bad ones!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-netflix-red">{timeLeft}</div>
          <div className="text-xs text-netflix-light-gray">Time</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{score}</div>
          <div className="text-xs text-netflix-light-gray">Score</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{lives}</div>
          <div className="text-xs text-netflix-light-gray">Lives</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center space-x-3 mb-4">
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaPlay />
            <span>Start</span>
          </button>
        )}
        
        {(gameState === 'playing' || gameState === 'paused') && (
          <>
            <button
              onClick={togglePause}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              {gameState === 'playing' ? <FaPause /> : <FaPlay />}
              <span>{gameState === 'playing' ? 'Pause' : 'Resume'}</span>
            </button>
            
            <button
              onClick={resetGame}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              <FaRedo />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>

      {/* Game Area */}
      {gameState === 'playing' && (
        <div className="relative bg-gradient-to-b from-blue-900 to-blue-700 border border-blue-400 rounded-lg overflow-hidden mb-4" style={{ height: 200 }}>
          {/* Falling Objects */}
          {fallingObjects.map(obj => (
            <div
              key={obj.id}
              className="absolute text-2xl select-none"
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}px`,
                transform: 'translateY(-50%)'
              }}
            >
              {obj.emoji}
            </div>
          ))}

          {/* Basket */}
          <div
            className="absolute bottom-2 text-3xl"
            style={{
              left: `${basketPosition}%`,
              transform: 'translateX(-50%)'
            }}
          >
            🧺
          </div>

          {/* Instructions Overlay */}
          <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            Use ← → or A D keys to move
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'finished' && (
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h4 className="text-lg font-bold text-white mb-2">Game Over!</h4>
          <div className="text-sm text-netflix-light-gray mb-3">
            Final Score: <span className="text-netflix-red font-bold">{score}</span>
          </div>
          <button
            onClick={resetGame}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Instructions */}
      {gameState === 'ready' && (
        <div className="bg-netflix-dark/30 border border-netflix-red/10 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">How to Play:</h4>
          <ul className="text-netflix-light-gray space-y-1 text-xs">
            <li>• Use ← → arrow keys or A D keys to move the basket</li>
            <li>• Catch good objects (fruits) for +10 points</li>
            <li>• Avoid bad objects (bombs) or lose a life</li>
            <li>• You have 3 lives and 30 seconds</li>
            <li>• Game gets faster over time!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Memory Card Game Component
const MemoryCardGame: React.FC = () => {
  const [cards, setCards] = useState<Array<{id: number, value: string, isFlipped: boolean, isMatched: boolean}>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const symbols = ['🚀', '💻', '⚡', '🎯', '🔥', '⭐', '🎮', '💡'];

  const initializeGame = () => {
    const gameCards = [...symbols, ...symbols].map((symbol, index) => ({
      id: index,
      value: symbol,
      isFlipped: false,
      isMatched: false
    }));
    
    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameState('playing');
  };

  const handleCardClick = (cardId: number) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard && secondCard && firstCard.value === secondCard.value) {
          // Match found
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isMatched: true, isFlipped: false }
                : card
            )
          );
          
          // Check if game is complete
          const updatedCards = cards.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true, isFlipped: false }
              : card
          );
          
          if (updatedCards.every(card => card.isMatched)) {
            setGameState('finished');
            if (!bestTime || timeElapsed < bestTime) {
              setBestTime(timeElapsed);
            }
          }
        } else {
          // No match, flip cards back
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isFlipped: false }
                : card
            )
          );
        }
        
        setFlippedCards([]);
      }, 1000);
    }
  };

  const resetGame = () => {
    setGameState('ready');
    setCards([]);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🧠 Memory Card Game</h3>
        <p className="text-netflix-light-gray text-sm">Match the pairs as fast as possible!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{moves}</div>
          <div className="text-xs text-netflix-light-gray">Moves</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{formatTime(timeElapsed)}</div>
          <div className="text-xs text-netflix-light-gray">Time</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {bestTime ? formatTime(bestTime) : '--:--'}
          </div>
          <div className="text-xs text-netflix-light-gray">Best</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center mb-6">
        {gameState === 'ready' && (
          <motion.button
            onClick={initializeGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaPlay />
            <span>Start Game</span>
          </motion.button>
        )}
        
        {gameState === 'playing' && (
          <motion.button
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaRedo />
            <span>Reset</span>
          </motion.button>
        )}
      </div>

      {/* Game Board */}
      {gameState === 'playing' && (
        <div className="grid grid-cols-4 gap-3 mb-4">
            {cards.map((card) => (
            <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                aspect-square flex items-center justify-center text-2xl font-bold rounded-lg cursor-pointer transition-all duration-200
                  ${card.isMatched 
                    ? 'bg-green-600/50 border-2 border-green-400' 
                    : card.isFlipped 
                      ? 'bg-netflix-red border-2 border-red-400' 
                      : 'bg-netflix-dark border-2 border-netflix-red/50 hover:border-netflix-red'
                  }
                `}
                >
                  {card.isFlipped || card.isMatched ? card.value : '?'}
            </div>
            ))}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'finished' && (
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">
            🏆
          </div>
          <h4 className="text-xl font-bold text-white mb-3">Congratulations!</h4>
          <div className="space-y-2 mb-4">
            <div className="text-netflix-light-gray">
              Time: <span className="text-green-400 font-bold">{formatTime(timeElapsed)}</span>
            </div>
            <div className="text-netflix-light-gray">
              Moves: <span className="text-blue-400 font-bold">{moves}</span>
            </div>
            {(!bestTime || timeElapsed < bestTime) && (
              <div className="text-yellow-400 font-bold">
                🎉 New Best Time!
              </div>
            )}
          </div>
          <button
            onClick={resetGame}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Instructions */}
      {gameState === 'ready' && (
        <div className="bg-netflix-dark/30 border border-netflix-red/10 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">How to Play:</h4>
          <ul className="text-netflix-light-gray space-y-1 text-xs">
            <li>• Click cards to flip them</li>
            <li>• Match pairs of symbols</li>
            <li>• Complete the game in as few moves as possible</li>
            <li>• Try to beat your best time!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// T-Rex Game Component - Simple, Working Implementation
const TRexGame: React.FC = () => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const dinoRef = useRef<HTMLDivElement>(null);
  const cactusRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const isJumpingRef = useRef(false);
  const isGameRunningRef = useRef(false);

  // Start game
  const startGame = () => {
    // Clear any existing game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Reset state
    setGameState('playing');
    setScore(0);
    isGameRunningRef.current = true;
    isJumpingRef.current = false;
    
    // Reset dino
    if (dinoRef.current) {
      dinoRef.current.classList.remove('jump');
      dinoRef.current.style.top = '175px';
    }
    
    // Reset cactus
    if (cactusRef.current) {
      cactusRef.current.style.left = '100%';
      cactusRef.current.style.animation = 'block 2s infinite linear';
    }
    
    // Start game loop
    const gameLoop = () => {
      if (!isGameRunningRef.current) return;
      
      // Increment score
      setScore(prev => prev + 1);
      
      // Check collision
      if (dinoRef.current && cactusRef.current) {
        const dinoRect = dinoRef.current.getBoundingClientRect();
        const cactusRect = cactusRef.current.getBoundingClientRect();
        const gameArea = dinoRef.current.parentElement?.getBoundingClientRect();
        
        if (dinoRect && cactusRect && gameArea) {
          const dinoLeft = dinoRect.left - gameArea.left;
          const dinoRight = dinoRect.right - gameArea.left;
          const dinoBottom = dinoRect.bottom - gameArea.top;
          
          const cactusLeft = cactusRect.left - gameArea.left;
          const cactusRight = cactusRect.right - gameArea.left;
          
          // Check collision: horizontal overlap AND dino on ground (not jumping)
          const horizontalOverlap = cactusLeft < dinoRight && cactusRight > dinoLeft;
          const isOnGround = dinoBottom >= 220; // Ground level check
          const notJumping = !isJumpingRef.current && !dinoRef.current.classList.contains('jump');
          
          if (horizontalOverlap && isOnGround && notJumping) {
            // Collision!
            isGameRunningRef.current = false;
            if (cactusRef.current) {
              cactusRef.current.style.animation = 'none';
            }
            setGameState('gameOver');
            setScore(currentScore => {
              if (currentScore > highScore) {
                setHighScore(currentScore);
              }
              return currentScore;
            });
            return;
          }
        }
      }
      
      // Continue game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Reset game
  const resetGame = () => {
    // Stop game
    isGameRunningRef.current = false;
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Reset everything
    setGameState('ready');
    setScore(0);
    isJumpingRef.current = false;
    
    if (dinoRef.current) {
      dinoRef.current.classList.remove('jump');
      dinoRef.current.style.top = '175px';
    }
    
    if (cactusRef.current) {
      cactusRef.current.style.animation = 'none';
      cactusRef.current.style.left = '100%';
    }
  };

  // Jump function
  const jump = useCallback(() => {
    if (gameState !== 'playing' || !dinoRef.current || isJumpingRef.current) return;
    
    isJumpingRef.current = true;
    dinoRef.current.classList.add('jump');
    
    setTimeout(() => {
      if (dinoRef.current) {
        dinoRef.current.classList.remove('jump');
        isJumpingRef.current = false;
      }
    }, 300);
  }, [gameState]);

  // Keyboard and touch controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === 'playing' && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = () => {
      if (gameState === 'playing') {
        jump();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('click', handleTouch);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('click', handleTouch);
    };
  }, [gameState, jump]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🦕 T-Rex Runner</h3>
        <p className="text-netflix-light-gray text-sm">Jump over obstacles and survive!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{score}</div>
          <div className="text-xs text-netflix-light-gray">Score</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{highScore}</div>
          <div className="text-xs text-netflix-light-gray">High Score</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center mb-6">
        {gameState === 'ready' && (
          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaPlay />
            <span>Start Game</span>
          </motion.button>
        )}
        
        {gameState === 'gameOver' && (
          <motion.button
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaRedo />
            <span>Play Again</span>
          </motion.button>
        )}
      </div>

      {/* Game Area */}
      <div className="flex justify-center">
        <div 
          className="relative bg-gradient-to-b from-sky-300 to-sky-500 border-2 border-gray-400 rounded-lg overflow-hidden w-full max-w-lg"
          style={{ height: 225 }}
        >
          {/* Ground */}
          <div 
            className="absolute bg-green-600"
            style={{ 
              bottom: 0, 
              left: 0, 
              width: '100%', 
              height: 20 
            }}
          />
          
          {/* Dino */}
          <div
            ref={dinoRef}
            className="absolute text-4xl"
            style={{
              width: 50,
              height: 50,
              position: 'relative',
              top: 175,
              left: '5%',
              transform: 'scaleX(-1)',
            }}
          >
            🦕
          </div>

          {/* Cactus */}
          <div
            ref={cactusRef}
            className="absolute text-2xl"
            style={{
              width: 20,
              height: 40,
              position: 'relative',
              top: 145,
              left: '100%',
              animation: 'none',
            }}
          >
            🌵
          </div>

          {/* Game Over Overlay */}
          {gameState === 'gameOver' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center"
            >
              <div className="text-center text-white">
                <div className="text-4xl mb-2">💀</div>
                <h4 className="text-xl font-bold mb-2">Game Over!</h4>
                <p className="text-sm mb-4">
                  Score: <span className="text-green-400 font-bold">{score}</span>
                </p>
                {score === highScore && score > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-yellow-400 font-bold text-sm mb-2"
                  >
                    🎉 New High Score!
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Instructions Overlay */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">🦕</div>
                <h4 className="text-lg font-bold mb-2">T-Rex Runner</h4>
                <p className="text-sm mb-2">Press SPACE or ↑ to jump</p>
                <p className="text-xs mb-4">On mobile: Tap to jump</p>
                <p className="text-xs text-gray-300">Avoid the cactus!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-netflix-dark/30 border border-netflix-red/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-2">How to Play:</h4>
        <ul className="text-netflix-light-gray space-y-1 text-xs">
          <li>• Press <kbd className="bg-gray-700 px-1 rounded">SPACE</kbd> or <kbd className="bg-gray-700 px-1 rounded">↑</kbd> to jump</li>
          <li>• On mobile: Tap anywhere to jump</li>
          <li>• Avoid the cactus 🌵</li>
          <li>• Try to beat your high score!</li>
        </ul>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes jump {
            0% { top: 175px; }
            50% { top: 105px; }
            100% { top: 175px; }
          }
          
          @keyframes block {
            0% { left: 100%; }
            100% { left: -10%; }
          }
          
          .jump {
            animation: jump 0.3s linear;
          }
        `
      }} />
    </div>
  );
};

export default Games;
