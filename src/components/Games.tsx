import React, { useState, useEffect, useRef, useCallback } from 'react';
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
            Take a break and enjoy these interactive games! Test your coding skills and memory.
          </p>
        </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Code Typing Challenge */}
           <CodeTypingGame />
           
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

// Code Typing Challenge Component
const CodeTypingGame: React.FC = () => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'finished'>('ready');
  const [currentCode, setCurrentCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const codeSnippets = [
    `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
    `const quickSort = (arr) => {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
};`,
    `class ReactComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }
  
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  }
  
  render() {
    return <button onClick={this.handleClick}>
      Count: {this.state.count}
    </button>;
  }
}`,
    `const useCustomHook = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  
  const increment = useCallback(() => {
    setValue(prev => prev + 1);
  }, []);
  
  return { value, increment };
};`,
    `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) throw new Error('User not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}`
  ];

  const startGame = () => {
    const randomCode = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
    setCurrentCode(randomCode);
    setUserInput('');
    setScore(0);
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(100);
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
    setCurrentCode('');
    setUserInput('');
    setScore(0);
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState !== 'playing') return;
    
    const input = e.target.value;
    setUserInput(input);
    
    const correctChars = input.split('').filter((char, index) => 
      char === currentCode[index]
    ).length;
    
    const newAccuracy = input.length > 0 ? (correctChars / input.length) * 100 : 100;
    setAccuracy(newAccuracy);
    
    const wordsTyped = input.split(/\s+/).length;
    const timeElapsed = (60 - timeLeft) / 60;
    const newWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    setWpm(newWpm);
    
    setScore(correctChars);
    
    if (input === currentCode) {
      setGameState('finished');
    }
  };

  return (
    <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">⌨️ Code Typing Challenge</h3>
        <p className="text-netflix-light-gray text-sm">Test your coding speed and accuracy!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-netflix-red">{timeLeft}</div>
          <div className="text-xs text-netflix-light-gray">Time</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{score}</div>
          <div className="text-xs text-netflix-light-gray">Score</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{wpm}</div>
          <div className="text-xs text-netflix-light-gray">WPM</div>
        </div>
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{Math.round(accuracy)}%</div>
          <div className="text-xs text-netflix-light-gray">Accuracy</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center space-x-3 mb-4">
        {gameState === 'ready' && (
          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            <FaPlay />
            <span>Start</span>
          </motion.button>
        )}
        
        {(gameState === 'playing' || gameState === 'paused') && (
          <>
            <motion.button
              onClick={togglePause}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              {gameState === 'playing' ? <FaPause /> : <FaPlay />}
              <span>{gameState === 'playing' ? 'Pause' : 'Resume'}</span>
            </motion.button>
            
            <motion.button
              onClick={resetGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              <FaRedo />
              <span>Reset</span>
            </motion.button>
          </>
        )}
      </div>

      {/* Code Display */}
      {currentCode && (
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-4 mb-4">
          <div className="text-xs text-netflix-light-gray mb-2">Code to type:</div>
          <pre className="text-green-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {currentCode}
          </pre>
        </div>
      )}

      {/* Input Area */}
      {gameState === 'playing' && (
        <div>
          <textarea
            value={userInput}
            onChange={handleInputChange}
            className="w-full h-24 px-3 py-2 bg-netflix-dark/50 border border-netflix-red/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-netflix-red/50 transition-all duration-300 resize-none"
            placeholder="Start typing..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'finished' && (
        <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h4 className="text-lg font-bold text-white mb-2">Game Over!</h4>
          <div className="text-sm text-netflix-light-gray mb-3">
            Score: <span className="text-netflix-red font-bold">{score}</span> | 
            WPM: <span className="text-blue-400 font-bold">{wpm}</span> | 
            Accuracy: <span className="text-yellow-400 font-bold">{Math.round(accuracy)}%</span>
          </div>
          <button
            onClick={resetGame}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Play Again
          </button>
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

// T-Rex Game Component
const TRexGame: React.FC = () => {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'gameOver'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  
  // Refs for DOM manipulation - following codinn.dev approach
  const dinoRef = useRef<HTMLDivElement>(null);
  const cactusRef = useRef<HTMLDivElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout>();

  const startGame = () => {
    setGameState('countdown');
    setScore(0);
    setCountdown(3);
    
    // Countdown before starting the game
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState('playing');
          // Start the game loop using setInterval like codinn.dev
          gameIntervalRef.current = setInterval(() => {
      // Get current dino Y position
      const dinoTop = dinoRef.current ? 
        parseInt(getComputedStyle(dinoRef.current).getPropertyValue("top")) : 0;
      
      // Get current cactus X position
      const cactusLeft = cactusRef.current ? 
        parseInt(getComputedStyle(cactusRef.current).getPropertyValue("left")) : 0;
      
      // Detect collision - improved collision logic
      if (cactusLeft < 80 && cactusLeft > 20 && dinoTop >= 160) {
        // Collision detected
        setGameState('gameOver');
        setScore(currentScore => {
          if (currentScore > highScore) {
            setHighScore(currentScore);
          }
          return currentScore;
        });
        // Clear interval on game over
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
        }
      } else {
        // Update score
        setScore(prev => prev + 1);
      }
    }, 10);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetGame = () => {
    // Clear the game interval
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    
    // Reset dino position
    if (dinoRef.current) {
      dinoRef.current.classList.remove('jump');
    }
    
    // Reset cactus position
    if (cactusRef.current) {
      cactusRef.current.style.animation = 'none';
      // Trigger reflow to reset animation
      void cactusRef.current.offsetHeight;
    }
    
    // Start the game directly
    startGame();
  };

  const jump = useCallback(() => {
    if (gameState !== 'playing' || !dinoRef.current) return;
    
    // Add jump class if not already jumping
    if (!dinoRef.current.classList.contains('jump')) {
      dinoRef.current.classList.add('jump');
      
      // Remove jump class after animation completes (300ms)
      setTimeout(() => {
        if (dinoRef.current) {
          dinoRef.current.classList.remove('jump');
        }
      }, 300);
    }
  }, [gameState]);

  // Handle key press and touch for jumping - only when T-Rex game is playing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only capture keys when T-Rex game is actively playing
      if (gameState === 'playing' && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      // Only capture touch when T-Rex game is actively playing
      if (gameState === 'playing') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Only capture click when T-Rex game is actively playing
      if (gameState === 'playing') {
        e.preventDefault();
        jump();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('click', handleClick);
    };
  }, [jump, gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🦕 T-Rex Runner</h3>
        <p className="text-netflix-light-gray text-sm">Jump over obstacles and survive as long as possible!</p>
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
          
          {/* Dino - using CSS animations like codinn.dev */}
          <div
            ref={dinoRef}
            className="absolute text-4xl"
            style={{
              width: 50,
              height: 50,
              position: 'relative',
              top: 175, // Adjusted to touch the ground (225 - 20 ground - 50 dino = 155, but using 175 for better visual)
              left: '5%',
              transform: 'scaleX(-1)', // Flip the dino to face right
            }}
          >
            🦕
          </div>

          {/* Cactus - using CSS animations like codinn.dev */}
          <div
            ref={cactusRef}
            className="absolute text-2xl"
            style={{
              width: 20,
              height: 40,
              position: 'relative',
              top: 145, // Positioned above the ground (225 - 20 ground - 40 cactus = 165, but using 145 to be visible)
              right: '-10%',
              animation: gameState === 'playing' ? 'block 2s infinite linear' : 'none',
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
                <p className="text-xs mb-4">On mobile: Tap anywhere to jump</p>
                <p className="text-xs text-gray-300">Avoid the cactus!</p>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold text-netflix-red mb-4">
                  {countdown}
                </div>
                <p className="text-sm text-gray-300">Get ready!</p>
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
          <li>• On mobile: Tap anywhere on the screen to jump</li>
          <li>• Avoid the cactus 🌵</li>
          <li>• Try to beat your high score!</li>
        </ul>
      </div>

      {/* CSS Animations - following codinn.dev approach */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes jump {
            0% { top: 175px; }
            30% { top: 155px; }
            50% { top: 105px; }
            80% { top: 155px; }
            100% { top: 175px; }
          }
          
          @keyframes block {
            0% { right: -10%; }
            100% { right: 100%; }
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
