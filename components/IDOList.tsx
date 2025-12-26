import React, { useState, useEffect } from 'react';
import { IDO_PROJECTS } from '../constants';
import { IdoProject } from '../types';

export const IDOList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Live' | 'Upcoming' | 'Ended'>('Live');
  const [projects, setProjects] = useState<IdoProject[]>(IDO_PROJECTS);

  // Filter projects based on tab
  const filteredProjects = projects.filter(p => p.status === activeTab);

  // Live simulation engine
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prev => prev.map(p => {
        if (p.status === 'Live') {
          // Simulation logic:
          // 1. Randomly increase participants
          // 2. Randomly increase raised amount
          // 3. Ensure it doesn't exceed target cap for logic safety
          
          const shouldUpdate = Math.random() > 0.3; // 70% chance to update each second
          if (!shouldUpdate) return p;

          let newParticipants = p.participants;
          let newRaise = p.raiseAmount;

          if (Math.random() > 0.5) newParticipants += Math.floor(Math.random() * 2) + 1;
          if (Math.random() > 0.4) newRaise += Math.floor(Math.random() * 200) + 50;

          if (newRaise > p.targetAmount) newRaise = p.targetAmount;

          return {
            ...p,
            participants: newParticipants,
            raiseAmount: newRaise
          };
        }
        return p;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="projects" className="py-32 bg-[#0f172a] text-white relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-capy-teal/5 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-[1px] bg-capy-teal"></span>
              <span className="text-capy-teal text-xs font-bold uppercase tracking-[0.2em]">Ecosystem</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
              Featured <br/> <span className="text-gray-500">Pools</span>
            </h2>
          </div>

          {/* Custom Tabs */}
          <div className="bg-[#1e293b]/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md flex gap-1">
            {['Live', 'Upcoming', 'Ended'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  relative px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 overflow-hidden
                  ${activeTab === tab 
                    ? 'text-[#0f172a] shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {activeTab === tab && (
                  <div className="absolute inset-0 bg-gradient-to-r from-capy-teal to-capy-mint w-full h-full z-0"></div>
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
          {filteredProjects.map((project) => {
            const progress = Math.min((project.raiseAmount / project.targetAmount) * 100, 100).toFixed(2);
            
            return (
              <div 
                key={project.id} 
                className="group relative bg-[#0b1121] border border-white/5 rounded-[2rem] overflow-hidden hover:border-capy-teal/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] flex flex-col"
              >
                {/* Image & Header Overlay */}
                <div className="relative h-48 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/50 to-transparent z-10"></div>
                   <img 
                    src={project.image} 
                    alt={project.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                   />
                   
                   <div className="absolute top-4 right-4 z-20">
                      <span className={`
                        px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border shadow-lg
                        ${project.status === 'Live' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                          project.status === 'Upcoming' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                          'bg-gray-500/20 border-gray-500/30 text-gray-400'}
                      `}>
                        {project.status === 'Live' && <span className="animate-pulse mr-1">●</span>}
                        {project.status}
                      </span>
                   </div>

                   <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                      <div className="flex items-end gap-4">
                         <img 
                           src={project.image} 
                           className="w-14 h-14 rounded-xl border-2 border-[#0b1121] shadow-xl"
                         />
                         <div className="mb-1">
                           <h3 className="text-2xl font-bold text-white leading-none mb-1 group-hover:text-capy-mint transition-colors">{project.name}</h3>
                           <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{project.ticker}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Content Body */}
                <div className="p-8 pt-2 flex-1 flex flex-col">
                  <p className="text-gray-400 text-sm leading-relaxed mb-8 h-12 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Stats Grid - High End Look */}
                  <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden mb-8 border border-white/5">
                    <div className="bg-[#0b1121] p-4 group-hover:bg-[#0f172a] transition-colors">
                       <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Raised</p>
                       <p className="text-white font-mono text-sm font-bold">${project.raiseAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0b1121] p-4 group-hover:bg-[#0f172a] transition-colors">
                       <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Target</p>
                       <p className="text-gray-400 font-mono text-sm">${project.targetAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0b1121] p-4 group-hover:bg-[#0f172a] transition-colors">
                       <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Access</p>
                       <p className="text-white font-mono text-xs">{project.access}</p>
                    </div>
                    <div className="bg-[#0b1121] p-4 group-hover:bg-[#0f172a] transition-colors">
                       <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Participants</p>
                       <p className="text-capy-mint font-mono text-sm">{project.participants.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-2">
                      <span className="text-gray-500">{project.status === 'Upcoming' ? 'Starts In' : 'Progress'}</span>
                      <span className="text-white font-mono">{project.status === 'Upcoming' ? project.startsIn : `${progress}%`}</span>
                    </div>
                    
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-[1px]">
                       <div 
                         className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${project.status === 'Live' ? 'bg-gradient-to-r from-capy-darkTeal to-capy-mint' : 'bg-gray-600'}`}
                         style={{width: project.status === 'Upcoming' ? '0%' : `${progress}%`}}
                       >
                         {project.status === 'Live' && (
                           <div className="absolute inset-0 bg-white/20 animate-[marquee_1s_linear_infinite]"></div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Button */}
                <div className="p-4 bg-[#020617] border-t border-white/5">
                  <button className={`
                    w-full py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300
                    flex items-center justify-center gap-2
                    ${project.status === 'Live' 
                      ? 'bg-white text-[#0f172a] hover:bg-capy-mint hover:scale-[1.02] shadow-lg' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}>
                    {project.status === 'Live' ? 'Participate Now' : project.status === 'Upcoming' ? 'Set Reminder' : 'View Results'}
                    {project.status === 'Live' && <span>→</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};