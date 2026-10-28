// All page content in one place. Facts only: everything here is backed by a
// repository, a runnable lab, or a verifiable credential.

export const profile = {
  name: 'Siddhesh Amrale',
  role: 'Analytics Full Stack Developer (Data & AI Platform Engineering)',
  employer: 'Pittsburgh International Airport',
  location: 'Pittsburgh, PA',
  coords: '40.44°N 79.99°W',
  email: 'siddhesh.amrale@gmail.com',
  phone: '+1 (973) 438-8729',
  phoneHref: 'tel:+19734388729',
  github: 'https://github.com/SiddheshAmrale',
  linkedin: 'https://www.linkedin.com/in/siddheshnitinamrale/',
  resume: '/Siddhesh_Amrale_Resume.pdf',
};

export const roles = [
  'AI systems',
  'data platforms',
  'cloud infrastructure',
  'high-performance software',
  'robotics AI foundations',
];

export const metrics = [
  { value: '3×', label: 'Microsoft Azure certified' },
  { value: '12', label: 'Runnable systems labs' },
  { value: '5.6%', label: 'CPU on HEVC playback (VELA)' },
  { value: '2.2 MB', label: 'Native cross-platform binary' },
];

export type DomainId = 'data' | 'ai' | 'performance' | 'cloud' | 'robotics';

export const domains: {
  id: DomainId;
  index: string;
  title: string;
  line: string;
  points: string[];
}[] = [
  {
    id: 'data',
    index: '01',
    title: 'Data',
    line: 'Pipelines you can trust when the inputs lie.',
    points: ['Medallion lakehouse, CDC / SCD2', 'Contracts, quarantine, freshness SLAs', 'DuckDB · Parquet · Databricks'],
  },
  {
    id: 'ai',
    index: '02',
    title: 'AI',
    line: 'Generative AI that is grounded, evaluated and served well.',
    points: ['RAG, LangChain, Azure OpenAI', 'Inference runtime: cancel, retry, isolation', 'Azure AI Engineer certified'],
  },
  {
    id: 'performance',
    index: '03',
    title: 'Performance',
    line: 'Profile first. Every claim gets a benchmark.',
    points: ['Rust + GPU media pipeline (VELA)', 'Tail latency, A/A checks, regressions', 'Render-on-change, near-zero idle CPU'],
  },
  {
    id: 'cloud',
    index: '04',
    title: 'Cloud',
    line: 'Infrastructure that is observable and boring to operate.',
    points: ['Azure, AWS, GCP', 'Docker, Kubernetes, Terraform, CI/CD', 'GPU fleet diagnostics & repair automation'],
  },
  {
    id: 'robotics',
    index: '05',
    title: 'Robotics AI',
    line: 'Where real-time inference meets the physical world.',
    points: ['Deadline-aware inference scheduling', 'Sensor telemetry integrity', 'Fleet health, drain / reset automation'],
  },
];

export type Project = {
  id: string;
  title: string;
  summary: string;
  domains: DomainId[];
  tech: string[];
  evidence: string;
  path?: string;
  href?: string;
  image?: string;
};

