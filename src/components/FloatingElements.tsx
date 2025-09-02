import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  className?: string;
  delay?: number;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'blue' | 'purple' | 'green' | 'yellow';
  shape?: 'square' | 'circle' | 'triangle';
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  className = '',
  delay = 0,
  duration = 20,
  size = 'md',
  color = 'red',
  shape = 'square',
  position = { top: '20%', left: '10%' }
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    red: 'bg-gradient-to-br from-netflix-red/20 to-red-600/20',
    blue: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    purple: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    green: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
    yellow: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full',
    triangle: 'rounded-lg transform rotate-45'
  };

  const shadowColors = {
    red: 'rgba(229, 9, 20, 0.3)',
    blue: 'rgba(59, 130, 246, 0.3)',
    purple: 'rgba(168, 85, 247, 0.3)',
    green: 'rgba(34, 197, 94, 0.3)',
    yellow: 'rgba(234, 179, 8, 0.3)'
  };

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} ${colorClasses[color]} ${shapeClasses[shape]} ${className}`}
      style={{
        ...position,
        transform: "perspective(1000px)",
        boxShadow: `0 0 25px ${shadowColors[color]}`
      }}
      animate={{
        rotateY: [0, 360],
        rotateX: [0, 15, 0, -15, 0],
        y: [0, -20, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

const FloatingElements: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Red elements */}
      <FloatingElement
        color="red"
        size="lg"
        shape="square"
        position={{ top: '15%', left: '5%' }}
        delay={0}
        duration={25}
      />
      <FloatingElement
        color="red"
        size="sm"
        shape="circle"
        position={{ top: '60%', left: '8%' }}
        delay={5}
        duration={20}
      />
      
      {/* Blue elements */}
      <FloatingElement
        color="blue"
        size="md"
        shape="circle"
        position={{ top: '25%', right: '10%' }}
        delay={2}
        duration={30}
      />
      <FloatingElement
        color="blue"
        size="sm"
        shape="square"
        position={{ top: '70%', right: '15%' }}
        delay={8}
        duration={18}
      />
      
      {/* Purple elements */}
      <FloatingElement
        color="purple"
        size="md"
        shape="triangle"
        position={{ top: '40%', left: '3%' }}
        delay={3}
        duration={22}
      />
      <FloatingElement
        color="purple"
        size="lg"
        shape="circle"
        position={{ bottom: '20%', right: '5%' }}
        delay={6}
        duration={28}
      />
      
      {/* Green elements */}
      <FloatingElement
        color="green"
        size="sm"
        shape="square"
        position={{ top: '80%', left: '20%' }}
        delay={4}
        duration={24}
      />
      <FloatingElement
        color="green"
        size="md"
        shape="triangle"
        position={{ top: '10%', right: '25%' }}
        delay={7}
        duration={26}
      />
      
      {/* Yellow elements */}
      <FloatingElement
        color="yellow"
        size="lg"
        shape="circle"
        position={{ bottom: '30%', left: '12%' }}
        delay={1}
        duration={32}
      />
      <FloatingElement
        color="yellow"
        size="sm"
        shape="square"
        position={{ top: '50%', right: '30%' }}
        delay={9}
        duration={16}
      />
    </div>
  );
};

export default FloatingElements;
