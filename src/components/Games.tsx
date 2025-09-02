import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaRedo, FaTrophy, FaClock, FaStar } from 'react-icons/fa';

const Games: React.FC = () => {
  return (
    <section id="games" className="py-20 bg-netflix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎮 Mini Games
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            Take a break and enjoy these interactive games! Test your coding skills and memory.
          </p>
        </motion.div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Code Typing Challenge */}
           <CodeTypingGame />
           
           {/* Memory Card Game */}
           <MemoryCardGame />
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
  const [gameStarted, setGameStarted] = useState(false);

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
    setGameStarted(true);
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
    setGameStarted(false);
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
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6"
    >
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-4 text-center"
        >
          <div className="text-2xl mb-2">🎉</div>
          <h4 className="text-lg font-bold text-white mb-2">Game Over!</h4>
          <div className="text-sm text-netflix-light-gray mb-3">
            Score: <span className="text-netflix-red font-bold">{score}</span> | 
            WPM: <span className="text-blue-400 font-bold">{wpm}</span> | 
            Accuracy: <span className="text-yellow-400 font-bold">{Math.round(accuracy)}%</span>
          </div>
          <motion.button
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Play Again
          </motion.button>
        </motion.div>
      )}
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6"
    >
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
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotate: 180 }}
                animate={{ 
                  scale: 1, 
                  rotate: card.isFlipped || card.isMatched ? 0 : 180,
                  opacity: card.isMatched ? 0.5 : 1
                }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
                onClick={() => handleCardClick(card.id)}
                className={`
                  aspect-square flex items-center justify-center text-2xl font-bold rounded-lg cursor-pointer transition-all duration-300
                  ${card.isMatched 
                    ? 'bg-green-600/50 border-2 border-green-400' 
                    : card.isFlipped 
                      ? 'bg-netflix-red border-2 border-red-400' 
                      : 'bg-netflix-dark border-2 border-netflix-red/50 hover:border-netflix-red'
                  }
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(180deg)'
                }}
              >
                <motion.div
                  animate={{ 
                    rotateY: card.isFlipped || card.isMatched ? 0 : 180 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {card.isFlipped || card.isMatched ? card.value : '?'}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="text-4xl mb-4"
          >
            🏆
          </motion.div>
          <h4 className="text-xl font-bold text-white mb-3">Congratulations!</h4>
          <div className="space-y-2 mb-4">
            <div className="text-netflix-light-gray">
              Time: <span className="text-green-400 font-bold">{formatTime(timeElapsed)}</span>
            </div>
            <div className="text-netflix-light-gray">
              Moves: <span className="text-blue-400 font-bold">{moves}</span>
            </div>
            {(!bestTime || timeElapsed < bestTime) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-yellow-400 font-bold"
              >
                🎉 New Best Time!
              </motion.div>
            )}
          </div>
          <motion.button
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Play Again
          </motion.button>
        </motion.div>
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
    </motion.div>
  );
};



export default Games;
