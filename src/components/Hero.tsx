import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope, FaDownload } from 'react-icons/fa';

const Hero: React.FC = () => {
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-black via-netflix-dark to-netflix-black">
        <div className="absolute inset-0 bg-netflix-dots opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Profile Image */}
          <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-netflix-red to-red-600 flex items-center justify-center mb-6 sm:mb-8">
            <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
              SA
            </span>
          </div>

          {/* Name and Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight">
              Siddhesh Amrale
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl text-netflix-red font-semibold">
              AI Cloud Full Stack Engineer
            </h2>
            <p className="text-lg sm:text-xl text-netflix-light-gray max-w-3xl mx-auto px-4">
              Passionate about creating innovative web solutions and turning ideas into reality through code.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/SiddheshAmrale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200"
            >
              <FaGithub size={28} />
            </a>
            <a
              href="https://linkedin.com/in/siddheshnitinamrale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200"
            >
              <FaLinkedin size={28} />
            </a>
            <a
              href="mailto:siddhesh.amrale@gmail.com"
              className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200"
            >
              <FaEnvelope size={28} />
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleDownloadResume}
              className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <FaDownload size={20} />
              <span>Download Resume</span>
            </button>
            <button
              onClick={scrollToProjects}
              className="border-2 border-netflix-red text-netflix-red hover:bg-netflix-red hover:text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200"
            >
              View Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;