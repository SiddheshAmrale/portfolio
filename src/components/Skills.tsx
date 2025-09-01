import React from 'react';
import { motion } from 'framer-motion';
import {
  FaReact, FaPython, FaAws, FaDocker, FaGit, FaCloud, FaJava
} from 'react-icons/fa';
import { SiJavascript, SiGo, SiCsharp, SiAngular, SiDotnet, SiSpring, SiExpress, SiMysql, SiPostgresql, SiMongodb, SiKubernetes, SiTerraform, SiOpenai } from 'react-icons/si';
import { FaBrain, FaRobot } from 'react-icons/fa';

const Skills: React.FC = () => {
  const skillCategories = [
    {
      title: "AI/ML & Data",
      skills: [
        { name: "Generative AI", icon: <SiOpenai size={24} /> },
        { name: "RAG", icon: <FaBrain size={24} /> },
        { name: "LangChain", icon: <FaRobot size={24} /> },
        { name: "Hugging Face", icon: <FaBrain size={24} /> },
        { name: "Azure OpenAI", icon: <SiOpenai size={24} /> },
        { name: "Databricks", icon: <FaCloud size={24} /> }
      ]
    },
    {
      title: "Cloud & DevOps",
      skills: [
        { name: "Azure", icon: <FaCloud size={24} /> },
        { name: "AWS", icon: <FaAws size={24} /> },
        { name: "GCP", icon: <FaCloud size={24} /> },
        { name: "Docker", icon: <FaDocker size={24} /> },
        { name: "Kubernetes", icon: <SiKubernetes size={24} /> },
        { name: "Terraform", icon: <SiTerraform size={24} /> },
        { name: "CI/CD", icon: <FaGit size={24} /> }
      ]
    },
    {
      title: "Programming & Frameworks",
      skills: [
        { name: "Python", icon: <FaPython size={24} /> },
        { name: "Go", icon: <SiGo size={24} /> },
        { name: "Java", icon: <FaJava size={24} /> },
        { name: "C#", icon: <SiCsharp size={24} /> },
        { name: "JavaScript", icon: <SiJavascript size={24} /> },
        { name: "Angular", icon: <SiAngular size={24} /> },
        { name: "React", icon: <FaReact size={24} /> },
        { name: ".NET", icon: <SiDotnet size={24} /> },
        { name: "Spring Boot", icon: <SiSpring size={24} /> },
        { name: "Express.js", icon: <SiExpress size={24} /> }
      ]
    },
    {
      title: "Databases",
      skills: [
        { name: "MySQL", icon: <SiMysql size={24} /> },
        { name: "PostgreSQL", icon: <SiPostgresql size={24} /> },
        { name: "Cosmos DB", icon: <FaCloud size={24} /> },
        { name: "Oracle", icon: <FaCloud size={24} /> },
        { name: "NoSQL", icon: <SiMongodb size={24} /> }
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {category.skills.map((skill, skillIndex) => (
                  <motion.div
                    key={skillIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: skillIndex * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className="bg-netflix-dark/50 border border-netflix-red/20 rounded-lg p-4 hover:border-netflix-red/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center mb-3 text-netflix-red">
                      {skill.icon}
                    </div>
                    <h4 className="text-sm font-semibold text-white text-center">
                      {skill.name}
                    </h4>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
};

export default Skills; 