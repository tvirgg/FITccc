import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

// Helper to generate initial chart data
const generateInitialData = () => {
  const data = [];
  let price = 0.05;
  for (let i = 0; i < 30; i++) {
    // Random walk
    price = price + (Math.random() - 0.5) * 0.005;
    if (price < 0.03) price = 0.03;
    data.push({ name: i, price });
  }
  return data;
};

export const Hero: React.FC = () => {
  // State for live data simulation
  const [chartData, setChartData] = useState(generateInitialData());
  const [raisedAmount, setRaisedAmount] = useState(392450);
  const [participants, setParticipants] = useState(4200);
  const [timeLeft, setTimeLeft] = useState({ h: 14, m: 30, s: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Chart Data (Simulate Price Movement)
      setChartData(prevData => {
        const lastPrice = prevData[prevData.length - 1].price;
        // More volatility
        const movement = (Math.random() - 0.48) * 0.003;
        let newPrice = lastPrice + movement;
        // Keep within reasonable bounds for the visual
        if (newPrice < 0.04) newPrice += 0.005;
        if (newPrice > 0.07) newPrice -= 0.005;

        const newData = [...prevData.slice(1), { name: prevData[prevData.length - 1].name + 1, price: newPrice }];
        return newData;
      });

      // 2. Simulate Fundraising (Random increments)
      if (Math.random() > 0.3) {
        setRaisedAmount(prev => {
          const increment = Math.floor(Math.random() * 150) + 10;
          return Math.min(prev + increment, 500000); // Cap at target
        });
      }

      // 3. Simulate Participants joining
      if (Math.random() > 0.8) {
        setParticipants(prev => prev + 1);
      }

      // 4. Update Timer
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) {
          s = 59;
          m--;
          if (m < 0) {
            m = 59;
            h--;
          }
        }
        return { h, m, s };
      });

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progressPercentage = Math.min((raisedAmount / 500000) * 100, 100).toFixed(2);
  const formattedRaised = raisedAmount.toLocaleString('en-US');

  // Smooth scroll handler
  const handleScrollToProjects = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="dashboard" className="relative w-full pt-32 pb-8 bg-[#0f172a] text-white overflow-hidden">

      {/* Background Decor - Deep Capy Colors */}
      <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-capy-darkTeal/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-capy-teal/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 z-10 relative">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: Platform Stats */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-6 self-start bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-capy-mint animate-pulse shadow-[0_0_10px_#92f4ef]"></span>
              <span className="text-capy-mint uppercase tracking-widest text-[10px] font-bold">Solana Network • Live</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter uppercase font-sequel mb-8">
              Stay Chill. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-capy-teal via-capy-mint to-capy-teal bg-[length:200%_auto] animate-marquee">
                Launch Big.
              </span>
            </h1>

            <p className="text-gray-400 text-xl mb-10 max-w-xl font-light leading-relaxed">
              The premier IDO launchpad for the Capybara Chill Club ecosystem. Stake NFTs, earn yield, and get early access to the most relaxed projects in DeFi.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="p-5 bg-[#020617]/50 border border-white/5 rounded-2xl backdrop-blur-sm hover:border-capy-teal/30 transition-colors group">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 group-hover:text-capy-mint transition-colors">TVL</p>
                <p className="text-3xl font-bold font-sequel text-white">$8.4M</p>
              </div>
              <div className="p-5 bg-[#020617]/50 border border-white/5 rounded-2xl backdrop-blur-sm hover:border-capy-teal/30 transition-colors group">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 group-hover:text-capy-mint transition-colors">Projects</p>
                <p className="text-3xl font-bold font-sequel text-white">14</p>
              </div>
              <div className="p-5 bg-[#020617]/50 border border-white/5 rounded-2xl backdrop-blur-sm hover:border-capy-teal/30 transition-colors group">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 group-hover:text-capy-mint transition-colors">Stakers</p>
                <p className="text-3xl font-bold font-sequel text-white">{participants.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href="#projects"
                onClick={handleScrollToProjects}
                className="cursor-pointer bg-capy-teal text-[#0f172a] px-8 py-4 rounded-xl font-bold tracking-widest uppercase hover:bg-capy-mint transition-all shadow-[0_0_20px_rgba(0,193,182,0.3)] hover:shadow-[0_0_30px_rgba(146,244,239,0.5)] transform hover:-translate-y-1 flex items-center justify-center"
              >
                View Pools
              </a>
              <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase hover:bg-white/10 transition-all">
                Buy $CHILL
              </button>
            </div>
          </div>

          {/* Right: Featured Project Card (Forge style) */}
          <div className="lg:col-span-5">
            <div className="bg-[#1e293b]/50 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-capy-teal/50 transition-colors shadow-2xl">
              {/* Glow effect behind card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-capy-teal/5 blur-3xl -z-10"></div>

              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <img
                    src="/img/idos/growth-logo-technology-software-finance-600nw-2606351741.webp"
                    alt="Project"
                    className="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-lg object-cover"
                  />
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">Growth Fly</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-capy-mint text-sm font-bold bg-capy-mint/10 px-2 py-0.5 rounded uppercase tracking-wider">$GROWTH</span>
                      <span className="text-gray-500 text-xs">AMM DEX</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Live
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {String(timeLeft.h).padStart(2, '0')}h {String(timeLeft.m).padStart(2, '0')}m {String(timeLeft.s).padStart(2, '0')}s
                  </span>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-mono">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-capy-mint font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-[#0f172a] h-3 rounded-full overflow-hidden border border-white/5 relative">
                    <div
                      className="bg-gradient-to-r from-capy-darkTeal to-capy-mint h-full rounded-full shadow-[0_0_10px_rgba(0,193,182,0.5)] transition-all duration-300 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] mt-2 text-gray-500 font-mono uppercase tracking-wider">
                    <span className="text-white">{formattedRaised} USDC</span>
                    <span>500,000 USDC</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-mono text-xl text-white">
                      {/* Simulate price flicker */}
                      0.0{Math.floor(chartData[chartData.length - 1].price * 1000)} USDC
                    </p>
                  </div>
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Participants</p>
                    <p className="font-mono text-xl text-capy-mint">{participants.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Live Chart Area */}
              <div className="h-24 w-full opacity-50 mb-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradientHero" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c1b6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00c1b6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#00c1b6"
                      strokeWidth={2}
                      fill="url(#chartGradientHero)"
                      isAnimationActive={false} // Disable standard animation to make stream smoother
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <button className="w-full bg-white text-[#0f172a] py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg flex justify-center items-center gap-2 group/btn">
                <span>Deposit USDC</span>
                <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};