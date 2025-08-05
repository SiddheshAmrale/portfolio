import React from 'react';
import { motion } from 'framer-motion';
import { FaCertificate, FaAward, FaCloud } from 'react-icons/fa';
import { BiCalendar, BiLink } from 'react-icons/bi';

const Certifications: React.FC = () => {
  const certifications = [
    {
      id: 1,
      title: "Microsoft Certified: Azure Developer Associate",
      issuer: "Microsoft",
      date: "May 13, 2024",
      credentialId: "DEEF9DCC1AE30BEF",
      certificationNumber: "494B1A-3998AB",
      description: "Validates expertise in developing, testing, and maintaining cloud applications and services on Microsoft Azure. Demonstrates proficiency in Azure development tools, services, and best practices.",
      skills: ["Azure Development", "Cloud Applications", "Azure Functions", "Azure Storage", "Azure DevOps", "API Development"],
      icon: <FaCloud size={32} />,
      featured: true,
      expiresOn: "May 14, 2026",
      verificationUrl: "https://www.credly.com/badges/azure-developer"
    },
    {
      id: 2,
      title: "Microsoft Certified: Azure Administrator Associate (AZ-104)",
      issuer: "Microsoft",
      date: "July 2022",
      credentialId: "993640855",
      description: "Demonstrates skills in implementing, managing, and monitoring identity, governance, storage, compute, and virtual networks in Microsoft Azure.",
      skills: ["Azure Administration", "Virtual Networks", "Storage Management", "Identity Management", "Azure Security", "Resource Management"],
      icon: <FaCloud size={32} />,
      featured: false,
      expiresOn: "July 2023",
      status: "Expired",
      verificationUrl: "https://www.credly.com/badges/azure-administrator"
    }
  ];

  return (
    <section id="certifications" className="py-20 bg-netflix-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Certifications & Achievements
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8"></div>
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            Professional certifications that validate my expertise in cloud technologies and Microsoft Azure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className={`relative overflow-hidden rounded-lg bg-netflix-black/50 border border-netflix-red/20 hover:border-netflix-red/50 transition-all duration-300 p-6 ${
                cert.featured ? 'ring-2 ring-netflix-red/50' : ''
              }`}
            >
              {/* Featured Badge */}
              {cert.featured && (
                <div className="absolute top-4 right-4 bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <FaAward size={14} />
                  Featured
                </div>
              )}

              {/* Status Badge for Expired Certifications */}
              {cert.status === "Expired" && (
                <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <BiCalendar size={14} />
                  Expired
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-netflix-red">
                  {cert.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {cert.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-netflix-light-gray">
                    <span className="flex items-center gap-1">
                      <FaCertificate size={14} />
                      {cert.issuer}
                    </span>
                    <span className="flex items-center gap-1">
                      <BiCalendar size={14} />
                      {cert.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-netflix-light-gray mb-4">
                {cert.description}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-2">Key Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {cert.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="bg-netflix-red/20 text-netflix-red text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Credential Details */}
              <div className="mb-4 space-y-2">
                <div className="text-xs text-netflix-light-gray">
                  <span className="font-semibold">Credential ID:</span> {cert.credentialId}
                </div>
                {cert.certificationNumber && (
                  <div className="text-xs text-netflix-light-gray">
                    <span className="font-semibold">Certification Number:</span> {cert.certificationNumber}
                  </div>
                )}
                <div className="text-xs text-netflix-light-gray">
                  <span className="font-semibold">Expires:</span> {cert.expiresOn}
                </div>
              </div>

              {/* Verification Link */}
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={cert.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
              >
                <BiLink size={16} />
                Verify Credential
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="bg-netflix-black/30 border border-netflix-red/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Why Azure Certifications Matter
            </h3>
            <p className="text-netflix-light-gray">
              My Microsoft Azure certifications demonstrate comprehensive expertise in both Azure development and administration. 
              The Azure Developer Associate certification validates my ability to design, build, test, and maintain cloud applications, 
              while the Azure Administrator Associate certification shows my skills in managing Azure infrastructure and resources.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Certifications; 