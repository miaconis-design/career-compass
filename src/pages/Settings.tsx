import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Key, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { apiKey, setApiKey } = useStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(inputKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-xs sm:text-sm">Configure your preferences and API credentials.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-200/80 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Key className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Google Gemini API Key</h2>
            <p className="text-xs sm:text-sm text-gray-500">Powers the AI evaluation engine and resume parser.</p>
          </div>
        </div>

        {/* Step-by-Step Guide with Direct Link */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white rounded-2xl p-5 border border-indigo-100/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>How to get a Free Gemini API Key</span>
            </h3>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-3.5 py-1.5 rounded-full border border-indigo-200 shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
            >
              <span>Get API Key</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <ol className="space-y-2 text-xs text-indigo-950/80 list-decimal list-inside leading-relaxed">
            <li>
              Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900">Google AI Studio API Keys</a> and sign in with your Google account.
            </li>
            <li>
              Click the blue <span className="font-semibold text-indigo-900">"Create API key"</span> button.
            </li>
            <li>
              Select an existing Google Cloud project or choose <span className="font-semibold text-indigo-900">"Create key in new project"</span> (free tier requires no billing setup).
            </li>
            <li>
              Copy your generated key (starts with <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-700 border border-indigo-100">AIzaSy...</code>) and paste it below.
            </li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-mono"
            />
            <p className="mt-2 text-xs text-gray-400">
              🔒 Your key is saved locally in your browser's private storage and is never exposed or sent anywhere else.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-xs hover:shadow-sm cursor-pointer"
          >
            {saved ? (
              <span>Key saved successfully ✅</span>
            ) : (
              <span>Save key 💾</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