export const projects: Project[] = [
  {
    id: 'vela',
    title: 'VELA Media Player',
    summary:
      'A native, cross-platform media player in Rust on libmpv: virtually every format, GPU decoding, frame-exact seeking with thumbnail previews, subtitles, audio tracks, EQ and resume. Renders only when a frame or the UI changes — 5.6% CPU on HEVC playback vs 9.8% for stock mpv, ~0.3% idle, 2.2 MB binary.',
    domains: ['performance'],
    tech: ['Rust', 'libmpv', 'OpenGL', 'egui', 'Win · macOS · Linux'],
    evidence: 'Desktop app · 85 end-to-end checks',
    href: 'https://github.com/SiddheshAmrale/vela',
    image: '/vela/home.jpg',
  },
  {
    id: 'sa-photoshop',
    title: 'SA-Photoshop',
    summary:
      'Native image editor in pure Rust: layers, masks, adjustment layers, brushes, type, vectors and real PSD files. Fork of PhotoCraft (MIT/Apache-2.0) — open source, offline, and cross-platform (desktop + web).',
    domains: ['performance'],
    tech: ['Rust', 'GPU', 'PSD', 'Native · Web'],
    evidence: 'Fork of PhotoCraft · Rust native',
    href: 'https://github.com/SiddheshAmrale/sa-photoshop',
  },
  {
    id: 'world-tracker',
    title: 'World Tracker',
    summary:
      'Live photorealistic 3D globe of aircraft, ships, satellites, earthquakes and public cameras, with voice control. Performance-focused fork of God\'s Eye View: motion LOD, memoized time, and panel coalescing that lifted live-view FPS from the teens into the mid-20s–40s.',
    domains: ['performance', 'cloud'],
    tech: ['Cesium', 'JavaScript', 'Realtime', '3D globe'],
    evidence: 'Live globe · voice agent',
    href: 'https://github.com/SiddheshAmrale/world-tracker',
  },
  {
    id: 'agent-lakehouse',
    title: 'Agent-Ready Lakehouse',
    summary:
      'MCP server that gives AI agents governed, read-only access to lakehouse data: SQL allow-list, per-role sandboxes with masking and row filters, a locked engine and an audit log. A CI eval gate checks metric accuracy against an independent oracle, 23 attack and out-of-scope requests, and latency.',
    domains: ['ai', 'data'],
    tech: ['MCP', 'DuckDB', 'dbt', 'Evals'],
    evidence: '44 tests · CI eval gate',
    href: 'https://github.com/SiddheshAmrale/agent-ready-lakehouse',
  },
  {
    id: 'inference',
    title: 'Inference Runtime Workbench',
    summary:
      'Pinned-baseline discrete-event study of cancel/retry slot leaks and noisy-neighbour tail latency. Cooperative cancel at kernel boundaries plus interactive isolation, with held-out load and a case where isolation starves batch jobs.',
    domains: ['ai', 'performance', 'robotics'],
    tech: ['Scheduling', 'Tail latency', 'Profiling'],
    evidence: 'Runnable without the site',
    path: '/labs/inference',
  },
  {
    id: 'forge',
    title: 'Lakehouse Forge',
    summary:
      'Runnable medallion Bronze → Silver → Gold with CDC/SCD2, contract quarantine, late facts, freshness SLA and experiment allocation health (uniqueness, lag, sample ratio). Python + DuckDB/Parquet.',
    domains: ['data'],
    tech: ['Medallion', 'SCD2', 'Contracts', 'DuckDB'],
    evidence: 'Python + pytest',
    path: '/labs/forge',
  },
  {
    id: 'fleet',
    title: 'GPU Fleet Operations Console',
    summary:
      'Live diagnostics and repair automation for thermal, ECC, Xid and link faults. Separates GPU watts from lagged facility energy, and compares reboot-storm with diagnose-then-act.',
    domains: ['cloud', 'ai', 'robotics'],
    tech: ['DCGM-style probes', 'Drain / reset', 'PUE'],
    evidence: 'Runnable without the site',
    path: '/labs/fleet',
  },
  {
    id: 'telemetry',
    title: 'Telemetry Data Quality Lab',
    summary:
      'Linux-shaped counters through Parquet and DuckDB with duplicates, reordering, gaps, delay, restarts and unit changes. Compares naive rates and Prometheus increase() with a classifier that refuses to invent values.',
    domains: ['data', 'performance', 'robotics'],
    tech: ['Python', 'Parquet', 'DuckDB', 'Counters'],
    evidence: 'Python + live Ubuntu CI',
    path: '/labs/telemetry',
  },
  {
    id: 'incident',
    title: 'Network Incident Diagnosis Lab',
    summary:
      'Unnamed recorded incidents with application, TcpRetransSegs and host-CPU timelines. Frozen evidence rules, no injector labels, held-out evaluation, and live Ubuntu netns + veth + netem + cgroup cases.',
    domains: ['cloud', 'performance'],
    tech: ['Diagnosis', 'Evidence rules', 'Held-out eval'],
    evidence: 'Python + live Ubuntu CI',
    path: '/labs/incident',
  },
  {
    id: 'regression',
    title: 'Release Regression Analyzer',
    summary:
      'Declared primary metric, A-versus-A false-alarm check, collector/analysis version comparison and a planted latency regression — repeated independent runs, not one long trace treated as many samples.',
    domains: ['performance'],
    tech: ['A/A', 'Effect size', 'Repeatability'],
    evidence: 'Python + live Ubuntu CI',
    path: '/labs/regression',
  },
  {
    id: 'pqc',
    title: 'PQC Migration Console',
    summary:
      'Cryptographic inventory, hybrid vs PQC-only TLS, mixed modern/legacy/middlebox traffic, dual-publish rotation and rollback. Uses FIPS 203/204 sizes; does not invent primitives.',
    domains: ['cloud'],
    tech: ['ML-KEM', 'ML-DSA', 'TLS', 'Rotation'],
    evidence: 'Runnable without the site',
    path: '/labs/pqc',
  },
  {
    id: 'link',
    title: 'Link Integrity Lab',
    summary:
      'Per-lane SNR, BER, eye, jitter, FEC and equalisation teaching models that force the category error into the open: software packet loss is not optical BER.',
    domains: ['performance'],
    tech: ['SerDes', 'BER', 'FEC'],
    evidence: 'Python teaching models',
    path: '/labs/link',
  },
  {
    id: 'quantum',
    title: 'Quantum Compiler Workbench',
    summary:
      'Compiler passes checked by statevector fidelity on every basis state. Hybrid jobs compare at-least-once classical publishes with exactly-once recovery after device failure.',
    domains: ['performance', 'cloud'],
    tech: ['Compilers', 'Statevector', 'Idempotency'],
    evidence: 'Runnable without the site',
    path: '/labs/quantum',
  },
  {
    id: 'smr',
    title: 'SMR Instrumentation Integrity',
    summary:
      'Process-channel integrity — missing is not zero, trip setpoints on trusted samples — plus a physics-result store with design/git identity. A teaching model, not nuclear-qualified software.',
    domains: ['data', 'robotics'],
    tech: ['I&C', 'Trips', 'Integrity'],
    evidence: 'Python + pytest',
    path: '/labs/smr',
  },
  {
    id: 'learn',
    title: 'Guided Practical Academy',
    summary:
      'Hands-on tracks over the labs: telemetry identity, SerDes/FEC vocabulary, lakehouse medallion and experiment health, instrumentation integrity — with a glossary and a practice path.',
    domains: ['data', 'ai'],
    tech: ['Curriculum', 'Glossary', 'Practice'],
    evidence: 'Interactive tracks',
    path: '/learn',
  },
];

