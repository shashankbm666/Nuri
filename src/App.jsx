import React, { useState, useEffect } from 'react';
import { initialPatient } from './data/mockData';
import { fetchVitalsReading } from './services/vitalsService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PatientProfile from './components/PatientProfile';
import StartReadingBtn from './components/StartReadingBtn';
import VitalsGrid from './components/VitalsGrid';
import {
  Calendar,
  FileText,
  PhoneCall,
  Settings,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [patient] = useState(initialPatient);
  const [latestReading, setLatestReading] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync dark mode class on HTML document for Tailwind CSS
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleStartReading = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const reading = await fetchVitalsReading();
      setLatestReading(reading);
      setIsCapturing(false);

      // Trigger toast confirmation
      setNotification({
        title: 'Telemetry Sync Complete',
        message: `Vitals recorded: HR ${reading.heartRate} bpm, SpO2 ${reading.spO2}%, Temp ${reading.temperature}°C (${reading.status})`
      });

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to capture vitals reading:', err);
      setIsCapturing(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-300 font-sans">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-64 xl:pl-72 min-w-0">
          {/* Top Bar Header */}
          <Header
            onOpenMobileMenu={() => setMobileOpen(true)}
            patient={patient}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          {/* Toast Notification Banner */}
          {notification && (
            <div className="mx-4 sm:mx-8 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <strong className="font-semibold">{notification.title}:</strong>{' '}
                  <span>{notification.message}</span>
                </div>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Body Dashboard Content */}
          <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <>
                {/* 1. Patient Profile Section */}
                <PatientProfile patient={patient} />

                {/* 2. Start Reading Action Section */}
                <StartReadingBtn
                  onStartReading={handleStartReading}
                  isCapturing={isCapturing}
                />

                {/* 3. Live Telemetry Vitals Grid */}
                <VitalsGrid
                  latestReading={latestReading}
                  isCapturing={isCapturing}
                />
              </>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scheduled Appointments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  OPD Pre-Consultation Session is queued. Your doctor will review your captured vitals shortly.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Medical Reports
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Diagnostic reports and physician summary notes will appear here automatically following your OPD consultation session.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending doctor assessment</span>
                </div>
                <div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-2 px-5 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition shadow-sm cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinic & Helpdesk Contact</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  OPD Reception Helpdesk: Ext. 1001 • Telehealth Support: help@nurihealth.io
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Settings</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Telemetry sampling rate, IoT calibration parameters, and security credentials.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
