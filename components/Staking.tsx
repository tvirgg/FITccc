import React from 'react';
import { STAKING_TIERS } from '../constants';

export const Staking: React.FC = () => {
  return (
    <section id="staking" className="py-20 bg-[#0f172a] text-white relative border-t border-white/5">
       <div className="absolute inset-0 bg-capy-mint/5" style={{clipPath: 'polygon(0 0, 100% 10%, 100% 100%, 0% 100%)'}}></div>

       <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
             <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4">NFT Staking Utility</h2>
             <p className="text-gray-400 text-lg">
               Stake your Capybara Chill Club NFTs to unlock tiers. Higher tiers get guaranteed allocations in IDOs.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {STAKING_TIERS.map((tier, idx) => (
                <div key={idx} className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/10 p-1 rounded-3xl relative hover:-translate-y-2 transition-transform duration-300">
                   {/* Gradient Border Glow */}
                   <div className="bg-[#1e293b] rounded-[22px] overflow-hidden h-full flex flex-col">
                      <div className="h-40 bg-black/50 relative">
                         <img src={tier.image} alt={tier.name} className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
                         <div className="absolute bottom-4 left-4">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-widest">{tier.name}</h3>
                            <span className="text-capy-mint text-sm font-bold uppercase">Tier {idx + 1}</span>
                         </div>
                      </div>
                      
                      <div className="p-8 flex-1 flex flex-col">
                         <div className="mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Requirement</p>
                            <p className="text-xl font-bold text-white">{tier.requirement}</p>
                         </div>
                         
                         <div className="space-y-3 mb-8 flex-1">
                            {tier.benefits.map((benefit, bIdx) => (
                               <div key={bIdx} className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-capy-teal/20 flex items-center justify-center text-capy-mint text-xs">✓</div>
                                  <span className="text-gray-300 text-sm">{benefit}</span>
                               </div>
                            ))}
                         </div>

                         <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center mb-6">
                            <span className="text-gray-400 text-xs uppercase">Allocation</span>
                            <span className="text-white font-bold">{tier.allocation}</span>
                         </div>

                         <button className="w-full py-3 border border-capy-teal text-capy-teal hover:bg-capy-teal hover:text-white font-bold uppercase tracking-widest rounded-lg transition-all">
                            Stake Now
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </section>
  );
};