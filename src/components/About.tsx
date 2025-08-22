import React from 'react';
import { motion } from 'framer-motion';
import { FaCode, FaRocket, FaLightbulb, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';

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
    <section id="about" className="py-20 bg-netflix-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎯 About Me
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            I'm a passionate Full Stack Developer with expertise in modern web technologies. 
            I love turning complex problems into simple, beautiful, and intuitive solutions.
          </p>
          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <FaMapMarkerAlt className="text-netflix-red" size={20} />
            <span className="text-netflix-light-gray text-lg">Pittsburgh, PA</span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold text-white mb-6">
              Turning Ideas Into Reality
            </h3>
            <p className="text-lg text-netflix-light-gray mb-6">
              With a strong foundation in both frontend and backend development, I specialize in creating 
              comprehensive web applications that not only look great but also perform exceptionally well.
            </p>
            <p className="text-lg text-netflix-light-gray mb-6">
              My journey in software development has been driven by curiosity and a desire to build 
              solutions that make a difference. I believe in writing clean, maintainable code and 
              staying up-to-date with the latest technologies and best practices.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-netflix-red/20 border border-netflix-red/30 rounded-lg px-4 py-2">
                <span className="text-netflix-red font-semibold">React</span>
              </div>
              <div className="bg-netflix-red/20 border border-netflix-red/30 rounded-lg px-4 py-2">
                <span className="text-netflix-red font-semibold">Node.js</span>
              </div>
              <div className="bg-netflix-red/20 border border-netflix-red/30 rounded-lg px-4 py-2">
                <span className="text-netflix-red font-semibold">TypeScript</span>
              </div>
              <div className="bg-netflix-red/20 border border-netflix-red/30 rounded-lg px-4 py-2">
                <span className="text-netflix-red font-semibold">Python</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { number: "5+", label: "Years Experience" },
              { number: "20+", label: "Projects Completed" },
              { number: "15+", label: "Technologies" },
              { number: "100%", label: "Client Satisfaction" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-netflix-black/50 rounded-lg border border-netflix-red/20"
              >
                <div className="text-3xl font-bold text-netflix-red mb-2">
                  {stat.number}
                </div>
                <div className="text-netflix-light-gray text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="text-center p-6 bg-netflix-black/30 rounded-lg border border-netflix-red/20 hover:border-netflix-red/50 transition-all duration-300"
            >
              <div className="text-netflix-red mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
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