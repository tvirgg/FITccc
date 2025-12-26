import React, { useState } from 'react';
import { generateCapyWisdom } from '../services/geminiService';
import { ChatMessage } from '../types';

export const CapyOracle: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Greetings, fren. I am the Oracle. Ask me anything, or hand me a yuzu. 🍊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const wisdom = await generateCapyWisdom(input);
    
    setMessages(prev => [...prev, { role: 'model', text: wisdom }]);
    setLoading(false);
  };

  return (
    <section id="oracle" className="py-24 bg-capy-darkTeal relative overflow-hidden">
      {/* Background noise texture simulation */}
      <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'}}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tighter">
            Capy Oracle
          </h2>
          <p className="text-capy-light text-xl">Consult the ancient AI wisdom of the hot springs.</p>
        </div>

        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-capy-light text-capy-darkTeal rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                }`}>
                  <p className="text-lg">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-md">
                   <p className="animate-pulse">Thinking about citrus... 🍋</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/10 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for wisdom..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-colors"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-capy-mint text-capy-darkTeal px-6 py-3 rounded-full font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};