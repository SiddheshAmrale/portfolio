import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FaGithub, FaLinkedin, FaEnvelope, FaDownload } from 'react-icons/fa';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(event.clientX - centerX);
      mouseY.set(event.clientY - centerY);
    }
  };

  const handleDownloadResume = () => {
    const link = document.createElement('a');
    link.href = '/Siddhesh_Amrale_Resume_2025_GenAI_.docx';
    link.download = 'Siddhesh_Amrale_Resume_2025_GenAI_.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToProjects = () => {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="home" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 3D Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-black via-netflix-dark to-netflix-black">
        <div className="absolute inset-0 bg-netflix-dots opacity-20"></div>
        
        {/* Floating 3D Elements */}
        <motion.div
          animate={{
            rotateY: [0, 360],
            rotateX: [0, 15, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-netflix-red/20 to-red-600/20 rounded-lg"
          style={{
            transform: "perspective(1000px) rotateX(45deg)",
            boxShadow: "0 0 30px rgba(229, 9, 20, 0.3)"
          }}
        />
        
        <motion.div
          animate={{
            rotateY: [360, 0],
            rotateX: [0, -15, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full"
          style={{
            transform: "perspective(1000px) rotateX(45deg)",
            boxShadow: "0 0 25px rgba(59, 130, 246, 0.3)"
          }}
        />
        
        <motion.div
          animate={{
            rotateZ: [0, 360],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-32 left-1/4 w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg"
          style={{
            transform: "perspective(1000px) rotateX(60deg)",
            boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)"
          }}
        />
        
        <motion.div
          animate={{
            rotateX: [0, 180, 360],
            rotateY: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-1/3 w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg"
          style={{
            transform: "perspective(1000px)",
            boxShadow: "0 0 25px rgba(34, 197, 94, 0.3)"
          }}
        />
      </div>

      {/* Content with 3D Tilt Effect */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* 3D Profile Image */}
          <motion.div
            initial={{ scale: 0, rotateX: -90 }}
            animate={{ scale: 1, rotateX: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ 
              scale: 1.1, 
              rotateY: 10,
              rotateX: 5,
              transition: { duration: 0.3 }
            }}
            className="mx-auto w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-netflix-red to-red-600 flex items-center justify-center mb-6 sm:mb-8 relative"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 20px 40px rgba(229, 9, 20, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)"
            }}
          >
            <motion.span 
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white relative z-10"
              style={{ textShadow: "0 0 20px rgba(255, 255, 255, 0.5)" }}
            >
              SA
            </motion.span>
            
            {/* 3D Glow Effect */}
            <motion.div
              animate={{
                rotateY: [0, 360],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-netflix-red/50 to-red-600/50 blur-xl"
              style={{
                transform: "translateZ(-10px)"
              }}
            />
          </motion.div>

          {/* 3D Name and Title */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-4"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight"
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              style={{
                textShadow: "0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(229, 9, 20, 0.2)",
                transform: "translateZ(20px)"
              }}
            >
              Siddhesh Amrale
            </motion.h1>
            <motion.h2 
              className="text-xl sm:text-2xl md:text-3xl text-netflix-red font-semibold"
              animate={{
                textShadow: [
                  "0 0 10px rgba(229, 9, 20, 0.5)",
                  "0 0 20px rgba(229, 9, 20, 0.8)",
                  "0 0 10px rgba(229, 9, 20, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ transform: "translateZ(15px)" }}
            >
              AI Cloud Full Stack Engineer
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl text-netflix-light-gray max-w-3xl mx-auto px-4"
              style={{ transform: "translateZ(10px)" }}
            >
              Passionate about creating innovative web solutions and turning ideas into reality through code.
            </motion.p>
          </motion.div>

          {/* 3D Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex justify-center space-x-6"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.a
              whileHover={{ 
                scale: 1.2, 
                y: -10,
                rotateY: 15,
                rotateX: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
              href="https://github.com/SiddheshAmrale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200 relative"
              style={{
                transform: "translateZ(25px)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))"
              }}
            >
              <FaGithub size={28} />
            </motion.a>
            <motion.a
              whileHover={{ 
                scale: 1.2, 
                y: -10,
                rotateY: 15,
                rotateX: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
              href="https://linkedin.com/in/siddheshnitinamrale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200 relative"
              style={{
                transform: "translateZ(25px)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))"
              }}
            >
              <FaLinkedin size={28} />
            </motion.a>
            <motion.a
              whileHover={{ 
                scale: 1.2, 
                y: -10,
                rotateY: 15,
                rotateX: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
              href="mailto:siddhesh.amrale@gmail.com"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200 relative"
              style={{
                transform: "translateZ(25px)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))"
              }}
            >
              <FaEnvelope size={28} />
            </motion.a>
          </motion.div>

          {/* 3D CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.button
              whileHover={{ 
                scale: 1.1,
                rotateY: 5,
                rotateX: 5,
                y: -5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadResume}
              className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center space-x-2 relative overflow-hidden"
              style={{
                transform: "translateZ(30px)"
              }}
            >
              <motion.div
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  transform: "translateX(-100%) skewX(-15deg)"
                }}
              />
              <FaDownload size={20} />
              <span>Download Resume</span>
            </motion.button>
            <motion.button
              whileHover={{ 
                scale: 1.1,
                rotateY: -5,
                rotateX: 5,
                y: -5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToProjects}
              className="border-2 border-netflix-red text-netflix-red hover:bg-netflix-red hover:text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 relative overflow-hidden"
              style={{
                transform: "translateZ(30px)"
              }}
            >
              <motion.div
                animate={{
                  rotateY: [360, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-netflix-red/20 to-transparent"
                style={{
                  transform: "translateX(100%) skewX(15deg)"
                }}
              />
              View Projects
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero; 