import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Code2 } from 'lucide-react';

function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50"></div>

      {/* Content */}
      <div className="relative max-w-2xl w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-purple-500 rounded-full blur opacity-40"></div>
              <div className="relative bg-gray-900 p-4 rounded-full">
                <Code2 className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white ml-6">Website Builder</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-lg font-medium text-gray-300 mb-2">
                Describe your website
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your website description..."
                className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-300 placeholder-gray-500 resize-none"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 group"
            >
              <Wand2 className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
              Generate Website
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;