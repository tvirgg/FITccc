import React from 'react';
import { NFT_IMAGES } from '../constants';

export const NFTShowcase: React.FC = () => {
  return (
    <section id="collection" className="pb-24 pt-12 bg-gradient-to-b from-[#020617] to-[#0f172a] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-capy-teal/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Unified Header Block */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-block px-3 py-1 border border-capy-teal/30 rounded-full bg-capy-teal/5 text-capy-mint text-[10px] uppercase tracking-widest font-bold mb-8">
            Sold Out • Est. 2024
          </div>

          <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter text-white mb-8 leading-none">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-capy-teal to-capy-mint">The Club</span>
          </h1>

          <p className="text-xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto">
            We built the most relaxed ecosystem in DeFi. Now we are expanding to the physical world with high yields, low stress, and a community that values vibes over volatility. The collection consists of 1,000 unique Capybaras living on the Solana blockchain—each one acting as a VIP ticket to the Chill Club ecosystem, granting exclusive access to IDOs and staking rewards.
          </p>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {NFT_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className={`group relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 hover:scale-105 hover:border-capy-teal/50 hover:shadow-[0_0_30px_rgba(0,193,182,0.2)]
                ${idx % 2 === 0 ? 'md:translate-y-8' : ''}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                <span className="text-capy-mint font-bold uppercase tracking-widest text-xs mb-1">
                  Chill Capy
                </span>
                <span className="text-white font-bold text-lg">
                  #{2024 + idx}
                </span>
              </div>
              <img
                src={img}
                alt={`Capybara Chill Club NFT #${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          ))}
        </div>


      </div>
    </section>
  );
};