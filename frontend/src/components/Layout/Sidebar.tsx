import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, AlertTriangle, Clock, 
  FileText, GitCompare, Bot, Bell, Share2 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Nearby Wells', path: '/nearby-wells', icon: MapPin },
  { name: 'Risk Analysis', path: '/risk-analysis', icon: AlertTriangle },
  { name: 'Historical Events', path: '/events', icon: Clock },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Well Comparison', path: '/compare', icon: GitCompare },
  { name: 'AI Drilling Copilot', path: '/copilot', icon: Bot },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Knowledge Graph', path: '/search', icon: Share2 },
];

export const Sidebar = () => {
  return (
    <aside className="w-[250px] bg-secondary border-r border-border h-screen flex flex-col fixed left-0 top-0 pt-14">
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-tertiary hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
