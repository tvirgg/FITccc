import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-[#020617] text-white py-12 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center relative z-10">
        <div className="mb-8 md:mb-0">
          <h2 className="text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-capy-teal to-capy-mint">capyclab</h2>
          <p className="text-white/40 text-sm mt-2 font-mono">© 2026 Capybara Chill Club. All Rights Reserved.</p>
        </div>

        <div className="flex gap-8">
          <a href="#" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-capy-mint transition-colors">Twitter</a>
          <a href="#" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-capy-mint transition-colors">Discord</a>
          <a href="#" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-capy-mint transition-colors">Telegram</a>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #00c1b6 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
    </footer>
  );
};