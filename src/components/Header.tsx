import React from 'react';
import { Bus, ShieldCheck, Smartphone, Bell, Compass, LayoutDashboard, Building2, Sparkles } from 'lucide-react';
import { AppRole, Operator } from '../types';

interface HeaderProps {
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  selectedOperator: Operator;
  setSelectedOperator: (op: Operator) => void;
  operators: Operator[];
  notificationsCount: number;
  onOpenAiAdvisor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  selectedOperator,
  setSelectedOperator,
  operators,
  notificationsCount,
  onOpenAiAdvisor,
}) => {
  return (
    <header className="bg-white border-b border-[#1A1A1A] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#006633] text-white flex items-center justify-center font-serif font-black text-lg border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
              EC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-serif font-black tracking-tight text-[#1A1A1A] italic uppercase">SAFIRIAI</span>
                <span className="text-[9px] bg-[#F2EFE9] text-[#1A1A1A] border border-[#1A1A1A] px-1.5 py-0.5 font-mono font-bold uppercase tracking-widest">KENYA</span>
              </div>
              <p className="text-[9px] text-[#1A1A1A]/60 font-bold tracking-widest uppercase">
                Easy Coach Intercity ERP
              </p>
            </div>
          </div>

          {/* Center: App Switcher Tabs */}
          <nav className="hidden md:flex items-center space-x-2 bg-[#F2EFE9] p-1 border border-[#1A1A1A]">
            <button
              onClick={() => setCurrentRole('passenger')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                currentRole === 'passenger'
                  ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#006633]'
                  : 'text-[#1A1A1A] hover:bg-white/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Passenger Marketplace</span>
            </button>

            <button
              onClick={() => setCurrentRole('operator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                currentRole === 'operator'
                  ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#006633]'
                  : 'text-[#1A1A1A] hover:bg-white/80'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Fleet Admin</span>
            </button>

            <button
              onClick={() => setCurrentRole('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                currentRole === 'admin'
                  ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#006633]'
                  : 'text-[#1A1A1A] hover:bg-white/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Operator Dropdown */}
            {currentRole === 'operator' && (
              <div className="relative">
                <select
                  value={selectedOperator.id}
                  onChange={e => {
                    const found = operators.find(o => o.id === e.target.value);
                    if (found) setSelectedOperator(found);
                  }}
                  className="bg-white text-[11px] font-mono font-bold text-[#1A1A1A] border border-[#1A1A1A] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#006633]"
                >
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* M-Pesa Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#006633]/10 border border-[#006633] text-[#006633] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              <Smartphone className="w-3.5 h-3.5 text-[#006633]" />
              <span>M-PESA Direct</span>
            </div>

            {/* AI Advisor Button */}
            {onOpenAiAdvisor && (
              <button
                onClick={onOpenAiAdvisor}
                className="flex items-center space-x-1.5 bg-[#1A1A1A] hover:bg-[#006633] text-white border border-[#1A1A1A] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_#006633] transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>AI Travel Advisor</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative p-2 bg-[#F2EFE9] border border-[#1A1A1A] text-[#1A1A1A] hover:bg-white transition">
              <Bell className="w-4 h-4" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#BB0000] text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center">
                  {notificationsCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#1A1A1A]">
              <div className="w-8 h-8 bg-[#006633] text-white border border-[#1A1A1A] flex items-center justify-center font-bold text-xs">
                {currentRole === 'passenger' ? 'AM' : currentRole === 'operator' ? 'JM' : 'SA'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold leading-tight text-[#1A1A1A]">
                  {currentRole === 'passenger' ? 'Alex Metto' : currentRole === 'operator' ? 'John Maina' : 'Platform Admin'}
                </p>
                <p className="text-[9px] uppercase tracking-widest font-mono text-[#1A1A1A]/60">
                  {currentRole === 'passenger' ? 'Gold Traveler' : currentRole === 'operator' ? 'Ops Manager' : 'Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav Switcher */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest">
          <button
            onClick={() => setCurrentRole('passenger')}
            className={`px-3 py-1 border ${
              currentRole === 'passenger' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#1A1A1A] border-transparent'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setCurrentRole('operator')}
            className={`px-3 py-1 border ${
              currentRole === 'operator' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#1A1A1A] border-transparent'
            }`}
          >
            Fleet Admin
          </button>
          <button
            onClick={() => setCurrentRole('admin')}
            className={`px-3 py-1 border ${
              currentRole === 'admin' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#1A1A1A] border-transparent'
            }`}
          >
            Super Admin
          </button>
        </div>
      </div>
    </header>
  );
};

