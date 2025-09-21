import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Contact: React.FC = () => {
  const contactInfo = [
    {
      icon: <FaEnvelope size={24} />,
      title: "Email",
      value: "siddhesh.amrale@gmail.com",
      link: "mailto:siddhesh.amrale@gmail.com"
    },
    {
      icon: <FaPhone size={24} />,
      title: "Phone",
      value: "+1 (973) 438-8729",
      link: "tel:+19734388729"
    },
    {
      icon: <FaMapMarkerAlt size={24} />,
      title: "Location",
      value: "Pittsburgh, PA",
      link: "#"
    }
  ];

  const socialLinks = [
    {
      icon: <FaGithub size={24} />,
      name: "GitHub",
      url: "https://github.com/SiddheshAmrale",
      color: "hover:text-gray-400"
    },
    {
      icon: <FaLinkedin size={24} />,
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/siddheshnitinamrale/",
      color: "hover:text-blue-500"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-netflix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            📧 Get In Touch
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Let's Connect
              </h3>
              <p className="text-netflix-light-gray mb-8">
                I'm currently available for freelance work and full-time opportunities. 
                If you have a project that needs some creative thinking, I'd love to hear about it.
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <a
                  key={index}
                  href={info.link}
                  className="flex items-center space-x-4 p-4 bg-netflix-dark/50 border border-netflix-red/20 rounded-lg hover:border-netflix-red/50 transition-colors duration-300"
                >
                  <div className="text-netflix-red">
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{info.title}</h4>
                    <p className="text-netflix-light-gray">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Follow Me</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-netflix-light-gray ${social.color} transition-all duration-200 p-3 bg-netflix-dark/50 border border-netflix-red/20 rounded-lg hover:border-netflix-red/50`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form or Additional Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Ready to Work Together?
              </h3>
              <p className="text-netflix-light-gray mb-8">
                I'm excited to hear about your project and discuss how we can bring your ideas to life. 
                Let's create something amazing together!
              </p>
            </div>

            {/* Positive Message */}
            <div className="bg-gradient-to-r from-netflix-red/20 to-red-600/20 border border-netflix-red/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="text-xl font-bold text-white mb-2">Let's Build Something Great!</h4>
              <p className="text-netflix-light-gray">
                Whether it's a web application, AI solution, or innovative project, 
                I'm ready to help you achieve your goals with cutting-edge technology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;