import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaReact, FaNodeJs, FaPython } from 'react-icons/fa';
import { SiTypescript, SiMongodb, SiPostgresql, SiTailwindcss, SiDocker, SiOpenai, SiPytorch, SiFastapi } from 'react-icons/si';
import { BiBrain, BiText, BiAnalyse, BiMicrophone, BiCode, BiGame, BiChat, BiTrendingUp, BiFilterAlt } from 'react-icons/bi';
import FloatingElements from './FloatingElements';

const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const projects = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database. Features include user authentication, product management, shopping cart, and payment integration.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop",
      category: "fullstack",
      technologies: ["React", "Node.js", "MongoDB", "Express"],
      icons: [<FaReact size={20} />, <FaNodeJs size={20} />, <SiMongodb size={20} />],
      github: "https://github.com/SiddheshAmrale/ecommerce-platform",
      featured: true
    },
    {
      id: 2,
      title: "Task Management App",
      description: "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop",
      category: "frontend",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
      icons: [<FaReact size={20} />, <SiTypescript size={20} />, <SiTailwindcss size={20} />],
      github: "https://github.com/SiddheshAmrale/task-management-app",
      featured: true
    },
    {
      id: 3,
      title: "API Gateway Service",
      description: "A microservices API gateway built with Node.js and Express, featuring rate limiting, authentication, and request routing.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=300&fit=crop",
      category: "backend",
      technologies: ["Node.js", "Express", "PostgreSQL", "Docker"],
      icons: [<FaNodeJs size={20} />, <SiPostgresql size={20} />, <SiDocker size={20} />],
      github: "https://github.com/SiddheshAmrale/api-gateway-service",
      featured: false
    },
    {
      id: 4,
      title: "Data Analytics Dashboard",
      description: "A real-time data visualization dashboard with interactive charts and analytics tools for business intelligence.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "fullstack",
      technologies: ["React", "Python", "PostgreSQL", "Chart.js"],
      icons: [<FaReact size={20} />, <FaPython size={20} />, <SiPostgresql size={20} />],
      github: "https://github.com/SiddheshAmrale/data-analytics-dashboard",
      featured: false
    },

    {
      id: 6,
      title: "Machine Learning API",
      description: "A RESTful API for machine learning models with Python Flask backend, featuring model training and prediction endpoints.",
      image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=500&h=300&fit=crop",
      category: "backend",
      technologies: ["Python", "Flask", "PostgreSQL", "Docker"],
      icons: [<FaPython size={20} />, <SiPostgresql size={20} />, <SiDocker size={20} />],
      github: "https://github.com/SiddheshAmrale/machine-learning-api",
      featured: false
    },
    // AI Projects
    {
      id: 7,
      title: "AI Chat Assistant",
      description: "A conversational AI assistant with memory and context management built using OpenAI's GPT models. Features intelligent conversations, conversation memory, and customizable system prompts.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Conversation Memory", "API Integration"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiBrain size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-chat-assistant",
      featured: true
    },
    {
      id: 8,
      title: "AI Text Summarizer",
      description: "An intelligent text summarization tool powered by OpenAI's GPT models that can condense long texts into concise summaries while preserving key information. Features multiple summary styles and batch processing.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "NLP", "Text Processing"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiText size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-text-summarizer",
      featured: false
    },
    {
      id: 9,
      title: "AI Sentiment Analyzer",
      description: "An advanced sentiment analysis tool powered by OpenAI's GPT models that can analyze emotions, tone, and sentiment in text with high accuracy and detailed insights. Features comprehensive analysis and trend tracking.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Sentiment Analysis", "Emotion Detection"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiAnalyse size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-sentiment-analyzer",
      featured: false
    },
    {
      id: 10,
      title: "AI Data Analyzer",
      description: "A powerful AI-powered data analysis tool that leverages OpenAI's GPT models to provide intelligent insights, visualizations, and comprehensive reports from your datasets. Features anomaly detection and trend analysis.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Data Analysis", "Visualization"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiAnalyse size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-data-analyzer",
      featured: false
    },
    {
      id: 11,
      title: "AI Voice Assistant",
      description: "A comprehensive voice-based AI assistant that provides speech-to-text, text-to-speech, and natural language conversation capabilities using OpenAI's advanced AI models. Features voice commands and conversation mode.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI Whisper", "Text-to-Speech", "Voice Processing"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiMicrophone size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-voice-assistant",
      featured: false
    },
    {
      id: 12,
      title: "AI Code Assistant",
      description: "An intelligent code generation, debugging, and analysis tool powered by OpenAI's GPT models that helps developers write better code, fix bugs, and understand complex codebases. Features code optimization and test generation.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Code Generation", "Debugging"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiCode size={20} />],
      github: "https://github.com/SiddheshAmrale/ai-code-assistant",
      featured: false
    },
    // New AI/ML Projects from ai_ml_projects directory
    {
      id: 13,
      title: "AI-Powered Game Engine",
      description: "Advanced game engine with procedural generation, NPC AI using reinforcement learning, and dynamic difficulty adjustment. Features real-time learning, GPU acceleration, and cross-platform support.",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "PyTorch", "FastAPI", "Redis", "PostgreSQL"],
      icons: [<FaPython size={20} />, <SiPytorch size={20} />, <BiGame size={20} />],
      github: "https://github.com/siddheshamrale/ai-game-engine",
      featured: true
    },
    {
      id: 14,
      title: "Computer Vision System",
      description: "Multi-modal computer vision system with object detection, segmentation, OCR, and CLIP-based understanding. Features real-time processing, GPU acceleration, and comprehensive REST API.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "PyTorch", "FastAPI", "YOLO", "CLIP"],
      icons: [<FaPython size={20} />, <SiPytorch size={20} />, <BiAnalyse size={20} />],
      github: "https://github.com/siddheshamrale/computer-vision-system",
      featured: true
    },
    {
      id: 15,
      title: "LLM RAG Chatbot",
      description: "Enterprise-grade chatbot with Retrieval-Augmented Generation, multi-modal support, and real-time learning capabilities. Features vector database integration and continuous improvement.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "FastAPI", "ChromaDB", "OpenAI", "Anthropic"],
      icons: [<FaPython size={20} />, <SiFastapi size={20} />, <BiChat size={20} />],
      github: "https://github.com/siddheshamrale/llm-rag-chatbot",
      featured: true
    },
    {
      id: 16,
      title: "ML Pipeline Platform",
      description: "Large-scale ML platform with distributed training, model versioning, A/B testing, and AutoML capabilities. Features PySpark integration, MLflow tracking, and Kubernetes deployment.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "PySpark", "MLflow", "Kubernetes", "Docker"],
      icons: [<FaPython size={20} />, <SiDocker size={20} />, <BiTrendingUp size={20} />],
      github: "https://github.com/siddheshamrale/ml-pipeline-platform",
      featured: false
    },
    {
      id: 17,
      title: "Recommendation System",
      description: "Advanced recommendation system with collaborative filtering, content-based filtering, and hybrid approaches. Features real-time updates, A/B testing framework, and scalable architecture.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "FastAPI", "Redis", "PostgreSQL", "Scikit-learn"],
      icons: [<FaPython size={20} />, <SiFastapi size={20} />, <BiFilterAlt size={20} />],
      github: "https://github.com/siddheshamrale/recommendation-system",
      featured: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Projects' },
    { id: 'frontend', name: 'Frontend' },
    { id: 'backend', name: 'Backend' },
    { id: 'fullstack', name: 'Full Stack' },
    { id: 'ai', name: 'AI Projects' }
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  return (
    <section id="projects" className="py-20 bg-netflix-dark relative overflow-hidden">
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
            🚀 Featured Projects
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
            Here are some of my recent projects that showcase my skills and experience in web development and AI technologies.
          </motion.p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 relative overflow-hidden ${
                selectedCategory === category.id
                  ? 'bg-netflix-red text-white'
                  : 'bg-netflix-black/50 text-netflix-light-gray hover:text-netflix-red border border-netflix-red/30'
              }`}
              style={{
                transform: "translateZ(15px)"
              }}
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
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{
                  transform: "translateX(-100%) skewX(-15deg)"
                }}
              />
              {category.name}
            </motion.button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50, rotateY: -90 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -15,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group relative overflow-hidden rounded-lg bg-netflix-black/50 border border-netflix-red/20 hover:border-netflix-red/50 transition-all duration-300"
              style={{
                transform: "translateZ(25px)",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 to-transparent"></div>
                

              </div>

              {/* Project Content */}
              <div className="p-6">
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 group-hover:text-netflix-red transition-colors duration-200"
                  style={{
                    textShadow: "0 0 10px rgba(255, 255, 255, 0.3)"
                  }}
                >
                  {project.title}
                </motion.h3>
                <p className="text-netflix-light-gray mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex items-center gap-2 mb-4">
                  {project.icons.map((icon, iconIndex) => (
                    <motion.div 
                      key={iconIndex} 
                      className="text-netflix-red"
                      whileHover={{ 
                        scale: 1.2,
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        filter: "drop-shadow(0 0 5px rgba(229, 9, 20, 0.5))"
                      }}
                    >
                      {icon}
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <motion.span
                      key={techIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: techIndex * 0.05, duration: 0.3 }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        scale: 1.1,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-netflix-red/20 text-netflix-red text-xs px-2 py-1 rounded"
                      style={{
                        transform: "translateZ(10px)"
                      }}
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>

                {/* Project Links */}
                <div className="flex gap-3">
                  <motion.a
                    whileHover={{ 
                      scale: 1.1,
                      transition: { duration: 0.3 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-netflix-black/50 hover:bg-netflix-red text-netflix-light-gray hover:text-white px-4 py-2 rounded-lg transition-all duration-200 relative overflow-hidden"
                    style={{
                      transform: "translateZ(15px)"
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
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{
                        transform: "translateX(-100%) skewX(-15deg)"
                      }}
                    />
                    <FaGithub size={16} />
                    <span className="text-sm">Code</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View More Button */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.button
            whileHover={{ 
              scale: 1.1,
              y: -5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 relative overflow-hidden"
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
            View All Projects
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects; 