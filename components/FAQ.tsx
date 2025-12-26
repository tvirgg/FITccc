import React from 'react';
import { FAQ_ITEMS } from '../constants';

export const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-24 bg-capy-darkTeal text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-bold text-center mb-16 tracking-tighter opacity-20 select-none">
          QUESTIONS?
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {FAQ_ITEMS.map((item) => (
            <details key={item.id} className="group border-b border-white/20 pb-4 cursor-pointer">
              <summary className="text-2xl md:text-3xl font-light list-none flex justify-between items-center hover:text-capy-mint transition-colors">
                <span>{item.question}</span>
                <span className="text-4xl font-thin group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div className="mt-4 text-lg text-white/70 leading-relaxed font-light overflow-hidden transition-all duration-500 max-h-0 group-open:max-h-40">
                <p className="py-4">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};