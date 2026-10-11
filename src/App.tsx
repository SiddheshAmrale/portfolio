import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './site/Home';
import { Footer, Nav } from './site/Chrome';

// Every lab is its own chunk: the home page never downloads lab code.
const InferenceLab = lazy(() => import('./labs/inference/InferenceLab'));
const QuantumLab = lazy(() => import('./labs/quantum/QuantumLab'));
const PqcLab = lazy(() => import('./labs/pqc/PqcLab'));
const FleetLab = lazy(() => import('./labs/fleet/FleetLab'));
const TelemetryLab = lazy(() => import('./labs/pilot/TelemetryLab'));
const IncidentLab = lazy(() => import('./labs/pilot/IncidentLab'));
const RegressionLab = lazy(() => import('./labs/pilot/RegressionLab'));
const ForgeLab = lazy(() => import('./labs/forge/ForgeLab'));
const LinkLab = lazy(() => import('./labs/link/LinkLab'));
const SmrLab = lazy(() => import('./labs/smr/SmrLab'));
const LearnLab = lazy(() => import('./labs/learn/LearnLab'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-px w-40 overflow-hidden bg-line">
        <div className="h-full w-1/3 bg-gold" style={{ animation: 'marquee 1s var(--ease-in-out) infinite alternate' }} />
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isWorkbench = location.pathname.startsWith('/labs/') || location.pathname.startsWith('/learn');
  return (
    <div className={isWorkbench ? 'min-h-screen app-workbench-root' : 'min-h-screen'}>
      {isWorkbench ? null : <Nav />}
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/labs/inference" element={<InferenceLab />} />
            <Route path="/labs/quantum" element={<QuantumLab />} />
            <Route path="/labs/pqc" element={<PqcLab />} />
            <Route path="/labs/fleet" element={<FleetLab />} />
            <Route path="/labs/telemetry" element={<TelemetryLab />} />
            <Route path="/labs/incident" element={<IncidentLab />} />
            <Route path="/labs/regression" element={<RegressionLab />} />
            <Route path="/labs/forge" element={<ForgeLab />} />
            <Route path="/labs/link" element={<LinkLab />} />
            <Route path="/labs/smr" element={<SmrLab />} />
            <Route path="/learn" element={<LearnLab />} />
            <Route path="/labs/learn" element={<LearnLab />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {isWorkbench ? null : <Footer />}
    </div>
  );
}
