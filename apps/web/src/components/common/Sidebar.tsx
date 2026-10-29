import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  CreditCard,
  CheckSquare,
  ShoppingCart,
  Wrench,
  UserCheck,
  Megaphone,
  CalendarDays,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, badge: null },
    { label: 'Expenses & Splits', to: '/expenses', icon: Receipt, badge: 'Smart' },
    { label: 'Settlements', to: '/settlements', icon: Scale, badge: 'AI Opt' },
    { label: 'Bills & Rent', to: '/bills', icon: CreditCard, badge: null },
    { label: 'Chores Scheduler', to: '/chores', icon: CheckSquare, badge: null },
    { label: 'Shared Groceries', to: '/groceries', icon: ShoppingCart, badge: 'Live' },
    { label: 'Maintenance', to: '/maintenance', icon: Wrench, badge: null },
    { label: 'Visitor Log', to: '/visitors', icon: UserCheck, badge: null },
    { label: 'Announcements', to: '/announcements', icon: Megaphone, badge: null },
    { label: 'Shared Calendar', to: '/calendar', icon: CalendarDays, badge: null },
    { label: 'Flat Settings', to: '/settings', icon: Settings, badge: null },
  ];

  return (
    <aside
      className={`w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/90 flex flex-col justify-between py-5 px-3 select-none ${className}`}
    >
      <div className="space-y-1">
        <div className="px-3 pb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Household Modules
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-sm shadow-indigo-500/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Shared Household Status Badge */}
      <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-cyan-50/80 border border-indigo-100/80">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Household In Sync</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
          Realtime active. All expenses, chores & groceries sync across roommates automatically.
        </p>
      </div>
    </aside>
  );
};
