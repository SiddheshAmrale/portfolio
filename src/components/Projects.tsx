import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import FloatingElements from './FloatingElements';

interface ProjectCard {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  path: string;
  accent: string;
  evidence: string;
}

const projects: ProjectCard[] = [
  {
    id: 'telemetry',
    title: 'Telemetry Data Quality Lab',
    description: 'Linux-shaped counters through Parquet and DuckDB. Replay duplicates, reorder, gaps, delay, restart, unit change, and ambiguous drops. Naive rates and Prometheus increase() are compared with a classifier that withholds invented values. At least one operational alert changes after data quality.',
    category: 'telemetry',
    technologies: ['Python', 'Parquet', 'DuckDB', 'Counters'],
    path: '/labs/telemetry',
    accent: 'from-sky-800 to-black',
    evidence: 'Python + live Ubuntu CI'
  },
  {
    id: 'incident',
    title: 'Network Incident Diagnosis Lab',
    description: 'Flagship: unnamed recorded incidents with application, TcpRetransSegs, and host CPU timelines. Frozen evidence rules, no injector labels, held-out evaluation, and live Ubuntu netns+veth+netem+cgroup cases. Software loss is not optical BER.',
    category: 'telemetry',
    technologies: ['Diagnosis', 'Evidence', 'Held-out', 'Interventions'],
    path: '/labs/incident',
    accent: 'from-rose-800 to-black',
    evidence: 'Python + live Ubuntu CI'
  },
  {
    id: 'regression',
    title: 'Release Regression Analyzer',
    description: 'Declared primary metric, A-versus-A false-alarm check, collector/analysis version comparison, and a planted latency regression. Repeated independent runs — not one long trace treated as many samples.',
    category: 'telemetry',
    technologies: ['A/A', 'Effect size', 'Repeatability'],
    path: '/labs/regression',
    accent: 'from-violet-800 to-black',
    evidence: 'Python + live Ubuntu CI'
  },
  {
    id: 'inference',
    title: 'Inference Runtime Workbench',
    description: 'Pinned-baseline discrete-event study of cancel/retry slot leaks and noisy-neighbor tail latency. Cooperative cancel at kernel boundaries plus interactive isolation, with held-out load and a case where isolation starves batch jobs.',
    category: 'systems',
    technologies: ['Runtime', 'Scheduling', 'Profiling', 'Tail latency'],
    path: '/labs/inference',
    accent: 'from-red-700 to-black',
    evidence: 'Runnable without the site'
  },
  {
    id: 'quantum',
    title: 'Quantum Compiler Workbench',
    description: 'Compiler passes with statevector fidelity on every basis state, not a tutorial circuit. Hybrid jobs compare naive at-least-once classical publishes with exactly-once recovery after device failure.',
    category: 'quantum',
    technologies: ['Compilers', 'Statevector', 'Idempotency', 'HPC orchestration'],
    path: '/labs/quantum',
    accent: 'from-indigo-700 to-black',
    evidence: 'Runnable without the site'
  },
  {
    id: 'pqc',
    title: 'PQC Migration Console',
    description: 'Cryptographic inventory, hybrid vs PQC-only TLS, mixed modern/legacy/middlebox traffic, dual-publish rotation and rollback. Uses FIPS 203/204 sizes; does not invent primitives.',
    category: 'security',
    technologies: ['ML-KEM', 'ML-DSA', 'TLS', 'Rotation'],
    path: '/labs/pqc',
    accent: 'from-emerald-800 to-black',
    evidence: 'Runnable without the site'
  },
  {
    id: 'fleet',
    title: 'GPU Fleet Operations Console',
    description: 'Live diagnostics and repair automation: thermal, ECC, Xid, and link faults. Distinguishes GPU watts from lagged facility energy. Compare reboot-storm vs diagnose-then-act — not a synthetic power scheduler.',
    category: 'infrastructure',
    technologies: ['DCGM-style probes', 'Drain/reset', 'PUE', 'Ops delay'],
    path: '/labs/fleet',
    accent: 'from-amber-800 to-black',
    evidence: 'Runnable without the site'
  }
];

const categories = [
  { id: 'all', name: 'All labs' },
  { id: 'telemetry', name: 'Telemetry' },
  { id: 'systems', name: 'AI systems' },
  { id: 'quantum', name: 'Quantum' },
  { id: 'security', name: 'Security' },
  { id: 'infrastructure', name: 'Fleet ops' }
];

const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(function (project) { return project.category === selectedCategory; });

  return (
    <section id="projects" className="py-20 bg-netflix-dark relative overflow-hidden">
      <FloatingElements />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Systems workbenches
          </h2>
          <div className="w-24 h-1 bg-netflix-red mx-auto mb-8" />
          <p className="text-xl text-netflix-light-gray max-w-4xl mx-auto">
            Each investigation launches as its own full-screen app. Three telemetry labs are viewers over pinned Python experiments (<code className="text-white/80">npm run pilot:test</code>, <code className="text-white/80">npm run pilot:cases</code>). The four TypeScript workbenches still run with <code className="text-white/80">npm run workbench</code>. They are independent investigations, not production cluster measurements.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(function (category) {
            return (
              <button
                key={category.id}
                onClick={function () { setSelectedCategory(category.id); }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-netflix-red text-white'
                    : 'bg-netflix-black/50 text-netflix-light-gray hover:text-netflix-red border border-netflix-red/30'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map(function (project) {
            return (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-lg bg-netflix-black/50 border border-netflix-red/20 hover:border-netflix-red/50 transition-colors duration-300"
              >
                <div className={'relative h-36 bg-gradient-to-br ' + project.accent}>
                  <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-xs uppercase tracking-wide text-white/80">
                    {project.evidence}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-netflix-red transition-colors duration-200">
                    {project.title}
                  </h3>
                  <p className="text-netflix-light-gray mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {project.technologies.map(function (tech) {
                      return (
                        <span key={tech} className="bg-netflix-red/20 text-netflix-red text-xs px-2 py-1 rounded">
                          {tech}
                        </span>
                      );
                    })}
                  </div>
                  <Link
                    to={project.path}
                    className="inline-flex items-center gap-2 bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    <FaPlay size={12} />
                    <span className="text-sm font-semibold">Launch app</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
