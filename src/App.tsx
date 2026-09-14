import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Games from './components/Games';
import Footer from './components/Footer';
import InferenceLab from './labs/inference/InferenceLab';
import QuantumLab from './labs/quantum/QuantumLab';
import PqcLab from './labs/pqc/PqcLab';
import FleetLab from './labs/fleet/FleetLab';

const HomePage: React.FC = () => {
  const location = useLocation();
  useEffect(function () {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        window.setTimeout(function () {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        return;
      }
    }
    if (!location.hash) window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Certifications />
      <Projects />
      <Contact />
      <Games />
    </>
  );
};

function AppShell() {
  const location = useLocation();
  const isWorkbench = location.pathname.startsWith('/labs/');
  return (
    <div className={isWorkbench ? 'min-h-screen bg-[#07090d] app-workbench-root' : 'min-h-screen bg-netflix-black'}>
      {isWorkbench ? null : <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/labs/inference" element={<InferenceLab />} />
          <Route path="/labs/quantum" element={<QuantumLab />} />
          <Route path="/labs/pqc" element={<PqcLab />} />
          <Route path="/labs/fleet" element={<FleetLab />} />
        </Routes>
      </main>
      {isWorkbench ? null : <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
