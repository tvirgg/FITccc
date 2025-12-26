import React from 'react';
import { ROADMAP_ITEMS } from '../constants';

export const Roadmap: React.FC = () => {
  return (
    <section id="roadmap" className="py-24 bg-gray-50 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-bold text-center text-gray-900 mb-20 tracking-tighter">
          THE PATH
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {ROADMAP_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-8 border-t-4 h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group
                ${item.status === 'completed' ? 'border-gray-900 bg-gray-900 text-white' : 
                  item.status === 'current' ? 'border-capy-teal bg-white shadow-2xl scale-105 z-20 text-gray-900' : 
                  'border-gray-300 bg-gray-100 text-gray-400'}`}
            >
              {/* Sold Out Stamp Effect */}
              {item.status === 'completed' && (
                <div className="absolute top-4 right-4 border border-capy-mint text-capy-mint text-[10px] font-bold px-2 py-1 uppercase tracking-widest -rotate-12 opacity-50">
                  Completed
                </div>
              )}

              <div>
                <span className={`text-6xl font-bold block mb-4 opacity-50 ${
                   item.status === 'current' ? 'text-capy-darkTeal' : 'opacity-20'
                }`}>
                  {item.phase}
                </span>
                <h3 className="text-xl font-bold mb-6 uppercase tracking-wider leading-tight">{item.title}</h3>
                <ul className="space-y-4">
                  {item.items.map((subItem, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-3">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          item.status === 'completed' ? 'bg-capy-mint' : 
                          item.status === 'current' ? 'bg-capy-teal' : 'bg-gray-400'
                      }`}></span>
                      <span className={`text-sm font-medium leading-relaxed ${
                          item.status === 'completed' ? 'text-gray-300 line-through decoration-capy-mint/50' : ''
                      }`}>{subItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {item.status === 'current' && (
                <div className="mt-8 bg-capy-teal text-[#0f172a] text-center py-3 text-xs font-bold uppercase tracking-widest rounded-lg animate-pulse">
                  In Progress
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};