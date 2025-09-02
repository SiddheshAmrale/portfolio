import React from 'react';
import { motion } from 'framer-motion';
import { FaCode, FaRocket, FaLightbulb, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import FloatingElements from './FloatingElements';

const About: React.FC = () => {
  const features = [
                    {
                  icon: <FaCode size={40} />,
                  title: "AI Cloud Full Stack Development",
                  description: "Experienced in AI, cloud technologies, and full-stack development, creating innovative solutions."
                },
    {
      icon: <FaRocket size={40} />,
      title: "Performance Optimization",
      description: "Focused on creating fast, efficient, and scalable applications that deliver exceptional user experiences."
    },
    {
      icon: <FaLightbulb size={40} />,
      title: "Problem Solving",
      description: "Creative approach to solving complex technical challenges with innovative solutions."
    },
    {
      icon: <FaUsers size={40} />,
      title: "Team Collaboration",
      description: "Strong communication skills and experience working in agile development teams."
    }
  ];

  return (
    <section id="about" className="py-20 bg-netflix-dark relative overflow-hidden">
      <FloatingElements />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            style={{
              textShadow: "0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(229, 9, 20, 0.2)",
              transform: "translateZ(20px)"
            }}
          >
            🎯 About Me
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-netflix-red mx-auto mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
            style={{
              boxShadow: "0 0 20px rgba(229, 9, 20, 0.5)",
              transform: "translateZ(15px)"
            }}
          />
          <motion.p 
            className="text-xl text-netflix-light-gray max-w-4xl mx-auto"
            style={{ transform: "translateZ(10px)" }}
          >
            I'm a passionate Full Stack Developer with expertise in modern web technologies. 
            I love turning complex problems into simple, beautiful, and intuitive solutions.
          </motion.p>
          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mt-6"
            style={{ transform: "translateZ(15px)" }}
          >
            <motion.div
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <FaMapMarkerAlt className="text-netflix-red" size={20} />
            </motion.div>
            <span className="text-netflix-light-gray text-lg">Pittsburgh, PA</span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotateY: -15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.h3 
              className="text-3xl font-bold text-white mb-6"
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              style={{
                textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                transform: "translateZ(20px)"
              }}
            >
              Turning Ideas Into Reality
            </motion.h3>
            <motion.p 
              className="text-lg text-netflix-light-gray mb-6"
              style={{ transform: "translateZ(15px)" }}
            >
              With a strong foundation in both frontend and backend development, I specialize in creating 
              comprehensive web applications that not only look great but also perform exceptionally well.
            </motion.p>
            <motion.p 
              className="text-lg text-netflix-light-gray mb-6"
              style={{ transform: "translateZ(15px)" }}
            >
              My journey in software development has been driven by curiosity and a desire to build 
              solutions that make a difference. I believe in writing clean, maintainable code and 
              staying up-to-date with the latest technologies and best practices.
            </motion.p>

          </motion.div>

          {/* Right Column - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
            style={{ transformStyle: "preserve-3d" }}
          >
            {[
              { number: "5+", label: "Years Experience" },
              { number: "20+", label: "Projects Completed" },
              { number: "40+", label: "Technologies" },
              { number: "100%", label: "Client Satisfaction" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                className="text-center p-6 bg-netflix-black/50 rounded-lg border border-netflix-red/20 relative overflow-hidden"
                style={{
                  transform: "translateZ(20px)"
                }}
              >
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-netflix-red/10 to-transparent"
                  style={{
                    transform: "translateX(-100%) skewX(-15deg)"
                  }}
                />
                <motion.div 
                  className="text-3xl font-bold text-netflix-red mb-2"
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
                >
                  {stat.number}
                </motion.div>
                <div className="text-netflix-light-gray text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          style={{ transformStyle: "preserve-3d" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, rotateY: -90 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -15,
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              className="text-center p-6 bg-netflix-black/30 rounded-lg border border-netflix-red/20 hover:border-netflix-red/50 transition-all duration-300 relative overflow-hidden"
              style={{
                transform: "translateZ(25px)"
              }}
            >
              <motion.div
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-netflix-red/5 to-transparent"
                style={{
                  transform: "translateX(-100%) skewX(-15deg)"
                }}
              />
              <motion.div 
                className="text-netflix-red mb-4 flex justify-center"
                whileHover={{ 
                  scale: 1.2,
                  transition: { duration: 0.3 }
                }}
                style={{
                  filter: "drop-shadow(0 0 10px rgba(229, 9, 20, 0.5))"
                }}
              >
                {feature.icon}
              </motion.div>
              <motion.h3 
                className="text-xl font-semibold text-white mb-3"
                style={{
                  textShadow: "0 0 10px rgba(255, 255, 255, 0.3)"
                }}
              >
                {feature.title}
              </motion.h3>
              <p className="text-netflix-light-gray">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About; 