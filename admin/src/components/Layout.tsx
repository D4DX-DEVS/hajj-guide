import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  FiGrid,
  FiCompass,
  FiBookOpen,
  FiCheckSquare,
  FiHelpCircle,
  FiPhoneCall,
  FiHeadphones,
  FiSettings,
  FiArrowUpCircle,
  FiUsers,
  FiKey,
  FiTag,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { FaPray } from 'react-icons/fa';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/ritual-steps', label: 'Ritual Steps', icon: FiCompass },
  { to: '/duas', label: 'Duas', icon: FaPray },
  { to: '/guide-topics', label: 'Guide Topics', icon: FiBookOpen },
  { to: '/checklist-template', label: 'Checklist', icon: FiCheckSquare },
  { to: '/faqs', label: 'FAQ', icon: FiHelpCircle },
  { to: '/emergency-contacts', label: 'Emergency Contacts', icon: FiPhoneCall },
  { to: '/audio', label: 'Audio Library', icon: FiHeadphones },
  { to: '/categories', label: 'Categories', icon: FiTag },
  { to: '/settings', label: 'App Settings', icon: FiSettings },
  { to: '/force-update', label: 'Force Update', icon: FiArrowUpCircle },
  { to: '/users', label: 'Users', icon: FiUsers },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium min-h-[38px] transition-colors duration-150 ${
      isActive
        ? 'border-brand-400 bg-brand-500/15 text-brand-300'
        : 'border-transparent text-ink-200 hover:border-white/20 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      {navOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setNavOpen(false)} aria-hidden />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col bg-ink-900 transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          navOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/home.png" alt="Hajj &amp; Umrah Guide" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-semibold text-white">Hajj &amp; Umrah Guide</div>
              <div className="text-xs text-brand-300">Admin panel</div>
            </div>
          </div>
          <button
            className="btn-ghost min-h-[40px] min-w-[40px] p-1.5 text-ink-200 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setNavOpen(false)}>
              <item.icon aria-hidden className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          {admin?.role === 'superadmin' && (
            <NavLink to="/admins" className={linkClass} onClick={() => setNavOpen(false)}>
              <FiKey aria-hidden className="h-4 w-4 shrink-0" />
              Admins
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate text-xs text-ink-300">
            {admin?.name} · {admin?.role}
          </div>
          <button
            className="btn w-full border border-white/15 bg-transparent text-ink-100 hover:bg-white/10"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-white/10 bg-ink-900 px-4 py-3 shadow-sm md:hidden">
          <button
            className="btn-ghost min-h-[40px] min-w-[40px] p-1.5 text-ink-200 hover:bg-white/10 hover:text-white"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">Hajj &amp; Umrah Guide</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
