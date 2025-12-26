import React from 'react';
import { LENTA_IMAGE } from '../constants';

export const Marquee: React.FC = () => {
  return (
    <div className="w-full bg-[#0f172a] py-8 overflow-hidden relative z-20 border-none">
      {/* Container with a subtle glow instead of a hard background */}
      <div className="relative">
        <div className="absolute inset-0 bg-capy-teal/5 blur-xl"></div>
        <div className="flex w-[200%] animate-marquee items-center relative z-10 opacity-80 mix-blend-screen">
           {/* We use the image twice for the loop */}
           <div 
             className="w-1/2 h-24 md:h-32 bg-repeat-x bg-contain"
             style={{ backgroundImage: `url(${LENTA_IMAGE})` }}
           ></div>
           <div 
             className="w-1/2 h-24 md:h-32 bg-repeat-x bg-contain"
             style={{ backgroundImage: `url(${LENTA_IMAGE})` }}
           ></div>
        </div>
      </div>
    </div>
  );
};