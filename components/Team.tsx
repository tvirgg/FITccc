import React from 'react';
import { TEAM_MEMBERS } from '../constants';

export const Team: React.FC = () => {
  return (
    <section id="team" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-bold text-left text-capy-darkTeal mb-16 px-4 border-l-8 border-capy-teal">
          THE SQUAD
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="group relative h-[400px] overflow-hidden cursor-pointer bg-capy-light">
              <img 
                src={member.image} 
                alt={member.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-capy-darkTeal/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="text-3xl font-bold text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{member.name}</h3>
                <p className="text-capy-mint uppercase tracking-widest text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};