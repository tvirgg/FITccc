import React, { useState, useEffect } from 'react';

interface NavbarProps {
  currentView: 'dashboard' | 'info';
  onNavigate: (view: 'dashboard' | 'info', targetId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Since scrolling happens inside the divs, we can't easily track window scroll
  // But we can apply style based on view
  const isInfo = currentView === 'info';

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isInfo ? 'bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 py-4'
      }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 group cursor-pointer outline-none"
        >
          <div
            className="w-12 h-12 bg-cover bg-center bg-no-repeat shadow-[0_0_20px_rgba(0,193,182,0.1)] group-hover:scale-110 transition-transform overflow-hidden"
            style={{
              backgroundImage: 'url("/img/iconFavicon.ico")',
              backgroundSize: '100% 100%'
            }}
          />
          <div className="flex flex-col text-left">
            <span className="text-white font-bold text-lg tracking-widest uppercase font-sequel leading-none">
              Capy<span className="text-capy-teal">Pad</span>
            </span>
            <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase mt-0.5">Chill Launchpad</span>
          </div>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-10 items-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`text-xs uppercase tracking-[0.15em] font-bold transition-all hover:-translate-y-0.5 relative ${currentView === 'dashboard' ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
          >
            Dashboard
            {currentView === 'dashboard' && <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-capy-teal rounded-full shadow-[0_0_10px_#00c1b6]"></span>}
          </button>

          <button
            onClick={() => onNavigate('dashboard', 'projects')}
            className="text-white/40 hover:text-white text-xs uppercase tracking-[0.15em] font-bold transition-all hover:-translate-y-0.5"
          >
            Projects
          </button>

          <button
            onClick={() => onNavigate('info')}
            className={`text-xs uppercase tracking-[0.15em] font-bold transition-all hover:-translate-y-0.5 relative ${currentView === 'info' ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
          >
            Info
            {currentView === 'info' && <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-capy-mint rounded-full shadow-[0_0_10px_#92f4ef]"></span>}
          </button>

          <button className="bg-white text-[#0f172a] px-8 py-3 rounded-xl hover:bg-gray-200 transition-all uppercase text-[10px] font-bold tracking-[0.15em] shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] active:scale-95 border border-transparent">
            Connect Wallet
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0f172a] border-t border-white/10 p-4 flex flex-col gap-4 shadow-2xl h-screen z-50 backdrop-blur-xl">
          <button
            onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
            className="text-white text-left py-4 px-4 uppercase tracking-widest border-b border-white/5 text-lg font-bold hover:bg-white/5 rounded-lg"
          >
            Dashboard
          </button>
          <button
            onClick={() => { onNavigate('dashboard', 'projects'); setMobileMenuOpen(false); }}
            className="text-white text-left py-4 px-4 uppercase tracking-widest border-b border-white/5 text-lg font-bold hover:bg-white/5 rounded-lg"
          >
            Projects
          </button>
          <button
            onClick={() => { onNavigate('info'); setMobileMenuOpen(false); }}
            className="text-white text-left py-4 px-4 uppercase tracking-widest border-b border-white/5 text-lg font-bold hover:bg-white/5 rounded-lg"
          >
            Info
          </button>
          <button className="bg-capy-teal w-full py-4 mt-4 rounded-xl font-bold uppercase tracking-widest text-[#0f172a] shadow-lg">
            Connect Wallet
          </button>
        </div>
      )}
    </nav>
  );
};