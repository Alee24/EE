import React, { useState } from 'react';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  PieChart,
  ShieldAlert,
  Settings,
  Layers,
  CheckCircle2,
  Plus,
  Search,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Operator, Booking } from '../../types';

interface SuperAdminDashboardProps {
  operators: Operator[];
  bookings: Booking[];
  onAddOperator?: (newOp: Operator) => void;
  onToggleOperatorStatus?: (id: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  operators,
  bookings,
  onAddOperator,
  onToggleOperatorStatus,
}) => {
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperatorDetail, setSelectedOperatorDetail] = useState<Operator | null>(null);

  // New Operator Form State
  const [opName, setOpName] = useState('');
  const [opCode, setOpCode] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opBuses, setOpBuses] = useState('25');
  const [opCommission, setOpCommission] = useState('6.5');
  const [opSuccessMessage, setOpSuccessMessage] = useState(false);

  // Filtered operators
  const filteredOperators = operators.filter(
    op =>
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName || !opCode) return;

    const newOp: Operator = {
      id: `OP-${Date.now()}`,
      name: opName,
      code: opCode.toUpperCase(),
      commissionRate: parseFloat(opCommission) / 100 || 0.065,
      rating: 4.8,
      contactEmail: opEmail || `${opCode.toLowerCase()}@transport.co.ke`,
      contactPhone: opPhone || '+254 700 000 000',
      activeBusesCount: parseInt(opBuses) || 20,
      totalTripsCount: 150,
      monthlyRevenueKsh: 1250000,
    };

    if (onAddOperator) {
      onAddOperator(newOp);
    }

    setOpSuccessMessage(true);
    setTimeout(() => {
      setOpSuccessMessage(false);
      setIsOnboardModalOpen(false);
      setOpName('');
      setOpCode('');
      setOpEmail('');
      setOpPhone('');
    }, 1500);
  };

  const totalBookingsCount = bookings.length > 0 ? bookings.length * 280 : 24532;
  const totalRevenueKsh = bookings.reduce((acc, b) => acc + b.totalAmountKsh, 0) * 120 || 38600000;
  const totalCommissionKsh = Math.round(totalRevenueKsh * 0.062);

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1A1A] text-white p-8 border border-[#1A1A1A] shadow-[4px_4px_0px_#006633]">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#006633] text-white border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Multi-Tenant SaaS Transport Admin</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif italic text-white leading-tight">
            Super Admin <span className="not-italic font-sans text-[#F2EFE9] text-xl px-2">Platform Overview</span>
          </h1>
          <p className="text-slate-300 text-xs mt-2 font-sans leading-relaxed">
            Global monitoring across {operators.length} registered Kenyan transport operators, platform commissions & AI infrastructure.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="bg-[#006633] hover:bg-[#004d26] text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 border border-black shadow-[2px_2px_0px_#ffffff] transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Bus Operator</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid matching reference screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] space-y-2">
          <span className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest block">Total Operators</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif italic font-bold text-[#1A1A1A]">{operators.length}</span>
            <span className="text-[10px] font-bold text-[#006633] bg-[#006633]/10 border border-[#006633]/20 px-2 py-0.5 uppercase tracking-widest">+2 this month</span>
          </div>
          <span className="text-[9px] text-[#1A1A1A]/60 font-mono">Easy Coach, Modern Coast, etc.</span>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] space-y-2">
          <span className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest block">Total Bookings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif italic font-bold text-[#1A1A1A]">{totalBookingsCount.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-[#006633] bg-[#006633]/10 border border-[#006633]/20 px-2 py-0.5 uppercase tracking-widest">+18.4%</span>
          </div>
          <span className="text-[9px] text-[#1A1A1A]/60 font-mono">Across all {operators.length} operators</span>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] space-y-2">
          <span className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest block">Total Revenue</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif italic font-bold text-[#1A1A1A]">KSh {(totalRevenueKsh / 1000000).toFixed(1)}M</span>
            <span className="text-[10px] font-bold text-[#006633] bg-[#006633]/10 border border-[#006633]/20 px-2 py-0.5 uppercase tracking-widest">+21.7%</span>
          </div>
          <span className="text-[9px] text-[#1A1A1A]/60 font-mono">Gross tickets processed</span>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] space-y-2">
          <span className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest block">Platform Commission</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif italic font-bold text-[#006633]">KSh {(totalCommissionKsh / 1000000).toFixed(1)}M</span>
            <span className="text-[10px] font-bold text-[#006633] bg-[#006633]/10 border border-[#006633]/20 px-2 py-0.5 uppercase tracking-widest">6.2% avg</span>
          </div>
          <span className="text-[9px] text-[#1A1A1A]/60 font-mono">Net platform intake</span>
        </div>
      </div>

      {/* Operator Directory Table */}
      <div className="bg-white p-6 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A1A1A]/10 pb-4">
          <div>
            <h3 className="font-serif italic font-bold text-[#1A1A1A] text-xl">Onboarded Transport Operators</h3>
            <p className="text-xs text-slate-500">Manage tenant companies, commission rates & active bus allocations</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company name or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#F2EFE9] border border-[#1A1A1A] rounded-none pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#006633] w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1A1A1A] text-[#1A1A1A] uppercase font-mono font-bold text-[10px]">
                <th className="py-3 px-2">Company Name</th>
                <th className="py-3 px-2">Code</th>
                <th className="py-3 px-2">Active Fleet</th>
                <th className="py-3 px-2">Commission %</th>
                <th className="py-3 px-2">Monthly Revenue</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10 font-medium text-slate-800">
              {filteredOperators.map(op => (
                <tr key={op.id} className="hover:bg-[#F2EFE9]/50 transition">
                  <td className="py-3 px-2 font-bold text-[#1A1A1A] flex items-center space-x-2">
                    <div className="w-7 h-7 bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                      {op.code}
                    </div>
                    <span>{op.name}</span>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-600">{op.code}</td>
                  <td className="py-3 px-2 font-mono font-bold">{op.activeBusesCount} Buses</td>
                  <td className="py-3 px-2 font-mono text-[#006633] font-bold">{(op.commissionRate * 100).toFixed(1)}%</td>
                  <td className="py-3 px-2 font-mono font-bold">KSh {(op.monthlyRevenueKsh || 1850000).toLocaleString()}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 border text-[9px] font-mono uppercase font-bold ${
                        op.activeBusesCount > 0
                          ? 'bg-[#006633]/10 text-[#006633] border-[#006633]/30'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {op.activeBusesCount > 0 ? 'ACTIVE TENANT' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      onClick={() => setSelectedOperatorDetail(op)}
                      className="bg-[#1A1A1A] text-white font-mono text-[10px] px-2.5 py-1 uppercase font-bold hover:bg-slate-800 transition"
                    >
                      View
                    </button>
                    {onToggleOperatorStatus && (
                      <button
                        onClick={() => onToggleOperatorStatus(op.id)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-mono text-[10px] px-2.5 py-1 uppercase font-bold border border-black shadow-[1px_1px_0px_#1A1A1A] transition"
                      >
                        {op.activeBusesCount > 0 ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Grid: Bookings by Route & Top Operators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookings by Route Distribution */}
        <div className="bg-white p-6 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
          <h3 className="font-serif italic font-bold text-[#1A1A1A] text-lg border-b border-[#1A1A1A] pb-2">Route Distribution</h3>

          <div className="space-y-3 text-xs font-semibold">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-serif text-sm">Nairobi – Mombasa</span>
                <span className="font-mono font-bold text-[#1A1A1A]">35%</span>
              </div>
              <div className="w-full h-2 bg-[#F2EFE9] border border-[#1A1A1A] overflow-hidden">
                <div className="h-full bg-[#1A1A1A] w-[35%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-serif text-sm">Nairobi – Kisumu</span>
                <span className="font-mono font-bold text-[#1A1A1A]">24%</span>
              </div>
              <div className="w-full h-2 bg-[#F2EFE9] border border-[#1A1A1A] overflow-hidden">
                <div className="h-full bg-[#006633] w-[24%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-serif text-sm">Nairobi – Eldoret</span>
                <span className="font-mono font-bold text-[#1A1A1A]">15%</span>
              </div>
              <div className="w-full h-2 bg-[#F2EFE9] border border-[#1A1A1A] overflow-hidden">
                <div className="h-full bg-amber-600 w-[15%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-serif text-sm">Nairobi – Nakuru</span>
                <span className="font-mono font-bold text-[#1A1A1A]">10%</span>
              </div>
              <div className="w-full h-2 bg-[#F2EFE9] border border-[#1A1A1A] overflow-hidden">
                <div className="h-full bg-slate-600 w-[10%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Operators Leaderboard */}
        <div className="bg-white p-6 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
          <h3 className="font-serif italic font-bold text-[#1A1A1A] text-lg border-b border-[#1A1A1A] pb-2">Top Operators by Bookings</h3>

          <div className="space-y-3 text-xs font-medium text-[#1A1A1A]">
            {operators.slice(0, 5).map((op, idx) => (
              <div key={op.id} className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]/10">
                <span className="font-bold text-[#1A1A1A]">{idx + 1}. {op.name}</span>
                <span className="font-mono font-bold text-[#006633]">{(op.totalTripsCount * 45 || 6842).toLocaleString()} bookings</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform AI Insights Box matching reference screenshot */}
        <div className="bg-[#F2EFE9] p-6 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-3">
          <div className="flex items-center space-x-2 text-[#006633] font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Platform Intelligence</span>
          </div>

          <ul className="space-y-2 text-xs text-[#1A1A1A] font-medium leading-relaxed">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-[#BB0000] mt-1.5 flex-shrink-0" />
              <span>Weekend demand expected to surge by 32% across all routes.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-[#006633] mt-1.5 flex-shrink-0" />
              <span>Mombasa route records highest growth (+24% month-on-month).</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-amber-600 mt-1.5 flex-shrink-0" />
              <span>Friday evening departure slots at 98% average occupancy.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-[#1A1A1A] mt-1.5 flex-shrink-0" />
              <span>AI recommends dispatching 4 additional units on Nairobi – Kisumu.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Onboard Bus Operator Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#006633] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h3 className="font-serif italic font-bold text-[#1A1A1A] text-lg">Onboard Bus Operator</h3>
              <button onClick={() => setIsOnboardModalOpen(false)} className="text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {opSuccessMessage ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-[#006633] text-white flex items-center justify-center mx-auto border border-black shadow-[2px_2px_0px_#1A1A1A]">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-serif italic font-bold text-[#1A1A1A] text-base">Operator Successfully Onboarded!</h4>
                <p className="text-xs font-mono text-slate-600">{opName} ({opCode}) is now live on the SaaS platform.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOperator} className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Climax Coaches Ltd"
                    value={opName}
                    onChange={e => setOpName(e.target.value)}
                    className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Code Prefix</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CC"
                      maxLength={4}
                      value={opCode}
                      onChange={e => setOpCode(e.target.value)}
                      className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono font-bold uppercase focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Commission Rate %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={opCommission}
                      onChange={e => setOpCommission(e.target.value)}
                      className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@climaxcoaches.co.ke"
                    value={opEmail}
                    onChange={e => setOpEmail(e.target.value)}
                    className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+254 712 345 678"
                      value={opPhone}
                      onChange={e => setOpPhone(e.target.value)}
                      className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono font-bold uppercase text-[10px] text-[#1A1A1A] mb-1">Initial Bus Units</label>
                    <input
                      type="number"
                      value={opBuses}
                      onChange={e => setOpBuses(e.target.value)}
                      className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsOnboardModalOpen(false)}
                    className="px-4 py-2 bg-[#F2EFE9] text-[#1A1A1A] border border-[#1A1A1A] text-xs font-mono font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#006633] text-white border border-black font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#1A1A1A]"
                  >
                    Save & Onboard
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Operator Details Drawer Modal */}
      {selectedOperatorDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#006633] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#1A1A1A] text-white font-mono font-bold text-xs flex items-center justify-center">
                  {selectedOperatorDetail.code}
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-[#1A1A1A] text-lg">{selectedOperatorDetail.name}</h3>
                  <p className="text-[10px] font-mono text-slate-500">Tenant ID: {selectedOperatorDetail.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOperatorDetail(null)} className="text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#F2EFE9] p-3 border border-[#1A1A1A]">
                <span className="text-[9px] uppercase text-slate-500 block">Active Buses</span>
                <span className="text-base font-bold text-[#1A1A1A]">{selectedOperatorDetail.activeBusesCount} Units</span>
              </div>
              <div className="bg-[#F2EFE9] p-3 border border-[#1A1A1A]">
                <span className="text-[9px] uppercase text-slate-500 block">Commission Rate</span>
                <span className="text-base font-bold text-[#006633]">{(selectedOperatorDetail.commissionRate * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-[#F2EFE9] p-3 border border-[#1A1A1A]">
                <span className="text-[9px] uppercase text-slate-500 block">Contact Email</span>
                <span className="text-xs font-bold text-[#1A1A1A] truncate block">{selectedOperatorDetail.contactEmail}</span>
              </div>
              <div className="bg-[#F2EFE9] p-3 border border-[#1A1A1A]">
                <span className="text-[9px] uppercase text-slate-500 block">Contact Phone</span>
                <span className="text-xs font-bold text-[#1A1A1A]">{selectedOperatorDetail.contactPhone}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A1A1A] flex justify-end">
              <button
                onClick={() => setSelectedOperatorDetail(null)}
                className="px-5 py-2 bg-[#1A1A1A] text-white font-mono text-xs font-bold uppercase"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


