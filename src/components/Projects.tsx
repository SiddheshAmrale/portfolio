import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaReact, FaNodeJs, FaPython } from 'react-icons/fa';
import { SiTypescript, SiMongodb, SiPostgresql, SiTailwindcss, SiDocker, SiOpenai } from 'react-icons/si';
import { BiBrain, BiImage, BiText, BiAnalyse, BiMicrophone, BiCode } from 'react-icons/bi';

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
      github: "https://github.com/siddheshamrale/ecommerce-platform",
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
      github: "https://github.com/siddheshamrale/task-management-app",
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
      github: "https://github.com/siddheshamrale/api-gateway-service",
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
      github: "https://github.com/siddheshamrale/data-analytics-dashboard",
      featured: false
    },
    {
      id: 5,
      title: "Portfolio Website",
      description: "A modern, responsive portfolio website built with React and TypeScript, featuring smooth animations and Netflix-inspired design.",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8b6a40?w=500&h=300&fit=crop",
      category: "frontend",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
      icons: [<FaReact size={20} />, <SiTypescript size={20} />, <SiTailwindcss size={20} />],
      github: "https://github.com/siddheshamrale/portfolio",
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
      github: "https://github.com/siddheshamrale/machine-learning-api",
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
      github: "https://github.com/siddheshamrale/ai-chat-assistant",
      featured: true
    },
    {
      id: 8,
      title: "AI Image Generator",
      description: "A powerful AI image generation tool using OpenAI's DALL-E model to create stunning images from text descriptions. Features text-to-image generation, image variations, and batch processing.",
      image: "https://images.unsplash.com/photo-1686191128892-3b1a7b7b8b8b?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI DALL-E", "Image Processing", "Batch Generation"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiImage size={20} />],
      github: "https://github.com/siddheshamrale/ai-image-generator",
      featured: true
    },
    {
      id: 9,
      title: "AI Text Summarizer",
      description: "An intelligent text summarization tool powered by OpenAI's GPT models that can condense long texts into concise summaries while preserving key information. Features multiple summary styles and batch processing.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "NLP", "Text Processing"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiText size={20} />],
      github: "https://github.com/siddheshamrale/ai-text-summarizer",
      featured: false
    },
    {
      id: 10,
      title: "AI Sentiment Analyzer",
      description: "An advanced sentiment analysis tool powered by OpenAI's GPT models that can analyze emotions, tone, and sentiment in text with high accuracy and detailed insights. Features comprehensive analysis and trend tracking.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Sentiment Analysis", "Emotion Detection"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiAnalyse size={20} />],
      github: "https://github.com/siddheshamrale/ai-sentiment-analyzer",
      featured: false
    },
    {
      id: 11,
      title: "AI Data Analyzer",
      description: "A powerful AI-powered data analysis tool that leverages OpenAI's GPT models to provide intelligent insights, visualizations, and comprehensive reports from your datasets. Features anomaly detection and trend analysis.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Data Analysis", "Visualization"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiAnalyse size={20} />],
      github: "https://github.com/siddheshamrale/ai-data-analyzer",
      featured: false
    },
    {
      id: 12,
      title: "AI Voice Assistant",
      description: "A comprehensive voice-based AI assistant that provides speech-to-text, text-to-speech, and natural language conversation capabilities using OpenAI's advanced AI models. Features voice commands and conversation mode.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI Whisper", "Text-to-Speech", "Voice Processing"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiMicrophone size={20} />],
      github: "https://github.com/siddheshamrale/ai-voice-assistant",
      featured: false
    },
    {
      id: 13,
      title: "AI Code Assistant",
      description: "An intelligent code generation, debugging, and analysis tool powered by OpenAI's GPT models that helps developers write better code, fix bugs, and understand complex codebases. Features code optimization and test generation.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      category: "ai",
      technologies: ["Python", "OpenAI GPT", "Code Generation", "Debugging"],
      icons: [<FaPython size={20} />, <SiOpenai size={20} />, <BiCode size={20} />],
      github: "https://github.com/siddheshamrale/ai-code-assistant",
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
    <section id="projects" className="py-20 bg-netflix-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Featured Projects
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            Here are some of my recent projects that showcase my skills and experience in web development and AI technologies.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-netflix-red text-white'
                  : 'bg-netflix-black/50 text-netflix-light-gray hover:text-netflix-red border border-netflix-red/30'
              }`}
            >
              {category.name}
            </motion.button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className={`group relative overflow-hidden rounded-lg bg-netflix-black/50 border border-netflix-red/20 hover:border-netflix-red/50 transition-all duration-300 ${
                project.featured ? 'ring-2 ring-netflix-red/50' : ''
              }`}
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 to-transparent"></div>
                
                {/* Featured Badge */}
                {project.featured && (
                  <div className="absolute top-4 left-4 bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Featured
                  </div>
                )}
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-netflix-red transition-colors duration-200">
                  {project.title}
                </h3>
                <p className="text-netflix-light-gray mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex items-center gap-2 mb-4">
                  {project.icons.map((icon, iconIndex) => (
                    <div key={iconIndex} className="text-netflix-red">
                      {icon}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="bg-netflix-red/20 text-netflix-red text-xs px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Project Links */}
                <div className="flex gap-3">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-netflix-black/50 hover:bg-netflix-red text-netflix-light-gray hover:text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
          >
            View All Projects
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects; 