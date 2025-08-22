import React from 'react';
import { motion } from 'framer-motion';
import {
  FaReact, FaNodeJs, FaPython,
  FaAws, FaDocker, FaGit, FaFigma, FaCloud
} from 'react-icons/fa';
import { SiTypescript, SiJavascript, SiTailwindcss, SiGo, SiCsharp, SiCplusplus, SiPhp } from 'react-icons/si';

const Skills: React.FC = () => {
  const skillCategories = [
    {
      title: "Frontend Development",
      skills: [
        { name: "React", icon: <FaReact size={24} />, level: 90 },
        { name: "TypeScript", icon: <SiTypescript size={24} />, level: 85 },
        { name: "JavaScript", icon: <SiJavascript size={24} />, level: 90 },
        { name: "Tailwind CSS", icon: <SiTailwindcss size={24} />, level: 85 }
      ]
    },
    {
      title: "Backend Development",
      skills: [
        { name: "Node.js", icon: <FaNodeJs size={24} />, level: 85 },
        { name: "Python", icon: <FaPython size={24} />, level: 80 },
        { name: "Go", icon: <SiGo size={24} />, level: 75 },
        { name: "C#", icon: <SiCsharp size={24} />, level: 70 }
      ]
    },
    {
      title: "Programming Languages",
      skills: [
        { name: "C", icon: <SiCplusplus size={24} />, level: 75 },
        { name: "C++", icon: <SiCplusplus size={24} />, level: 70 },
        { name: "Java", icon: <FaPython size={24} />, level: 65 },
        { name: "PHP", icon: <SiPhp size={24} />, level: 60 }
      ]
    },
    {
      title: "Cloud & DevOps",
      skills: [
        { name: "AWS", icon: <FaAws size={24} />, level: 75 },
        { name: "Azure", icon: <FaCloud size={24} />, level: 80 },
        { name: "Docker", icon: <FaDocker size={24} />, level: 70 },
        { name: "Git", icon: <FaGit size={24} />, level: 85 }
      ]
    },
    {
      title: "Design & Tools",
      skills: [
        { name: "Figma", icon: <FaFigma size={24} />, level: 70 },
        { name: "AI/ML", icon: <FaPython size={24} />, level: 85 },
        { name: "OpenAI API", icon: <FaPython size={24} />, level: 90 },
        { name: "Data Analysis", icon: <FaPython size={24} />, level: 80 }
      ]
    }
  ];

  return (
    <section id="skills" className="py-20 bg-netflix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ⚡ Skills & Technologies
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            I've worked with a variety of technologies to create robust and scalable applications.
          </p>
        </motion.div>

        <div className="space-y-12">
          {skillCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                {category.title}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.skills.map((skill, skillIndex) => (
                  <motion.div
                    key={skillIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: skillIndex * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-6 hover:border-netflix-red/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center mb-4 text-netflix-red">
                      {skill.icon}
                    </div>
                    <h4 className="text-lg font-semibold text-white text-center mb-3">
                      {skill.name}
                    </h4>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-netflix-black rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-netflix-red to-red-600 h-2 rounded-full"
                      />
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm text-netflix-light-gray">
                        {skill.level}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Skills */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Additional Skills
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "HTML5", "CSS3", "Redux", "Express.js", "REST APIs",
              "GraphQL", "CI/CD", "Agile",
              "Azure Functions", "Azure DevOps", "Azure SQL", "Azure Storage",
              "Azure App Service", "Azure Cognitive Services", "Power BI"
            ].map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-netflix-red/20 border border-netflix-red/30 rounded-lg px-4 py-3 text-center hover:bg-netflix-red/30 transition-colors duration-200"
              >
                <span className="text-netflix-red font-medium text-sm">
                  {skill}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills; 