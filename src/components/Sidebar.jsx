import React from "react";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  PhoneCall,
  Settings,
  X,
  HeartPulse,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar({
  activeTab = "dashboard",
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onLogout
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "survey", label: "Symptom Survey", icon: FileText },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "reports", label: "Medical Reports", icon: FileText },
    { id: "contact", label: "Contact Us", icon: PhoneCall },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 transition-colors duration-300">
      {/* Brand Header: Solid color, no gradients, no "PRO" badge */}
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
              Nuri
            </span>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
              Patient Vitals Station
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List: Clean, quiet, solid active highlight */}
      <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-zinc-900" : "text-slate-400 dark:text-zinc-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Muted Switch Role / Logout and Compliance Note */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
        {onLogout ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit / Logout</span>
          </button>
        ) : (
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit / Switch User</span>
          </Link>
        )}

        {/* Quiet compliance text (no loud badges) */}
        <div className="text-[11px] text-slate-400 dark:text-zinc-500 text-center leading-tight">
          HIPAA Compliant • 256-Bit Encrypted
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
