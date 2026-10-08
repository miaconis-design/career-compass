import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Key, User, Search, LayoutDashboard, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Connect your free AI key',
    emoji: '🔑',
    route: '/settings',
    badge: 'Step 1 of 4',
    icon: Key,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    description:
      'CareerCompass uses Google Gemini to read resumes, screenshots, PDFs, and generate honest job match scorecards.',
    points: [
      'Takes 30 seconds at Google AI Studio.',
      'Completely free tier with no billing required.',
      'Your key is stored locally in your browser and never shared.',
    ],
    actionText: 'Go to Settings',
    externalLink: {
      label: 'Open Google AI Studio',
      url: 'https://aistudio.google.com/app/apikey',
    },
  },
  {
    step: 2,
    title: 'Add your profile & preferences',
    emoji: '📄',
    route: '/profile',
    badge: 'Step 2 of 4',
    icon: User,
    iconColor: 'text-violet-600 bg-violet-50 border-violet-200',
    description:
      'Upload your CV, resume, or portfolio highlights. You can also write down extra details that matter for your search.',
    points: [
      'Upload PDF, Word doc, image screenshot, or text.',
      'AI automatically extracts your skills and accomplishments.',
      'Add target roles, visa status, or remote preferences to tailor the evaluation.',
    ],
    actionText: 'Go to My Profile',
  },
  {
    step: 3,
    title: 'Drop any job to evaluate',
    emoji: '✨',
    route: '/evaluate',
    badge: 'Step 3 of 4',
    icon: Search,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description:
      'Found a role on LinkedIn, Indeed, or a company site? Drop a screenshot, PDF, or text into "Evaluate Job".',
    points: [
      'Instant match score (0–100%) and fit verdict (Strong Fit / Stretch / Low Fit).',
      'Breaks down key strengths and bridgeable skill gaps.',
      'Click "Save for later 📌" if you want to apply later, or "Already applied 🚀" to track immediately.',
    ],
    actionText: 'Go to Evaluate Job',
  },
  {
    step: 4,
    title: 'Track & organize your pipeline',
    emoji: '📊',
    route: '/tracker',
    badge: 'Step 4 of 4',
    icon: LayoutDashboard,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description:
      'Keep all your opportunities organized on an intuitive Kanban board.',
    points: [
      'New "Saved Jobs" column keeps roles you plan to apply to organized.',
      'Drag cards across columns as you advance to interviews and offers.',
      'Click any card to write custom notes and attach tailored resumes or cover letters.',
    ],
    actionText: 'Go to Tracker',
  },
];

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const stepData = STEPS[currentStep];
  const StepIcon = stepData.icon;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 via-white to-indigo-50/30">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h2 className="text-base font-bold text-gray-900">How it works</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                {stepData.badge}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              title="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 text-xl shadow-2xs ${stepData.iconColor}`}
              >
                <span>{stepData.emoji}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {stepData.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {stepData.description}
                </p>
              </div>
            </div>

            {/* Bullet Highlights */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2.5">
              {stepData.points.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* Quick Links / Shortcuts for this step */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => handleNavigate(stepData.route)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/60 transition-colors cursor-pointer"
              >
                <StepIcon className="w-3.5 h-3.5" />
                {stepData.actionText}
                <ArrowRight className="w-3 h-3" />
              </button>

              {stepData.externalLink && (
                <a
                  href={stepData.externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-2xs transition-colors"
                >
                  {stepData.externalLink.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-t border-gray-100">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentStep
                      ? 'w-6 bg-indigo-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200/50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Got it! 🚀
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
