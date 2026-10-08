import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Compass, Search, LayoutDashboard, User, Settings as SettingsIcon, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluateJob from './pages/EvaluateJob';
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TutorialModal from './components/TutorialModal';

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Left: Brand */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                CareerCompass
              </span>
            </div>
            
            {/* Center: Desktop Navigation Bar */}
            <div className="hidden lg:flex flex-1 justify-center">
              <nav className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-full">
                <NavTab to="/evaluate" icon={<Search className="w-4 h-4" />} label="Evaluate Job" />
                <NavTab to="/tracker" icon={<LayoutDashboard className="w-4 h-4" />} label="Tracker" />
                <NavTab to="/profile" icon={<User className="w-4 h-4" />} label="My Profile" />
                <NavTab to="/settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
              </nav>
            </div>

            {/* Right: Desktop Text button */}
            <div className="hidden lg:flex min-w-[140px] justify-end">
              <button
                onClick={() => setShowTutorial(true)}
                className="text-xs md:text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-gray-100/60 cursor-pointer"
                title="View how CareerCompass works"
              >
                <span>How it works 💡</span>
              </button>
            </div>

            {/* Mobile / Tablet: Hamburger Button */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile / Tablet Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs cursor-pointer"
              />

              {/* Drawer Sheet */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col justify-between p-6 border-l border-gray-100 overflow-y-auto"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Navigation</span>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label="Close navigation menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Section Links */}
                  <nav className="space-y-1.5">
                    <DrawerNavLink
                      to="/evaluate"
                      icon={<Search className="w-5 h-5" />}
                      label="Evaluate Job"
                      onClick={() => setDrawerOpen(false)}
                    />
                    <DrawerNavLink
                      to="/tracker"
                      icon={<LayoutDashboard className="w-5 h-5" />}
                      label="Tracker"
                      onClick={() => setDrawerOpen(false)}
                    />
                    <DrawerNavLink
                      to="/profile"
                      icon={<User className="w-5 h-5" />}
                      label="My Profile"
                      onClick={() => setDrawerOpen(false)}
                    />
                    <DrawerNavLink
                      to="/settings"
                      icon={<SettingsIcon className="w-5 h-5" />}
                      label="Settings"
                      onClick={() => setDrawerOpen(false)}
                    />
                  </nav>
                </div>

                {/* Drawer Footer with How it works */}
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowTutorial(true);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span>How it works</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </button>

                  <p className="text-[11px] text-gray-400 text-center font-medium">
                    Private &amp; local browser storage
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/evaluate" replace />} />
            <Route path="/evaluate" element={<EvaluateJob />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      </div>
    </Router>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          isActive
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function DrawerNavLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-100'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`
      }
    >
      <span className="text-indigo-500">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
