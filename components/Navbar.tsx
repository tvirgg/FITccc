import React, { useState, useEffect } from 'react';

interface NavbarProps {
  currentView: 'dashboard' | 'info';
  onNavigate: (view: 'dashboard' | 'info', targetId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 flex justify-center px-4`}
      >
        <div className={`
          w-full max-w-5xl 
          ${scrolled || mobileMenuOpen ? 'bg-[#0f172a]/80 backdrop-blur-xl border-white/10 shadow-[0_0_40px_-10px_rgba(0,193,182,0.3)]' : 'bg-[#0f172a]/40 backdrop-blur-md border-white/5'}
          border rounded-full px-6 py-3
          flex justify-between items-center
          transition-all duration-500
        `}>

          {/* Brand */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 group cursor-pointer outline-none pl-2"
          >
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-2xl tracking-tighter lowercase font-sequel leading-none group-hover:text-capy-teal transition-colors duration-300">
                capyclub
              </span>
            </div>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-1">
            <NavButton
              active={currentView === 'dashboard'}
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </NavButton>
            <NavButton
              active={false}
              onClick={() => onNavigate('dashboard', 'projects')}
            >
              Projects
            </NavButton>
            <NavButton
              active={currentView === 'info'}
              onClick={() => onNavigate('info')}
            >
              Info
            </NavButton>
          </div>

          {/* Right Area */}
          <div className="hidden md:flex items-center gap-4">
            <button className="
              relative overflow-hidden
              bg-white text-[#0f172a] px-6 py-2.5 rounded-full 
              hover:bg-capy-teal hover:text-white
              transition-all duration-300
              uppercase text-[10px] font-bold tracking-[0.15em] 
              shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,193,182,0.6)] 
              active:scale-95 border border-transparent
              group
            ">
              <span className="relative z-10">Connect Wallet</span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Menu</span>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`
        fixed inset-0 z-40 bg-[#0f172a]/95 backdrop-blur-2xl transition-all duration-300 flex flex-col items-center justify-center gap-8
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <MobileNavButton onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}>
            Dashboard
          </MobileNavButton>
          <MobileNavButton onClick={() => { onNavigate('dashboard', 'projects'); setMobileMenuOpen(false); }}>
            Projects
          </MobileNavButton>
          <MobileNavButton onClick={() => { onNavigate('info'); setMobileMenuOpen(false); }}>
            Info
          </MobileNavButton>

          <div className="h-px w-full bg-white/10 my-2"></div>

          <button className="w-full bg-capy-teal text-[#0f172a] py-4 rounded-xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,193,182,0.4)]">
            Connect Wallet
          </button>
        </div>
      </div>
    </>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      px-5 py-2 rounded-full text-xs uppercase tracking-[0.15em] font-bold transition-all duration-300
      ${active
        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/5'
        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    {children}
  </button>
);

const MobileNavButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-2xl font-bold uppercase tracking-widest text-white hover:text-capy-teal transition-colors"
  >
    {children}
  </button>
);