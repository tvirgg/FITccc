import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { TOKENOMICS_DATA, PRICE_DATA, HOLDER_DATA } from '../constants';

export const Stats: React.FC = () => {
  return (
    <section id="tokenomics" className="py-24 bg-white relative">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-capy-light -z-10"></div>

      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-bold text-center text-capy-darkTeal mb-8 uppercase tracking-tighter">
          Market Data
        </h2>
        <p className="text-center text-gray-500 mb-16 text-xl max-w-2xl mx-auto">
          Transparent analytics for the Chill Club economy.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">

          {/* Chart 1: Price History */}
          <div className="bg-white border border-gray-100 shadow-xl p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-capy-darkTeal mb-6 uppercase tracking-wider">Price Projection</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PRICE_DATA}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c1b6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00c1b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#00c1b6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Holder Growth */}
          <div className="bg-white border border-gray-100 shadow-xl p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-capy-darkTeal mb-6 uppercase tracking-wider">Holder Growth</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOLDER_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f0f0f0' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="holders" fill="#32dcd2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Tokenomics Section */}
        <div className="bg-capy-light/20 rounded-[3rem] p-8 lg:p-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            <div className="w-full lg:w-1/2">
              <h3 className="text-4xl font-bold text-capy-darkTeal mb-6 uppercase tracking-tighter">Distribution</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                The $CCC supply is carefully allocated to ensure long-term sustainability and community rewards.
                Liquidity is locked, and team tokens are vested over 12 months.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {TOKENOMICS_DATA.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }}></span>
                    <span className="font-bold text-gray-800">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-1/2 h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TOKENOMICS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {TOKENOMICS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#000', fontFamily: 'Space Grotesk' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};