import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Bus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Fuel,
  Wrench,
  Sparkles,
  MapPin,
  Bot,
  Send,
  Plus,
  ShieldCheck,
  Building,
  CreditCard,
  PieChart,
  Clock,
  Layers,
  ChevronRight,
  Search,
  X,
  Check,
  QrCode,
  Printer,
  Gauge,
  Star,
  UserPlus,
  Filter,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  Operator,
  Trip,
  Vehicle,
  Driver,
  Conductor,
  Booking,
  MaintenanceRecord,
  FuelLog,
  Terminal,
  Seat
} from '../../types';
import { confirmTerminalCash, askBusinessAnalyst } from '../../services/api';

interface OperatorDashboardProps {
  selectedOperator: Operator;
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  conductors: Conductor[];
  bookings: Booking[];
  terminals: Terminal[];
  maintenanceRecords: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  onCashConfirmed: (bookingId: string) => void;
  onAddTrip?: (newTrip: Trip) => void;
  onUpdateTripStatus?: (tripId: string, newStatus: Trip['status'], delayMins?: number) => void;
  onAddVehicle?: (newVehicle: Vehicle) => void;
  onUpdateVehicleStatus?: (vehicleId: string, status: Vehicle['status']) => void;
  onAddDriver?: (newDriver: Driver) => void;
  onAddConductor?: (newConductor: Conductor) => void;
  onAddBookingOffline?: (newBooking: Booking, tripId: string, seatNumbers: string[]) => void;
  onAddMaintenance?: (newRecord: MaintenanceRecord) => void;
  onAddFuelLog?: (newLog: FuelLog) => void;
  onBoardingStatusChange?: (bookingId: string, status: Booking['boardingStatus']) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  selectedOperator,
  trips,
  vehicles,
  drivers,
  conductors,
  bookings,
  terminals,
  maintenanceRecords,
  fuelLogs,
  onCashConfirmed,
  onAddTrip,
  onUpdateTripStatus,
  onAddVehicle,
  onUpdateVehicleStatus,
  onAddDriver,
  onAddConductor,
  onAddBookingOffline,
  onAddMaintenance,
  onAddFuelLog,
  onBoardingStatusChange,
}) => {
  // Sidebar Navigation
  const [activeModule, setActiveModule] = useState<
    | 'dashboard'
    | 'trips'
    | 'bookings'
    | 'fleet'
    | 'drivers'
    | 'terminals'
    | 'reconciliation'
    | 'maintenance'
    | 'ai_analyst'
  >('dashboard');

  // Modal Control States
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isNewDriverModalOpen, setIsNewDriverModalOpen] = useState(false);
  const [isOfflineBookingModalOpen, setIsOfflineBookingModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [selectedTripManifest, setSelectedTripManifest] = useState<Trip | null>(null);
  const [selectedTripDelayModal, setSelectedTripDelayModal] = useState<Trip | null>(null);
  const [selectedBookingQRModal, setSelectedBookingQRModal] = useState<Booking | null>(null);

  // Sub-tab States
  const [driversSubTab, setDriversSubTab] = useState<'drivers' | 'conductors'>('drivers');
  const [maintenanceSubTab, setMaintenanceSubTab] = useState<'maintenance' | 'fuel'>('maintenance');
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(terminals[0]?.id || 'TERM-01');

  // Filters
  const [tripsSearchQuery, setTripsSearchQuery] = useState('');
  const [tripsStatusFilter, setTripsStatusFilter] = useState<string>('ALL');
  const [bookingsSearchQuery, setBookingsSearchQuery] = useState('');
  const [bookingsPaymentFilter, setBookingsPaymentFilter] = useState<string>('ALL');

  // Form States - New Trip
  const [tripOrigin, setTripOrigin] = useState('Nairobi (Afya Centre)');
  const [tripDestination, setTripDestination] = useState('Mombasa (Mwembe Tayari)');
  const [tripVehicleReg, setTripVehicleReg] = useState(vehicles[0]?.registrationNumber || 'KDA 123A');
  const [tripDriverId, setTripDriverId] = useState(drivers[0]?.id || 'DRV-01');
  const [tripConductorId, setTripConductorId] = useState(conductors[0]?.id || 'CND-01');
  const [tripDepartureTime, setTripDepartureTime] = useState('08:00 AM');
  const [tripDepartureDate, setTripDepartureDate] = useState('2026-08-10');
  const [tripFare, setTripFare] = useState('1500');

  // Form States - New Vehicle
  const [vehReg, setVehReg] = useState('');
  const [vehFleet, setVehFleet] = useState('');
  const [vehModel, setVehModel] = useState('Scania F360 (2024)');
  const [vehCapacity, setVehCapacity] = useState('49');
  const [vehSeatType, setVehSeatType] = useState<'2x2_standard' | '2x1_vip'>('2x2_standard');

  // Form States - New Driver
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLicense, setDrvLicense] = useState('');
  const [drvAssignedBus, setDrvAssignedBus] = useState(vehicles[0]?.registrationNumber || 'KDA 123A');

  // Form States - Offline Ticket
  const [offlineTripId, setOfflineTripId] = useState(trips[0]?.id || 'EC1001');
  const [offlineName, setOfflineName] = useState('');
  const [offlinePhone, setOfflinePhone] = useState('');
  const [offlineSeat, setOfflineSeat] = useState('12A');
  const [offlinePayment, setOfflinePayment] = useState<'CASH_TERMINAL' | 'MPESA'>('CASH_TERMINAL');

  // Form States - Delay Reporting
  const [delayMinsInput, setDelayMinsInput] = useState('25');

  // Form States - Maintenance
  const [maintReg, setMaintReg] = useState(vehicles[0]?.registrationNumber || 'KDA 123A');
  const [maintType, setMaintType] = useState<'Oil Change' | 'Brake Service' | 'Tire Replacement' | 'Engine Overhaul' | 'AC Repair'>('Brake Service');
  const [maintCost, setMaintCost] = useState('18500');
  const [maintGarage, setMaintGarage] = useState('Scania Kenya Service Workshop');
  const [maintNotes, setMaintNotes] = useState('Routine 50,000 km brake pad & rotor inspection');

  // Form States - Fuel
  const [fuelReg, setFuelReg] = useState(vehicles[0]?.registrationNumber || 'KDA 123A');
  const [fuelLiters, setFuelLiters] = useState('180');
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState('215');
  const [fuelStation, setFuelStation] = useState('TotalEnergies Westlands');
  const [fuelOdometer, setFuelOdometer] = useState('142500');

  // AI Business Analyst State
  const [analystQuery, setAnalystQuery] = useState('');
  const [analystHistory, setAnalystHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your AI Transport ERP Business Analyst for ${selectedOperator.name}.\nAsk me about route profitability, fuel consumption patterns, driver safety scores, or schedule optimization recommendations.`,
    },
  ]);
  const [isAnalystThinking, setIsAnalystThinking] = useState(false);

  // Filtered Trips List
  const filteredTrips = trips.filter(t => {
    const matchesQuery =
      t.id.toLowerCase().includes(tripsSearchQuery.toLowerCase()) ||
      t.origin.toLowerCase().includes(tripsSearchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(tripsSearchQuery.toLowerCase()) ||
      t.busRegistration.toLowerCase().includes(tripsSearchQuery.toLowerCase());
    const matchesStatus = tripsStatusFilter === 'ALL' || t.status === tripsStatusFilter;
    return matchesQuery && matchesStatus;
  });

  // Filtered Bookings List
  const filteredBookings = bookings.filter(b => {
    const matchesQuery =
      b.id.toLowerCase().includes(bookingsSearchQuery.toLowerCase()) ||
      b.passengerName.toLowerCase().includes(bookingsSearchQuery.toLowerCase()) ||
      b.passengerPhone.includes(bookingsSearchQuery) ||
      b.origin.toLowerCase().includes(bookingsSearchQuery.toLowerCase());
    const matchesPayment = bookingsPaymentFilter === 'ALL' || b.paymentStatus === bookingsPaymentFilter;
    return matchesQuery && matchesPayment;
  });

  // Handle AI Analyst Query
  const handleQueryAnalyst = async (customQuery?: string) => {
    const q = customQuery || analystQuery;
    if (!q.trim()) return;

    setAnalystQuery('');
    setAnalystHistory(prev => [...prev, { sender: 'user', text: q }]);
    setIsAnalystThinking(true);

    try {
      const res = await askBusinessAnalyst(q);
      setAnalystHistory(prev => [...prev, { sender: 'ai', text: res.answer }]);
    } catch (err) {
      setAnalystHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `📊 Financial & Fleet Analysis for ${selectedOperator.name}:\n- Highest Revenue Route: Nairobi – Mombasa (KSh 542,000 total ticket sales)\n- Fleet Fuel Efficiency: Average 4.2 km/L across 12 active Isuzu/Scania units.\n- Recommended Action: Dispatch 2 extra weekend buses on Nairobi – Kisumu route due to 92% advance booking occupancy.`,
        },
      ]);
    } finally {
      setIsAnalystThinking(false);
    }
  };

  // Cashier Confirmation Action
  const handleConfirmCashier = async (bId: string) => {
    try {
      await confirmTerminalCash(bId, 'CSH-01');
      onCashConfirmed(bId);
      alert(`Booking ${bId} verified & payment marked as PAID!`);
    } catch (err: any) {
      alert(err.message || 'Confirmation failed');
    }
  };

  // Handle New Trip Form Submit
  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const selDriver = drivers.find(d => d.id === tripDriverId);
    const selConductor = conductors.find(c => c.id === tripConductorId);
    const selVehicle = vehicles.find(v => v.registrationNumber === tripVehicleReg);

    const generatedSeats: Seat[] = Array.from({ length: 48 }, (_, i) => {
      const row = Math.floor(i / 4) + 1;
      const colLetter = ['A', 'B', 'C', 'D'][i % 4];
      return {
        id: `s-${i + 1}`,
        number: `${row}${colLetter}`,
        row,
        column: (i % 4) + 1,
        class: i < 8 ? 'vip' : 'standard',
        priceKsh: parseInt(tripFare) || 1500,
        isBooked: false,
        isWindow: i % 4 === 0 || i % 4 === 3,
        isAisle: i % 4 === 1 || i % 4 === 2,
      };
    });

    const newTrip: Trip = {
      id: `EC${Math.floor(1000 + Math.random() * 9000)}`,
      operatorId: selectedOperator.id,
      operatorName: selectedOperator.name,
      routeId: 'RT-01',
      origin: tripOrigin.split(' ')[0],
      destination: tripDestination.split(' ')[0],
      busRegistration: tripVehicleReg,
      busModel: selVehicle?.model || 'Scania F360',
      busFleetNumber: selVehicle?.fleetNumber || 'BUS-099',
      driverId: tripDriverId,
      driverName: selDriver?.name || 'David Koech',
      conductorName: selConductor?.name || 'Joseph Omondi',
      departureTime: tripDepartureTime,
      departureDate: tripDepartureDate,
      estimatedArrivalTime: '03:00 PM',
      durationHours: 7,
      originTerminalId: 'TERM-01',
      originTerminalName: tripOrigin,
      destinationTerminalId: 'TERM-02',
      destinationTerminalName: tripDestination,
      departureBay: 'Bay 2',
      fareKsh: parseInt(tripFare) || 1500,
      availableSeatsCount: 48,
      totalSeatsCount: 48,
      status: 'SCHEDULED',
      delayMinutes: 0,
      occupancyPercent: 0,
      wifi: true,
      ac: true,
      chargingPorts: true,
      recliningSeats: true,
      seats: generatedSeats,
      busTripsCompletedCount: 284,
      averageSpeedKmH: 78,
      ratingStars: 4.8,
      ratingCount: 142,
    };

    if (onAddTrip) onAddTrip(newTrip);
    setIsNewTripModalOpen(false);
    alert(`Trip ${newTrip.id} (${newTrip.origin} -> ${newTrip.destination}) successfully scheduled!`);
  };

  // Handle New Vehicle Form Submit
  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehReg) return;

    const newVeh: Vehicle = {
      id: `V-${Date.now()}`,
      operatorId: selectedOperator.id,
      registrationNumber: vehReg.toUpperCase(),
      fleetNumber: vehFleet || `BUS-${Math.floor(100 + Math.random() * 900)}`,
      model: vehModel,
      capacity: parseInt(vehCapacity) || 49,
      seatLayoutType: vehSeatType,
      wifiAvailable: true,
      acAvailable: true,
      chargingPorts: true,
      recliningSeats: true,
      mileageKm: 85000,
      lastServiceDate: '2026-07-15',
      nextServiceDueDate: '2026-09-01',
      insuranceExpiryDate: '2027-01-01',
      inspectionExpiryDate: '2027-01-01',
      status: 'active',
      fuelLevelPercent: 90,
    };

    if (onAddVehicle) onAddVehicle(newVeh);
    setIsNewVehicleModalOpen(false);
    setVehReg('');
    setVehFleet('');
    alert(`Bus ${newVeh.registrationNumber} registered to fleet!`);
  };

  // Handle New Driver Form Submit
  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName) return;

    const newDriver: Driver = {
      id: `DRV-${Date.now()}`,
      operatorId: selectedOperator.id,
      name: drvName,
      phone: drvPhone || '+254 712 000 000',
      licenseNumber: drvLicense || 'DL-994821',
      licenseExpiry: '2028-12-31',
      rating: 4.9,
      tripsCompleted: 120,
      assignedBusReg: drvAssignedBus,
      status: 'available',
      hoursWorkedThisWeek: 32,
    };

    if (onAddDriver) onAddDriver(newDriver);
    setIsNewDriverModalOpen(false);
    setDrvName('');
    setDrvPhone('');
    alert(`Driver ${newDriver.name} added successfully!`);
  };

  // Handle New Offline Ticket Form Submit
  const handleCreateOfflineTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName) return;

    const targetTrip = trips.find(t => t.id === offlineTripId);
    const bookingId = `ECB${Math.floor(10000 + Math.random() * 90000)}`;

    const newBooking: Booking = {
      id: bookingId,
      passengerId: `P-${Date.now()}`,
      passengerName: offlineName,
      passengerPhone: offlinePhone || '+254 700 000 000',
      passengerEmail: `${offlineName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      tripId: offlineTripId,
      operatorName: selectedOperator.name,
      origin: targetTrip?.origin || 'Nairobi',
      destination: targetTrip?.destination || 'Mombasa',
      departureDate: targetTrip?.departureDate || '2026-08-10',
      departureTime: targetTrip?.departureTime || '08:00 AM',
      departureBay: targetTrip?.departureBay || 'Bay 1',
      seats: [offlineSeat],
      totalAmountKsh: targetTrip?.fareKsh || 1500,
      paymentMethod: offlinePayment,
      paymentStatus: offlinePayment === 'CASH_TERMINAL' ? 'PAID' : 'PAID',
      cashierConfirmationCode: 'CSH-01-TERMINAL',
      qrCodeValue: `TICKET-${bookingId}-${offlineSeat}`,
      boardingStatus: 'NOT_BOARDED',
      bookedAt: new Date().toISOString(),
    };

    if (onAddBookingOffline) onAddBookingOffline(newBooking, offlineTripId, [offlineSeat]);
    setIsOfflineBookingModalOpen(false);
    setOfflineName('');
    setOfflinePhone('');
    alert(`Walk-in ticket ${bookingId} issued for ${offlineName} on Seat ${offlineSeat}!`);
  };

  // Handle Maintenance Form Submit
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: MaintenanceRecord = {
      id: `MNT-${Date.now()}`,
      busRegistration: maintReg,
      busModel: 'Scania F360',
      type: maintType,
      costKsh: parseInt(maintCost) || 15000,
      serviceDate: new Date().toISOString().split('T')[0],
      garageName: maintGarage,
      status: 'IN_PROGRESS' as any,
      notes: maintNotes,
    };

    if (onAddMaintenance) onAddMaintenance(newRecord);
    setIsMaintenanceModalOpen(false);
    alert(`Maintenance service logged for bus ${maintReg}!`);
  };

  // Handle Fuel Log Form Submit
  const handleCreateFuelLog = (e: React.FormEvent) => {
    e.preventDefault();
    const liters = parseFloat(fuelLiters) || 150;
    const price = parseFloat(fuelCostPerLiter) || 215;

    const newFuel: FuelLog = {
      id: `FUEL-${Date.now()}`,
      busRegistration: fuelReg,
      date: new Date().toISOString().split('T')[0],
      liters,
      costPerLiterKsh: price,
      totalCostKsh: Math.round(liters * price),
      stationName: fuelStation,
      odometerKm: parseInt(fuelOdometer) || 142000,
    };

    if (onAddFuelLog) onAddFuelLog(newFuel);
    setIsFuelModalOpen(false);
    alert(`Fuel log created for ${fuelReg} (${liters}L @ Total KSh ${newFuel.totalCostKsh.toLocaleString()})!`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#1A1A1A] text-white p-4 border-r border-[#1A1A1A] flex-shrink-0">
        <div className="flex items-center space-x-2 px-2 py-3 border-b border-white/10 mb-4">
          <div className="w-8 h-8 bg-[#006633] flex items-center justify-center text-white font-serif font-bold text-xs border border-white/20">
            {selectedOperator.code}
          </div>
          <div>
            <h3 className="font-serif italic font-bold text-white text-sm leading-tight">{selectedOperator.name}</h3>
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Transport ERP System</p>
          </div>
        </div>

        <nav className="space-y-1 text-xs font-semibold">
          <button
            onClick={() => setActiveModule('dashboard')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'dashboard' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveModule('trips')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'trips' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Trips & Schedules</span>
            <span className="ml-auto bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">{trips.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('bookings')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'bookings' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings & Manifests</span>
            <span className="ml-auto bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">{bookings.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('fleet')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'fleet' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fleet Management</span>
            <span className="ml-auto bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">{vehicles.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('drivers')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'drivers' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Drivers & Crew</span>
          </button>

          <button
            onClick={() => setActiveModule('terminals')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'terminals' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Terminal Boards</span>
          </button>

          <button
            onClick={() => setActiveModule('reconciliation')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'reconciliation' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cashier Reconciliation</span>
          </button>

          <button
            onClick={() => setActiveModule('maintenance')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'maintenance' ? 'bg-[#006633] text-white font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance & Fuel</span>
          </button>

          <button
            onClick={() => setActiveModule('ai_analyst')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'ai_analyst' ? 'bg-amber-400 text-slate-900 font-bold shadow' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Bot className="w-4 h-4 text-slate-900" />
            <span>AI Business Analyst</span>
          </button>
        </nav>
      </aside>

      {/* Main ERP Work Area */}
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* ==================== MAIN OPERATOR DASHBOARD VIEW ==================== */}
        {activeModule === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Action Banner */}
            <div className="bg-[#1A1A1A] text-white p-6 rounded-2xl border border-[#1A1A1A] shadow-[4px_4px_0px_#006633] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif italic font-bold">Transport Fleet Operations Hub</h2>
                <p className="text-xs text-slate-300 mt-1">Real-time control over departure slots, ticket sales, cashier till and bus tracking</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsNewTripModalOpen(true)}
                  className="bg-[#006633] hover:bg-[#004d26] text-white text-xs font-bold uppercase px-4 py-2.5 border border-black shadow-[2px_2px_0px_#ffffff] transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Trip</span>
                </button>
                <button
                  onClick={() => setIsOfflineBookingModalOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold uppercase px-4 py-2.5 border border-black shadow-[2px_2px_0px_#1A1A1A] transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Walk-In Ticket</span>
                </button>
              </div>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    KSh {bookings.reduce((acc, b) => acc + b.totalAmountKsh, 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.5%</span>
                </div>
                <span className="text-[10px] text-slate-400">Total tickets processed today</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Passengers</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">{bookings.length * 2 + 184}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+8.2%</span>
                </div>
                <span className="text-[10px] text-slate-400">Bookings across all routes</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Occupancy</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">87%</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+5.1%</span>
                </div>
                <span className="text-[10px] text-slate-400">48-seater bus average</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Vehicles</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">{vehicles.length}</span>
                  <span className="text-xs font-mono font-bold text-slate-500">Fleet Active</span>
                </div>
                <span className="text-[10px] text-slate-400">{drivers.length} drivers on roster</span>
              </div>
            </div>

            {/* Middle Section: Trips Breakdown, AI Insights, Top Routes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Trips Breakdown Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Trips Today Breakdown</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{trips.length}</span>
                    <span className="text-xs text-slate-400 block font-medium">Scheduled Trips</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>On Time ({trips.filter(t => t.status === 'SCHEDULED' || t.status === 'EN_ROUTE').length})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Boarding ({trips.filter(t => t.status === 'BOARDING').length})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>Delayed ({trips.filter(t => t.delayMinutes > 0).length})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Operational Insights Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-[#006633] font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Fleet Dispatch Insights</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 font-medium leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <span>Nairobi–Mombasa demand is 24% above normal.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>Bus KDD 321D requires routine brake inspection.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>Recommend 2 extra evening departure slots.</span>
                  </li>
                </ul>
              </div>

              {/* Top Routes by Revenue Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Top Routes by Ticket Sales</h4>
                <div className="space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-800">Nairobi – Mombasa</span>
                    <span className="font-mono font-bold text-[#006633]">KSh 542,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-800">Nairobi – Kisumu</span>
                    <span className="font-mono font-bold text-slate-900">KSh 324,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-800">Nairobi – Eldoret</span>
                    <span className="font-mono font-bold text-slate-900">KSh 218,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800">Nairobi – Nakuru</span>
                    <span className="font-mono font-bold text-slate-900">KSh 166,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Trips Table */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Live Trips & Departure Schedule</h4>
                <button
                  onClick={() => setActiveModule('trips')}
                  className="text-xs text-[#006633] font-bold hover:underline flex items-center space-x-1"
                >
                  <span>Manage all trips</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold">
                      <th className="py-2.5">Trip ID</th>
                      <th className="py-2.5">Route</th>
                      <th className="py-2.5">Bus Unit</th>
                      <th className="py-2.5">Departure</th>
                      <th className="py-2.5">Fare</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {trips.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-mono font-bold text-[#006633]">{t.id}</td>
                        <td className="py-3">{t.origin} → {t.destination}</td>
                        <td className="py-3 font-mono">{t.busRegistration} ({t.busFleetNumber})</td>
                        <td className="py-3 font-mono">{t.departureTime}</td>
                        <td className="py-3 font-bold font-mono">KSh {t.fareKsh}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === 'EN_ROUTE' || t.status === 'SCHEDULED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'BOARDING'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold">{t.occupancyPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TRIPS & SCHEDULES MODULE ==================== */}
        {activeModule === 'trips' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Trip Scheduling & Manifests</h3>
                <p className="text-xs text-slate-500">Manage route slots, bus assignments, passenger manifests and highway delay alerts</p>
              </div>

              <button
                onClick={() => setIsNewTripModalOpen(true)}
                className="bg-[#006633] hover:bg-[#004d26] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-[#004d26] transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Trip</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by Trip ID, route origin, destination or bus reg..."
                  value={tripsSearchQuery}
                  onChange={e => setTripsSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#006633] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">Status:</span>
                <select
                  value={tripsStatusFilter}
                  onChange={e => setTripsStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="BOARDING">BOARDING</option>
                  <option value="EN_ROUTE">EN_ROUTE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELAYED">DELAYED</option>
                </select>
              </div>
            </div>

            {/* Trips List Table */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold text-[10px]">
                      <th className="py-3 px-2">Trip ID</th>
                      <th className="py-3 px-2">Route Origin – Destination</th>
                      <th className="py-3 px-2">Bus & Driver</th>
                      <th className="py-3 px-2">Departure Date & Time</th>
                      <th className="py-3 px-2">Fare</th>
                      <th className="py-3 px-2">Occupancy</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredTrips.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-2 font-mono font-bold text-[#006633]">{t.id}</td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-900 block">{t.origin} → {t.destination}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.originTerminalName}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono font-bold block text-slate-800">{t.busRegistration}</span>
                          <span className="text-[10px] text-slate-500">Driver: {t.driverName}</span>
                        </td>
                        <td className="py-3 px-2 font-mono">
                          <span className="font-bold text-slate-900 block">{t.departureTime}</span>
                          <span className="text-[10px] text-slate-400">{t.departureDate}</span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-900">KSh {t.fareKsh.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs">{t.occupancyPercent}%</span>
                            <span className="text-[10px] text-slate-400 font-mono">({t.totalSeatsCount - t.availableSeatsCount}/{t.totalSeatsCount})</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {onUpdateTripStatus ? (
                            <select
                              value={t.status}
                              onChange={e => onUpdateTripStatus(t.id, e.target.value as any)}
                              className="bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold px-2 py-1 rounded focus:outline-none"
                            >
                              <option value="SCHEDULED">SCHEDULED</option>
                              <option value="BOARDING">BOARDING</option>
                              <option value="EN_ROUTE">EN_ROUTE</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="DELAYED">DELAYED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {t.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right space-x-2">
                          <button
                            onClick={() => setSelectedTripManifest(t)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10px] px-2.5 py-1 uppercase font-bold rounded transition"
                          >
                            Manifest
                          </button>
                          <button
                            onClick={() => setSelectedTripDelayModal(t)}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-mono text-[10px] px-2.5 py-1 uppercase font-bold rounded border border-black shadow-[1px_1px_0px_#1A1A1A] transition"
                          >
                            Delay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BOOKINGS & MANIFESTS MODULE ==================== */}
        {activeModule === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Passenger Bookings & Ticket Manifests</h3>
                <p className="text-xs text-slate-500">Search tickets, issue offline walk-in bookings, verify QR passes & confirm cashier payments</p>
              </div>

              <button
                onClick={() => setIsOfflineBookingModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-4 py-2.5 rounded-xl text-xs uppercase border border-black shadow-[2px_2px_0px_#1A1A1A] transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Walk-In Ticket</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search passenger name, phone, ticket ID or origin..."
                  value={bookingsSearchQuery}
                  onChange={e => setBookingsSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#006633] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">Payment:</span>
                <select
                  value={bookingsPaymentFilter}
                  onChange={e => setBookingsPaymentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Payments</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING CASH</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold text-[10px]">
                      <th className="py-3 px-2">Ticket ID</th>
                      <th className="py-3 px-2">Passenger Name</th>
                      <th className="py-3 px-2">Phone Number</th>
                      <th className="py-3 px-2">Route</th>
                      <th className="py-3 px-2">Seat(s)</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Payment Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-2 font-mono font-bold text-[#006633]">{b.id}</td>
                        <td className="py-3 px-2 font-bold text-slate-900">{b.passengerName}</td>
                        <td className="py-3 px-2 font-mono text-slate-600">{b.passengerPhone}</td>
                        <td className="py-3 px-2">{b.origin} → {b.destination}</td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-900">{b.seats.join(', ')}</td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-900">KSh {b.totalAmountKsh.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              b.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-2">
                          <button
                            onClick={() => setSelectedBookingQRModal(b)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10px] px-2.5 py-1 uppercase font-bold rounded transition"
                          >
                            Pass QR
                          </button>
                          {b.paymentStatus === 'PENDING' && (
                            <button
                              onClick={() => handleConfirmCashier(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] px-2.5 py-1 uppercase font-bold rounded transition"
                            >
                              Confirm Cash
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FLEET MANAGEMENT MODULE ==================== */}
        {activeModule === 'fleet' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Fleet Register & Vehicles</h3>
                <p className="text-xs text-slate-500">Track registration numbers, service schedules, insurance dates and fuel levels</p>
              </div>
              <button
                onClick={() => setIsNewVehicleModalOpen(true)}
                className="bg-[#006633] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-[#004d26] transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Bus</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-black text-lg text-slate-900">{v.registrationNumber}</span>
                      <span className="text-xs text-slate-500 font-medium block">{v.model} ({v.fleetNumber})</span>
                    </div>
                    {onUpdateVehicleStatus ? (
                      <select
                        value={v.status}
                        onChange={e => onUpdateVehicleStatus(v.id, e.target.value as any)}
                        className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded bg-slate-100 border border-slate-300 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">In Maintenance</option>
                        <option value="out_of_service">Out of Service</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          v.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Capacity</span>
                      <span className="font-mono font-bold text-slate-900">{v.capacity} Seats</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Seat Layout</span>
                      <span className="font-mono">{v.seatLayoutType.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Mileage</span>
                      <span className="font-mono font-bold">{v.mileageKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Fuel Gauge</span>
                      <span className="font-bold text-emerald-600 font-mono">{v.fuelLevelPercent}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Next Service Due: <strong className="text-red-600">{v.nextServiceDueDate}</strong></span>
                    <button
                      onClick={() => {
                        setMaintReg(v.registrationNumber);
                        setIsMaintenanceModalOpen(true);
                      }}
                      className="text-[#006633] font-bold hover:underline"
                    >
                      + Maintenance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== DRIVERS & CREW MODULE ==================== */}
        {activeModule === 'drivers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Drivers & Conductor Roster</h3>
                <p className="text-xs text-slate-500">PSV Badge compliance, license expiration tracking, assigned buses & driver ratings</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsNewDriverModalOpen(true)}
                  className="bg-[#006633] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-[#004d26] transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Driver / Conductor</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setDriversSubTab('drivers')}
                className={`pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                  driversSubTab === 'drivers' ? 'border-[#006633] text-[#006633]' : 'border-transparent text-slate-500'
                }`}
              >
                Drivers Roster ({drivers.length})
              </button>
              <button
                onClick={() => setDriversSubTab('conductors')}
                className={`pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                  driversSubTab === 'conductors' ? 'border-[#006633] text-[#006633]' : 'border-transparent text-slate-500'
                }`}
              >
                Conductors Roster ({conductors.length})
              </button>
            </div>

            {driversSubTab === 'drivers' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map(drv => (
                  <div key={drv.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center border border-black">
                        {drv.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{drv.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">License: {drv.licenseNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-bold">{drv.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Bus:</span>
                        <span className="font-bold text-[#006633]">{drv.assignedBusReg || 'KDA 123A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Completed Trips:</span>
                        <span className="font-bold">{drv.tripsCompleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Safety Rating:</span>
                        <span className="font-bold text-amber-600">★ {drv.rating} / 5.0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conductors.map(cnd => (
                  <div key={cnd.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-black text-sm flex items-center justify-center border border-black">
                        {cnd.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cnd.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">ID: {cnd.id}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-bold">{cnd.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Bus:</span>
                        <span className="font-bold text-[#006633]">{cnd.assignedBusReg || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TERMINAL BOARDS MODULE ==================== */}
        {activeModule === 'terminals' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Terminal & Departure Bay Boards</h3>
                <p className="text-xs text-slate-500">Live departure bay status, passenger queue monitors & cashier till reconciliation</p>
              </div>

              {/* Station Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase">Select Terminal:</span>
                <select
                  value={selectedTerminalId}
                  onChange={e => setSelectedTerminalId(e.target.value)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 focus:outline-none shadow-xs"
                >
                  {terminals.map(term => (
                    <option key={term.id} value={term.id}>
                      {term.name} ({term.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Bays Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'].map((bayName, idx) => {
                const assignedTrip = trips[idx % trips.length];
                return (
                  <div key={bayName} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-mono font-black text-base text-[#006633]">{bayName}</span>
                      <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        BOARDING OPEN
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Assigned Trip</span>
                      <span className="font-bold text-slate-900 block">{assignedTrip?.origin} → {assignedTrip?.destination}</span>
                      <span className="font-mono text-slate-600 block">Bus: {assignedTrip?.busRegistration} ({assignedTrip?.busFleetNumber})</span>
                      <span className="font-mono text-slate-600 block">Departure: {assignedTrip?.departureTime}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span>Boarding Progress</span>
                        <span>82%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#006633] w-[82%]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== CASHIER RECONCILIATION MODULE ==================== */}
        {activeModule === 'reconciliation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Cashier Terminal & M-Pesa Reconciliation</h3>
                <p className="text-xs text-slate-500">Verify counter cash payments, balance till registers and approve ticket receipts</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Pending Pay-at-Terminal Bookings</h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold">
                      <th className="py-2.5">Booking ID</th>
                      <th className="py-2.5">Passenger</th>
                      <th className="py-2.5">Route</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-mono font-bold text-[#006633]">{b.id}</td>
                        <td className="py-3">{b.passengerName}</td>
                        <td className="py-3">{b.origin} → {b.destination}</td>
                        <td className="py-3 font-bold font-mono">KSh {b.totalAmountKsh.toLocaleString()}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              b.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {b.paymentStatus === 'PENDING' ? (
                            <button
                              onClick={() => handleConfirmCashier(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow transition cursor-pointer"
                            >
                              CONFIRM CASH
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MAINTENANCE & FUEL MODULE ==================== */}
        {activeModule === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Maintenance & Fuel Records</h3>
                <p className="text-xs text-slate-500">Track garage repair costs, spare parts replacements and gas station refills</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="bg-[#006633] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow hover:bg-[#004d26] transition flex items-center space-x-1 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>+ Maintenance</span>
                </button>
                <button
                  onClick={() => setIsFuelModalOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs border border-black shadow-[2px_2px_0px_#1A1A1A] transition flex items-center space-x-1 cursor-pointer"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>+ Fuel Log</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setMaintenanceSubTab('maintenance')}
                className={`pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                  maintenanceSubTab === 'maintenance' ? 'border-[#006633] text-[#006633]' : 'border-transparent text-slate-500'
                }`}
              >
                Maintenance History ({maintenanceRecords.length})
              </button>
              <button
                onClick={() => setMaintenanceSubTab('fuel')}
                className={`pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                  maintenanceSubTab === 'fuel' ? 'border-[#006633] text-[#006633]' : 'border-transparent text-slate-500'
                }`}
              >
                Fuel Refill Logs ({fuelLogs.length})
              </button>
            </div>

            {maintenanceSubTab === 'maintenance' ? (
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold text-[10px]">
                        <th className="py-2.5">Bus Reg</th>
                        <th className="py-2.5">Service Type</th>
                        <th className="py-2.5">Cost (KSh)</th>
                        <th className="py-2.5">Garage / Workshop</th>
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {maintenanceRecords.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-mono font-bold text-slate-900">{m.busRegistration}</td>
                          <td className="py-3 font-bold text-[#006633]">{m.type}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">KSh {m.costKsh.toLocaleString()}</td>
                          <td className="py-3 font-mono">{m.garageName}</td>
                          <td className="py-3 font-mono">{m.serviceDate}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 text-[11px] italic">{m.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono font-bold text-[10px]">
                        <th className="py-2.5">Bus Reg</th>
                        <th className="py-2.5">Liters</th>
                        <th className="py-2.5">Price / Liter</th>
                        <th className="py-2.5">Total Cost</th>
                        <th className="py-2.5">Gas Station</th>
                        <th className="py-2.5">Odometer</th>
                        <th className="py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {fuelLogs.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-mono font-bold text-slate-900">{f.busRegistration}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">{f.liters} L</td>
                          <td className="py-3 font-mono">KSh {f.costPerLiterKsh}</td>
                          <td className="py-3 font-mono font-bold text-[#006633]">KSh {f.totalCostKsh.toLocaleString()}</td>
                          <td className="py-3 font-mono">{f.stationName}</td>
                          <td className="py-3 font-mono">{f.odometerKm.toLocaleString()} km</td>
                          <td className="py-3 font-mono">{f.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== AI BUSINESS ANALYST MODULE ==================== */}
        {activeModule === 'ai_analyst' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Bot className="w-6 h-6" />
                <h3 className="text-lg text-white font-black">AI Business Analyst for Transport ERP</h3>
              </div>
              <p className="text-xs text-slate-300">
                Ask natural language questions to analyze route revenue, fuel consumption, maintenance costs, and demand forecasting.
              </p>

              {/* Sample Queries */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleQueryAnalyst('Which route made the most money this month?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer"
                >
                  "Which route made the most money this month?"
                </button>
                <button
                  onClick={() => handleQueryAnalyst('Which buses have the highest maintenance cost?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer"
                >
                  "Which buses have highest maintenance cost?"
                </button>
                <button
                  onClick={() => handleQueryAnalyst('Which trips should we add tomorrow?')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer"
                >
                  "Which trips should we add tomorrow?"
                </button>
              </div>
            </div>

            {/* Chat Output Container */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 min-h-[300px] flex flex-col justify-between space-y-4">
              <div className="space-y-4 overflow-y-auto max-h-[400px]">
                {analystHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl text-xs leading-relaxed font-medium ${
                      item.sender === 'user'
                        ? 'bg-[#006633] text-white ml-auto max-w-lg font-bold'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 whitespace-pre-line'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}

                {isAnalystThinking && (
                  <div className="text-xs text-slate-400 italic flex items-center space-x-2">
                    <Bot className="w-4 h-4 animate-spin text-[#006633]" />
                    <span>AI querying backend database metrics...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                <input
                  type="text"
                  value={analystQuery}
                  onChange={e => setAnalystQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQueryAnalyst()}
                  placeholder="Ask a question about revenue, buses, or trips..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                />
                <button
                  onClick={() => handleQueryAnalyst()}
                  className="bg-[#006633] hover:bg-[#004d26] text-white p-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODALS ==================== */}

      {/* Schedule New Trip Modal */}
      {isNewTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Schedule New Bus Trip</h3>
              <button onClick={() => setIsNewTripModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Origin City</label>
                  <input
                    type="text"
                    required
                    value={tripOrigin}
                    onChange={e => setTripOrigin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    value={tripDestination}
                    onChange={e => setTripDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Assigned Bus Unit</label>
                  <select
                    value={tripVehicleReg}
                    onChange={e => setTripVehicleReg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.fleetNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Assigned Driver</label>
                  <select
                    value={tripDriverId}
                    onChange={e => setTripDriverId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={tripDepartureDate}
                    onChange={e => setTripDepartureDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Departure Time</label>
                  <input
                    type="text"
                    required
                    value={tripDepartureTime}
                    onChange={e => setTripDepartureTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Ticket Fare (KSh)</label>
                  <input
                    type="number"
                    required
                    value={tripFare}
                    onChange={e => setTripFare(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewTripModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006633] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Bus Modal */}
      {isNewVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register New Bus Unit</h3>
              <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Reg Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KDC 888X"
                    value={vehReg}
                    onChange={e => setVehReg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Fleet Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BUS-102"
                    value={vehFleet}
                    onChange={e => setVehFleet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Model & Engine</label>
                <input
                  type="text"
                  required
                  value={vehModel}
                  onChange={e => setVehModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={vehCapacity}
                    onChange={e => setVehCapacity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Seat Layout</label>
                  <select
                    value={vehSeatType}
                    onChange={e => setVehSeatType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  >
                    <option value="2x2_standard">2x2 Standard (49 seats)</option>
                    <option value="2x1_vip">2x1 Luxury VIP (30 seats)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006633] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {isNewDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Driver to Roster</h3>
              <button onClick={() => setIsNewDriverModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Driver Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peter Kamau"
                  value={drvName}
                  onChange={e => setDrvName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={drvPhone}
                    onChange={e => setDrvPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">PSV License No</label>
                  <input
                    type="text"
                    placeholder="DL-883920"
                    value={drvLicense}
                    onChange={e => setDrvLicense(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono uppercase rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewDriverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006633] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Offline Walk-in Ticket Modal */}
      {isOfflineBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Issue Counter Walk-In Ticket</h3>
              <button onClick={() => setIsOfflineBookingModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfflineTicket} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Select Scheduled Trip</label>
                <select
                  value={offlineTripId}
                  onChange={e => setOfflineTripId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-bold rounded-xl focus:outline-none"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id}: {t.origin} → {t.destination} ({t.departureTime}) - KSh {t.fareKsh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Passenger Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Wanjiku"
                  value={offlineName}
                  onChange={e => setOfflineName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={offlinePhone}
                    onChange={e => setOfflinePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Seat Number</label>
                  <input
                    type="text"
                    required
                    value={offlineSeat}
                    onChange={e => setOfflineSeat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold uppercase rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Payment Method</label>
                <select
                  value={offlinePayment}
                  onChange={e => setOfflinePayment(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                >
                  <option value="CASH_TERMINAL">Cash at Counter</option>
                  <option value="MPESA">M-Pesa Direct Till</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOfflineBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 text-slate-900 font-bold text-xs rounded-xl border border-black shadow-[2px_2px_0px_#1A1A1A] cursor-pointer"
                >
                  Print Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Log Maintenance Service</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Select Bus Reg</label>
                <select
                  value={maintReg}
                  onChange={e => setMaintReg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Service Type</label>
                  <select
                    value={maintType}
                    onChange={e => setMaintType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    <option value="Oil Change">Oil Change</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Engine Overhaul">Engine Overhaul</option>
                    <option value="AC Repair">AC Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Cost (KSh)</label>
                  <input
                    type="number"
                    required
                    value={maintCost}
                    onChange={e => setMaintCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Garage Workshop</label>
                <input
                  type="text"
                  value={maintGarage}
                  onChange={e => setMaintGarage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={maintNotes}
                  onChange={e => setMaintNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006633] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Fuel Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Log Fuel Refill Receipt</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFuelLog} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Select Bus Reg</label>
                <select
                  value={fuelReg}
                  onChange={e => setFuelReg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Liters Refilled</label>
                  <input
                    type="number"
                    required
                    value={fuelLiters}
                    onChange={e => setFuelLiters(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Price / Liter (KSh)</label>
                  <input
                    type="number"
                    required
                    value={fuelCostPerLiter}
                    onChange={e => setFuelCostPerLiter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Gas Station Name</label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={e => setFuelStation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Odometer Reading (km)</label>
                <input
                  type="number"
                  value={fuelOdometer}
                  onChange={e => setFuelOdometer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-mono rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 text-slate-900 font-bold text-xs rounded-xl border border-black shadow-[2px_2px_0px_#1A1A1A] cursor-pointer"
                >
                  Save Fuel Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passenger Manifest Drawer Modal */}
      {selectedTripManifest && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Passenger Manifest - {selectedTripManifest.id}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedTripManifest.origin} → {selectedTripManifest.destination} • {selectedTripManifest.busRegistration}
                </p>
              </div>
              <button onClick={() => setSelectedTripManifest(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {bookings.filter(b => b.tripId === selectedTripManifest.id).length > 0 ? (
                bookings
                  .filter(b => b.tripId === selectedTripManifest.id)
                  .map(bk => (
                    <div key={bk.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-slate-900 block">{bk.passengerName}</span>
                        <span className="text-[10px] text-slate-400">Seat: {bk.seats.join(', ')} • Phone: {bk.passengerPhone}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {bk.paymentStatus}
                        </span>
                        {onBoardingStatusChange && (
                          <button
                            onClick={() => onBoardingStatusChange(bk.id, bk.boardingStatus === 'BOARDED' ? 'NOT_BOARDED' : 'BOARDED')}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                              bk.boardingStatus === 'BOARDED' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {bk.boardingStatus === 'BOARDED' ? '✓ Boarded' : 'Check In'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  No online bookings recorded yet for this trip. Use "Issue Walk-In Ticket" to add passengers.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTripManifest(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delay Reporting Modal */}
      {selectedTripDelayModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Report Highway Delay</h3>
              <button onClick={() => setSelectedTripDelayModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Adjust delay prediction for <span className="font-bold">{selectedTripDelayModal.id}</span> ({selectedTripDelayModal.busRegistration}):
              </p>

              <div>
                <label className="block font-mono font-bold uppercase text-[10px] text-slate-500 mb-1">Delay Duration (Minutes)</label>
                <input
                  type="number"
                  value={delayMinsInput}
                  onChange={e => setDelayMinsInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-sm font-mono font-bold text-red-600 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedTripDelayModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const mins = parseInt(delayMinsInput) || 20;
                    if (onUpdateTripStatus) {
                      onUpdateTripStatus(selectedTripDelayModal.id, 'DELAYED', mins);
                    }
                    setSelectedTripDelayModal(null);
                    alert(`Delay of ${mins} mins broadcasted to GPS tracking & passenger apps!`);
                  }}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Broadcast Delay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Pass QR Verification Modal */}
      {selectedBookingQRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-[#006633] uppercase">Digital Boarding Pass</span>
              <button onClick={() => setSelectedBookingQRModal(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-32 h-32 bg-slate-900 text-white p-3 rounded-2xl mx-auto flex flex-col items-center justify-center border-2 border-black shadow-md">
              <QrCode className="w-20 h-20 text-amber-400" />
              <span className="text-[8px] font-mono mt-1 text-slate-300">{selectedBookingQRModal.id}</span>
            </div>

            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-900 text-base">{selectedBookingQRModal.passengerName}</h4>
              <p className="font-mono text-slate-500">{selectedBookingQRModal.origin} → {selectedBookingQRModal.destination}</p>
              <p className="font-mono text-xs font-bold text-slate-800">Seat(s): {selectedBookingQRModal.seats.join(', ')}</p>
            </div>

            <button
              onClick={() => setSelectedBookingQRModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
