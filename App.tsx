import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { IDOList } from './components/IDOList';
import { Footer } from './components/Footer';
import { Roadmap } from './components/Roadmap';
import { NFTShowcase } from './components/NFTShowcase';
import { FAQ } from './components/FAQ';

import { CapybaraGame } from './components/CapybaraGame';

const App: React.FC = () => {
  // View state: 'dashboard' (left) or 'info' (right)
  const [currentView, setCurrentView] = useState<'dashboard' | 'info'>('dashboard');

  const handleNavigate = (view: 'dashboard' | 'info', targetId?: string) => {
    setCurrentView(view);

    // We delay the scroll slightly to allow the slide animation to begin
    if (view === 'dashboard') {
      if (targetId) {
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Scroll to top of info when switching
      setTimeout(() => {
        const infoContainer = document.getElementById('info-container');
        if (infoContainer) infoContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="font-sans antialiased text-white bg-[#0f172a] selection:bg-capy-teal selection:text-[#0f172a] h-screen overflow-hidden">
      {/* Fixed Navbar sits on top of everything */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Sliding Container: 200vw width for 2 full screens side-by-side */}
      <div
        className="flex h-full transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          width: '200vw',
          transform: currentView === 'dashboard' ? 'translateX(0)' : 'translateX(-100vw)'
        }}
      >
        {/* View 1: Dashboard (Width 100vw) */}
        <div className="w-screen h-full overflow-y-auto overflow-x-hidden relative scroll-smooth pt-20">
          <CapybaraGame />
          <Hero />
          <Marquee />
          <IDOList />
          {/* Simple footer indicator for dashboard view */}
          <div className="py-12 text-center text-white/20 text-xs uppercase tracking-widest border-t border-white/5 bg-[#020617]">
            <button onClick={() => handleNavigate('info')} className="hover:text-capy-mint transition-colors">
              Read About the Project &rarr;
            </button>
          </div>
        </div>

        {/* View 2: Info/About (Width 100vw) */}
        <div id="info-container" className="w-screen h-full overflow-y-auto overflow-x-hidden bg-[#020617] scroll-smooth relative">
          {/* Background noise texture for high-end feel */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

          <div className="pt-32 min-h-screen flex flex-col relative z-10">
            <NFTShowcase />
            <Roadmap />
            <FAQ />
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;