export const filters: { id: 'all' | DomainId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'data', label: 'Data' },
  { id: 'ai', label: 'AI' },
  { id: 'performance', label: 'Performance' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'robotics', label: 'Robotics AI' },
];

export const stack: { group: string; items: string[] }[] = [
  { group: 'AI & ML', items: ['Generative AI', 'RAG', 'LangChain', 'Hugging Face', 'Azure OpenAI', 'Azure AI Services'] },
  { group: 'Data', items: ['Databricks', 'DuckDB', 'Parquet', 'Lakehouse / CDC', 'Data contracts', 'PostgreSQL', 'MySQL', 'Cosmos DB', 'Oracle'] },
  { group: 'Cloud & DevOps', items: ['Azure', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'] },
  { group: 'Languages', items: ['Python', 'Rust', 'Go', 'Java', 'C#', 'TypeScript', 'JavaScript'] },
  { group: 'Frameworks', items: ['React', 'Angular', '.NET', 'Spring Boot', 'Express.js', 'egui'] },
  { group: 'Systems', items: ['Linux /proc & netns', 'libmpv / OpenGL', 'Telemetry', 'SerDes / BER', 'Profiling'] },
];

export const credentials = [
  {
    title: 'Azure AI Engineer Associate',
    code: 'AI-104',
    issued: 'August 2025',
    id: 'EDA4C40E9F0219A6',
    focus: ['Azure AI Services', 'Azure ML', 'Cognitive Services', 'AI solution architecture'],
    url: 'https://learn.microsoft.com/api/credentials/share/en-us/SiddheshAmrale-4796/EDA4C40E9F0219A6?sharingId=35158B22038BBCBE',
  },
  {
    title: 'Azure Developer Associate',
    code: 'AZ-204',
    issued: 'May 2024',
    id: 'DEEF9DCC1AE30BEF',
    focus: ['Azure Functions', 'Storage', 'Azure DevOps', 'API development'],
    url: 'https://learn.microsoft.com/en-us/users/siddheshamrale-4796/credentials/deef9dcc1ae30bef',
  },
  {
    title: 'Azure Administrator Associate',
    code: 'AZ-104',
    issued: 'July 2022',
    id: '993640855',
    focus: ['Identity & governance', 'Virtual networks', 'Storage', 'Compute'],
    url: 'https://www.credly.com/badges/c0c52dda-1f32-49a4-9bf9-4bc5010e3bda',
  },
];
