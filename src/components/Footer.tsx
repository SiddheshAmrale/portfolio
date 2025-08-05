import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaEnvelope, FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: <FaGithub size={20} />,
      name: "GitHub",
      url: "https://github.com/siddheshamrale",
      color: "hover:text-gray-400"
    },
    {
      icon: <FaLinkedin size={20} />,
      name: "LinkedIn",
      url: "https://linkedin.com/in/siddhesh-amrale",
      color: "hover:text-blue-500"
    },
    {
      icon: <FaEnvelope size={20} />,
      name: "Email",
      url: "mailto:siddhesh.amrale@email.com",
      color: "hover:text-red-500"
    }
  ];

  return (
    <footer className="bg-netflix-dark border-t border-netflix-red/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-netflix-red">
              SIDDHESH AMRALE
            </h3>
            <p className="text-netflix-light-gray">
              AI Cloud Full Stack Engineer passionate about creating innovative web solutions and turning ideas into reality through code.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-netflix-light-gray ${social.color} transition-all duration-200`}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: "About", href: "#about" },
                { name: "Skills", href: "#skills" },
                { name: "Projects", href: "#projects" },
                { name: "Contact", href: "#contact" }
              ].map((link, index) => (
                <li key={index}>
                  <motion.a
                    href={link.href}
                    whileHover={{ x: 5 }}
                    className="text-netflix-light-gray hover:text-netflix-red transition-colors duration-200"
                  >
                    {link.name}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
            <div className="space-y-2 text-netflix-light-gray">
              <p>📍 Pittsburgh, PA</p>
              <p>📧 siddhesh.amrale@email.com</p>
              <p>📱 +1 (973) 438-8729</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-netflix-red/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-netflix-light-gray text-sm">
            © {currentYear} Siddhesh Amrale. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 text-netflix-light-gray text-sm mt-4 md:mt-0">
            <span>Made with</span>
            <FaHeart className="text-netflix-red" />
            <span>using React & TypeScript</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 