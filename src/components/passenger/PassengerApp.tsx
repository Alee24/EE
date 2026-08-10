import React, { useState } from 'react';
import {
  Bus,
  Calendar,
  MapPin,
  Users,
  Search,
  Wifi,
  Zap,
  ShieldCheck,
  Award,
  Smartphone,
  QrCode,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  ChevronRight,
  Send,
  Ticket,
  Bot,
  Filter,
  Armchair,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Gauge,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Trip, Booking, GPSLocation, LoyaltyAccount, Seat } from '../../types';
import { MapTracker } from '../common/MapTracker';
import { AiTravelAdvisorChatbot } from '../common/AiTravelAdvisorChatbot';
import { createBooking, triggerMpesaStkPush, askTravelAssistant } from '../../services/api';

interface PassengerAppProps {
  trips: Trip[];
  bookings: Booking[];
  gpsLocations: Record<string, GPSLocation>;
  loyalty: LoyaltyAccount;
  onBookingCreated: (b: Booking, updatedTrip: Trip, updatedLoyalty: LoyaltyAccount) => void;
}

export const PassengerApp: React.FC<PassengerAppProps> = ({
  trips,
  bookings,
  gpsLocations,
  loyalty,
  onBookingCreated,
}) => {
  // Search State
  const [origin, setOrigin] = useState('Nairobi');
  const [destination, setDestination] = useState('Mombasa');
  const [travelDate, setTravelDate] = useState('2026-08-10');
  const [passengerCount, setPassengerCount] = useState(1);
  const [searchFilterActive, setSearchFilterActive] = useState(false);

  // Active View Tab inside Passenger Portal
  const [passengerTab, setPassengerTab] = useState<'search' | 'bookings' | 'tracking' | 'rewards'>('search');

  // Selected Trip for Seat Selection
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Seat Preference Filter State
  const [seatFilter, setSeatFilter] = useState<'ALL' | 'WINDOW' | 'AISLE'>('ALL');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);

  // Helper functions for seat classification
  const isWindowSeat = (seat: Seat): boolean => {
    if (typeof seat.isWindow === 'boolean') return seat.isWindow;
    const col = seat.column;
    const letter = seat.number.slice(-1).toUpperCase();
    return col === 1 || col === 4 || letter === 'A' || letter === 'D';
  };

  const isAisleSeat = (seat: Seat): boolean => {
    if (typeof seat.isAisle === 'boolean') return seat.isAisle;
    const col = seat.column;
    const letter = seat.number.slice(-1).toUpperCase();
    return col === 2 || col === 3 || letter === 'B' || letter === 'C';
  };

  const getSeatAttributes = (seat: Seat, trip: Trip | null): string[] => {
    const attrs: string[] = [];
    const win = isWindowSeat(seat);
    const ais = isAisleSeat(seat);

    if (win) attrs.push('🪟 Window View');
    else if (ais) attrs.push('🚶 Aisle Access');
    else attrs.push('💺 Center Seat');

    if (seat.row === 1) {
      attrs.push('✨ Extra Legroom');
      attrs.push('🚘 Front Driver View');
    } else if (seat.row === 2) {
      attrs.push('✨ Extra Legroom');
    } else if (seat.row === 5 || seat.row === 6) {
      attrs.push('🚨 Near Emergency Exit');
    } else if (seat.row >= 9) {
      attrs.push('🔇 Rear Quiet Zone');
    }

    if (seat.class === 'vip') {
      attrs.push('👑 VIP Recliner');
    } else if (seat.class === 'executive') {
      attrs.push('🛋️ Executive Wide Seat');
    }

    if (trip?.chargingPorts) {
      attrs.push('🔌 USB Power');
    }

    return attrs;
  };

  const autoSelectSeatType = (type: 'WINDOW' | 'AISLE') => {
    if (!selectedTrip) return;
    const matchFn = type === 'WINDOW' ? isWindowSeat : isAisleSeat;
    const candidate = selectedTrip.seats.find(s => !s.isBooked && matchFn(s) && !selectedSeats.includes(s.number));
    if (candidate) {
      toggleSeat(candidate.number, candidate.isBooked);
    }
  };

  const selectMultipleSeats = (count: number) => {
    if (!selectedTrip) return;

    // Group unbooked seats by row
    const unbookedSeats = selectedTrip.seats.filter(s => !s.isBooked);
    const rowsMap = new Map<number, Seat[]>();

    unbookedSeats.forEach(s => {
      const rowList = rowsMap.get(s.row) || [];
      rowList.push(s);
      rowsMap.set(s.row, rowList);
    });

    let chosenSeatNumbers: string[] = [];

    // Try finding adjacent seats in the same row first
    for (const [, seatsInRow] of rowsMap.entries()) {
      seatsInRow.sort((a, b) => a.column - b.column);
      if (seatsInRow.length >= count) {
        chosenSeatNumbers = seatsInRow.slice(0, count).map(s => s.number);
        break;
      }
    }

    // Fallback: pick sequential available seats across rows
    if (chosenSeatNumbers.length < count) {
      chosenSeatNumbers = unbookedSeats.slice(0, Math.min(count, unbookedSeats.length)).map(s => s.number);
    }

    setSelectedSeats(chosenSeatNumbers);
  };

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [passengerName, setPassengerName] = useState('Alex Metto');
  const [passengerPhone, setPassengerPhone] = useState('254712345678');
  const [passengerEmail, setPassengerEmail] = useState('alex.metto@gmail.com');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CASH_TERMINAL'>('MPESA');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stkPromptSimulated, setStkPromptSimulated] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Selected Active Booking for Ticket Modal / View
  const [viewTicket, setViewTicket] = useState<Booking | null>(null);

  // Active GPS Bus Tracker Selection
  const [activeTrackingTripId, setActiveTrackingTripId] = useState<string>('EC1001');

  // AI Assistant Drawer
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; chips?: string[] }>>([
    {
      sender: 'ai',
      text: 'Good morning, Alex! 🖐️ Where are you travelling today? I can help you find the cheapest bus, predict travel times, or check weather impacts.',
      chips: ['Cheapest day?', 'Fastest route?', 'Will it rain?', 'Buses under KSh 1,500'],
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Local Trips state for rating updates
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);

  React.useEffect(() => {
    setLocalTrips(trips);
  }, [trips]);

  // Rating Modal State
  const [ratingModalTrip, setRatingModalTrip] = useState<Trip | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Safe Driver', 'Clean Bus']);
  const [ratingSubmittedSuccess, setRatingSubmittedSuccess] = useState<boolean>(false);

  const toggleRatingTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalTrip) return;

    const newReview = {
      id: `rev_${Date.now()}`,
      passengerName: 'Alex Metto',
      rating: selectedStars,
      comment: ratingComment || 'Great trip, punctual departure and very smooth ride!',
      date: new Date().toISOString().split('T')[0],
      tags: selectedTags,
    };

    setLocalTrips(prev =>
      prev.map(t => {
        if (t.id === ratingModalTrip.id) {
          const currentCount = t.ratingCount || 120;
          const currentStars = t.ratingStars || 4.7;
          const newCount = currentCount + 1;
          const newAvgStars = Math.round(((currentStars * currentCount + selectedStars) / newCount) * 10) / 10;
          return {
            ...t,
            ratingCount: newCount,
            ratingStars: newAvgStars,
            reviews: [newReview, ...(t.reviews || [])],
          };
        }
        return t;
      })
    );

    setRatingSubmittedSuccess(true);
    setTimeout(() => {
      setRatingSubmittedSuccess(false);
      setRatingModalTrip(null);
      setRatingComment('');
    }, 1800);
  };

  // Filter Trips from localTrips
  const filteredTrips = localTrips.filter(t => {
    if (!searchFilterActive) return true;
    const matchOrigin = !origin || origin === 'All' || t.origin.toLowerCase() === origin.toLowerCase();
    const matchDest = !destination || destination === 'All' || t.destination.toLowerCase() === destination.toLowerCase();
    return matchOrigin && matchDest;
  });

  // Handle Seat Toggle
  const toggleSeat = (seatNum: string, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= passengerCount) {
        setSelectedSeats([...selectedSeats.slice(1), seatNum]);
      } else {
        setSelectedSeats([...selectedSeats, seatNum]);
      }
    }
  };

  // Calculate total fare
  const totalFareKsh = selectedTrip
    ? selectedSeats.reduce((sum, seatNum) => {
        const seat = selectedTrip.seats.find(s => s.number === seatNum);
        return sum + (seat ? seat.priceKsh : selectedTrip.fareKsh);
      }, 0)
    : 0;

  // Handle Booking Submit
  const handleProceedBooking = async () => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === 'MPESA') {
        setStkPromptSimulated(true);
        // Simulate 2 seconds STK PIN prompt
        await new Promise(r => setTimeout(r, 2000));
      }

      const response = await createBooking({
        tripId: selectedTrip.id,
        passengerName,
        passengerPhone,
        passengerEmail,
        seatsSelected: selectedSeats,
        paymentMethod,
      });

      if (response.success) {
        setCompletedBooking(response.booking);
        onBookingCreated(response.booking, response.trip, response.loyalty);
        setShowCheckoutModal(false);
        setViewTicket(response.booking);
      }
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      setIsProcessingPayment(false);
      setStkPromptSimulated(false);
    }
  };

  // Handle AI Question
  const handleSendAi = async (textToSend?: string) => {
    const query = textToSend || aiInput;
    if (!query.trim()) return;

    const userMsg = query;
    setAiInput('');
    setAiChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsAiThinking(true);

    try {
      const res = await askTravelAssistant(userMsg);
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      setAiChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Tuesday morning departures offer the best combination of low road traffic and affordable fares on Easy Coach!',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* Passenger Sub-Navigation */}
      <div className="bg-white border-b border-[#1A1A1A] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
            <div className="flex space-x-6">
              <button
                onClick={() => setPassengerTab('search')}
                className={`py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  passengerTab === 'search' ? 'border-[#006633] text-[#006633] font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Book Tickets</span>
              </button>

              <button
                onClick={() => setPassengerTab('bookings')}
                className={`py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  passengerTab === 'bookings' ? 'border-[#006633] text-[#006633] font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>My Bookings ({bookings.length})</span>
              </button>

              <button
                onClick={() => setPassengerTab('tracking')}
                className={`py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  passengerTab === 'tracking' ? 'border-[#006633] text-[#006633] font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Live Bus Tracking</span>
              </button>

              <button
                onClick={() => setPassengerTab('rewards')}
                className={`py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  passengerTab === 'rewards' ? 'border-[#006633] text-[#006633] font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Loyalty ({loyalty.pointsBalance} Pts)</span>
              </button>
            </div>

            {/* AI Travel Assistant Trigger Button */}
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center space-x-1.5 bg-[#1A1A1A] text-white border border-[#1A1A1A] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_#006633] hover:bg-[#006633] transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Travel Assistant</span>
              <span className="bg-[#006633] text-white text-[8px] px-1 py-0.2 uppercase font-mono">BETA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area based on Sub-Tab */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ==================== SEARCH TAB ==================== */}
        {passengerTab === 'search' && (
          <div className="space-y-8">
            
            {/* Hero Banner matching Editorial Aesthetic */}
            <div className="relative bg-[#1A1A1A] text-white p-8 lg:p-12 border border-[#1A1A1A] shadow-[6px_6px_0px_#006633]">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 bg-[#006633] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  <Bus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kenya Intercity Transport Platform</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-serif italic tracking-tight leading-none text-white">
                  Travel Easy. <br />
                  <span className="not-italic font-sans text-[#F2EFE9] text-3xl sm:text-4xl">Travel Smart.</span>
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
                  Book your bus ticket, track your journey in real-time, and enjoy a smarter way to travel across Kenya with instant M-Pesa payments.
                </p>

                {/* Key Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="flex items-center space-x-2 bg-white/10 p-2.5 border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                    <Bot className="w-4 h-4 text-amber-300" />
                    <span>AI Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 p-2.5 border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Live Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 p-2.5 border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>M-Pesa Direct</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 p-2.5 border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Loyalty Pass</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Search Form Card */}
            <div className="bg-white p-6 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] relative z-20">
              <div className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest mb-4 font-mono">
                Find & Compare Intercity Buses
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* From Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">From</label>
                  <div className="relative">
                    <select
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Eldoret">Eldoret</option>
                      <option value="Nakuru">Nakuru</option>
                    </select>
                  </div>
                </div>

                {/* To Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">To</label>
                  <div className="relative">
                    <select
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Eldoret">Eldoret</option>
                      <option value="Nakuru">Nakuru</option>
                      <option value="Nairobi">Nairobi</option>
                    </select>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => setSearchFilterActive(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>SEARCH BUSES</span>
                  </button>
                </div>
              </div>

              {/* Popular Routes Quick Chips */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-500">Popular Routes:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setOrigin('Nairobi');
                      setDestination('Mombasa');
                      setSearchFilterActive(true);
                    }}
                    className="bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 transition"
                  >
                    Nairobi → Mombasa
                  </button>
                  <button
                    onClick={() => {
                      setOrigin('Nairobi');
                      setDestination('Kisumu');
                      setSearchFilterActive(true);
                    }}
                    className="bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 transition"
                  >
                    Nairobi → Kisumu
                  </button>
                  <button
                    onClick={() => {
                      setOrigin('Nairobi');
                      setDestination('Eldoret');
                      setSearchFilterActive(true);
                    }}
                    className="bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 transition"
                  >
                    Nairobi → Eldoret
                  </button>
                </div>
              </div>
            </div>

            {/* Bus Results List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Available Trips ({filteredTrips.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Prices inclusive of government travel levy
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      
                      {/* Operator & Bus Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow">
                          EC
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-base">{trip.operatorName}</h4>
                            <span className="bg-red-50 text-red-600 border border-red-200 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              {trip.busFleetNumber} ({trip.busRegistration})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {trip.busModel} • {trip.originTerminalName}
                          </p>
                        </div>
                      </div>

                      {/* Route Times & Duration */}
                      <div className="flex items-center space-x-6 text-slate-800">
                        <div className="text-center">
                          <p className="text-lg font-black">{trip.departureTime}</p>
                          <p className="text-xs font-semibold text-slate-500">{trip.origin}</p>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-mono text-slate-400">{trip.durationHours} hrs</span>
                          <div className="w-20 sm:w-28 h-0.5 bg-slate-300 relative my-1">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-600"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900"></div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600">{trip.departureBay}</span>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-black">{trip.estimatedArrivalTime}</p>
                          <p className="text-xs font-semibold text-slate-500">{trip.destination}</p>
                        </div>
                      </div>

                      {/* Fare & Select Seat CTA */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-xs text-slate-400 block font-medium">Per Seat</span>
                          <span className="text-2xl font-black text-slate-900">
                            KSh {trip.fareKsh.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setSelectedSeats([]);
                            setSeatFilter('ALL');
                            setShowOnlyAvailable(false);
                          }}
                          className="bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs px-5 py-2.5 shadow-[2px_2px_0px_#1A1A1A] border border-black transition uppercase tracking-wider"
                        >
                          SELECT SEATS
                        </button>
                      </div>
                    </div>

                    {/* Features, Amenities & Performance Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        {trip.wifi && (
                          <span className="flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <Wifi className="w-3 h-3" />
                            <span>Free WiFi</span>
                          </span>
                        )}
                        {trip.chargingPorts && (
                          <span className="flex items-center space-x-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            <Zap className="w-3 h-3" />
                            <span>Power Outlets</span>
                          </span>
                        )}

                        {/* Trips Taken Pill */}
                        <span className="flex items-center space-x-1 font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-[11px]">
                          <span>🏁</span>
                          <span>{trip.busTripsCompletedCount || 342} Trips Taken</span>
                        </span>

                        {/* Average Speed Pill */}
                        <span className="flex items-center space-x-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <Gauge className="w-3 h-3" />
                          <span>{trip.averageSpeedKmH || 78} km/h Avg</span>
                        </span>

                        {/* Rating Stars Pill */}
                        <button
                          onClick={() => setRatingModalTrip(trip)}
                          className="flex items-center space-x-1 font-mono font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded border border-amber-300 text-[11px] transition"
                        >
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{trip.ratingStars || 4.8}</span>
                          <span className="text-amber-700 font-normal">({trip.ratingCount || 156})</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] font-mono">
                        <span className="text-slate-500">Driver: {trip.driverName}</span>
                        <button
                          onClick={() => setRatingModalTrip(trip)}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-2.5 py-1 text-[10px] uppercase border border-black shadow-[2px_2px_0px_#1A1A1A] transition flex items-center space-x-1"
                        >
                          <Star className="w-3 h-3 fill-slate-900" />
                          <span>Rate Van</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MY BOOKINGS TAB ==================== */}
        {passengerTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">My Travel Bookings</h2>

            <div className="grid grid-cols-1 gap-4">
              {bookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-red-600 text-sm">{b.id}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {b.paymentStatus} ({b.paymentMethod})
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {b.origin} → {b.destination}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Date: {b.departureDate} at {b.departureTime} • {b.departureBay}
                    </p>
                    <p className="text-xs text-slate-700 font-bold">
                      Seat(s): {b.seats.join(', ')} • Passenger: {b.passengerName}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Fare</span>
                      <span className="text-lg font-black text-slate-900">
                        KSh {b.totalAmountKsh.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setViewTicket(b)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
                    >
                      <QrCode className="w-4 h-4 text-red-400" />
                      <span>View Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== LIVE TRACKING TAB ==================== */}
        {passengerTab === 'tracking' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Live Bus & Van GPS Tracking</h2>
                <p className="text-xs text-slate-500">Real-time highway position, speed, trips taken & passenger ratings</p>
              </div>

              {/* Select Active Trip for Tracking */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">Select Van:</span>
                <select
                  value={activeTrackingTripId}
                  onChange={e => setActiveTrackingTripId(e.target.value)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
                >
                  {localTrips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.busRegistration} ({t.origin} → {t.destination})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GPS Tracker Map */}
            {gpsLocations[activeTrackingTripId] && (
              <MapTracker
                gpsData={gpsLocations[activeTrackingTripId]}
                onRateClick={() => {
                  const currentTrip = localTrips.find(t => t.id === activeTrackingTripId);
                  if (currentTrip) setRatingModalTrip(currentTrip);
                }}
              />
            )}

            {/* Live Metrics Grid with Speed, Trips Taken, and Star Ratings */}
            {gpsLocations[activeTrackingTripId] && (() => {
              const currentGps = gpsLocations[activeTrackingTripId];
              const currentTrip = localTrips.find(t => t.id === activeTrackingTripId);
              const tripsCount = currentTrip?.busTripsCompletedCount || currentGps.busTripsCompletedCount || 342;
              const avgSpeed = currentTrip?.averageSpeedKmH || currentGps.averageSpeedKmH || 78;
              const stars = currentTrip?.ratingStars || currentGps.ratingStars || 4.8;
              const reviewCount = currentTrip?.ratingCount || currentGps.ratingCount || 156;

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Distance Covered */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Distance Covered</span>
                      <span className="text-2xl font-black text-slate-900">{currentGps.distanceCoveredKm} km</span>
                    </div>

                    {/* Distance Remaining */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Distance Left</span>
                      <span className="text-2xl font-black text-slate-900">{currentGps.distanceRemainingKm} km</span>
                    </div>

                    {/* Live & Avg Speed */}
                    <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-xs">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block font-mono flex items-center space-x-1">
                        <Gauge className="w-3 h-3 text-emerald-600" />
                        <span>Average Speed</span>
                      </span>
                      <span className="text-2xl font-black text-emerald-900">{avgSpeed} km/h</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Live: {currentGps.speedKmH} km/h</span>
                    </div>

                    {/* Total Trips Taken */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Trips Taken</span>
                      <span className="text-2xl font-black text-slate-900">{tripsCount}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block font-mono">100% Completed</span>
                    </div>

                    {/* Bus Star Rating */}
                    <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block font-mono flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Bus Rating</span>
                      </span>
                      <span className="text-2xl font-black text-amber-900">{stars} ★</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{reviewCount} reviews</span>
                    </div>

                    {/* Rate Trip CTA Card */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-black shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase font-mono block">Passenger Experience</span>
                      <button
                        onClick={() => {
                          if (currentTrip) setRatingModalTrip(currentTrip);
                        }}
                        className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs py-2 px-3 uppercase tracking-wider border border-black shadow-[2px_2px_0px_#006633] transition flex items-center justify-center space-x-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-900" />
                        <span>Rate Trip</span>
                      </button>
                    </div>
                  </div>

                  {/* Passenger Reviews & Ratings Drawer for this Van */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                          <span>Passenger Reviews for {currentGps.busRegistration} ({currentGps.route})</span>
                        </h3>
                        <p className="text-xs text-slate-500">Verified passenger ratings and driver safety feedback</p>
                      </div>

                      <button
                        onClick={() => {
                          if (currentTrip) setRatingModalTrip(currentTrip);
                        }}
                        className="bg-[#006633] hover:bg-[#004d26] text-white font-bold text-xs px-4 py-2 border border-black shadow-[2px_2px_0px_#1A1A1A] transition flex items-center space-x-1.5 uppercase"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate This Van</span>
                      </button>
                    </div>

                    {currentTrip?.reviews && currentTrip.reviews.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentTrip.reviews.map(rev => (
                          <div key={rev.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">{rev.passengerName}</span>
                              <div className="flex items-center space-x-1 text-amber-500 font-bold text-xs">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                  />
                                ))}
                                <span className="ml-1 text-slate-700">{rev.rating}.0</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                            {rev.tags && rev.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {rev.tags.map(tag => (
                                  <span key={tag} className="bg-emerald-100 text-emerald-800 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                                    ✓ {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 block text-right">{rev.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Star className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-500 font-medium">No reviews submitted yet for this van.</p>
                        <button
                          onClick={() => {
                            if (currentTrip) setRatingModalTrip(currentTrip);
                          }}
                          className="mt-2 text-xs text-[#006633] font-bold underline hover:text-[#004d26]"
                        >
                          Be the first passenger to rate this trip!
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== REWARDS TAB ==================== */}
        {passengerTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center space-x-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold mb-3">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{loyalty.tier} Tier Traveler</span>
                </div>

                <h2 className="text-3xl font-black text-white">
                  {loyalty.pointsBalance.toLocaleString()} Loyalty Points
                </h2>
                <p className="text-slate-300 text-xs mt-1">
                  Earn 1 point for every KSh 10 spent on Easy Coach bus bookings.
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Your Referral Code</span>
                <p className="text-xl font-mono font-black text-amber-400 tracking-wider">
                  {loyalty.referralCode}
                </p>
                <p className="text-[10px] text-slate-400">Share with friends to earn 500 bonus points!</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== SEAT SELECTOR MODAL ==================== */}
      {selectedTrip && (() => {
        const availableWindowCount = selectedTrip.seats.filter(s => !s.isBooked && isWindowSeat(s)).length;
        const availableAisleCount = selectedTrip.seats.filter(s => !s.isBooked && isAisleSeat(s)).length;
        const totalAvailableCount = selectedTrip.seats.filter(s => !s.isBooked).length;

        return (
          <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FDFCFB] max-w-xl w-full p-6 shadow-[8px_8px_0px_#1A1A1A] space-y-5 max-h-[92vh] overflow-y-auto border-2 border-[#1A1A1A]">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">Select Bus Seats</h3>
                    <span className="bg-[#006633] text-white text-[9px] font-mono px-2 py-0.5 uppercase tracking-widest font-bold">
                      {selectedTrip.busFleetNumber}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#1A1A1A]/70 font-semibold mt-0.5">
                    {selectedTrip.origin} → {selectedTrip.destination} • {selectedTrip.departureTime} ({selectedTrip.busModel})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="p-1.5 border border-[#1A1A1A] bg-[#F2EFE9] hover:bg-[#1A1A1A] hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-Seat Quick Selection Toolbar */}
              <div className="bg-[#1A1A1A] text-white p-3 border border-[#1A1A1A] space-y-2 font-mono shadow-[2px_2px_0px_#006633]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multiple Seat Quick Selection</span>
                  </span>
                  <span className="text-[8px] text-slate-300 uppercase tracking-wider">
                    {selectedSeats.length} Seat{selectedSeats.length === 1 ? '' : 's'} Chosen
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold">
                  <button
                    onClick={() => selectMultipleSeats(2)}
                    className="bg-white/10 hover:bg-[#006633] text-white py-1.5 px-2 border border-white/20 hover:border-black transition text-center flex items-center justify-center space-x-1"
                    title="Auto-select 2 adjacent seats for a pair"
                  >
                    <span>👥 2 Seats</span>
                  </button>

                  <button
                    onClick={() => selectMultipleSeats(3)}
                    className="bg-white/10 hover:bg-[#006633] text-white py-1.5 px-2 border border-white/20 hover:border-black transition text-center flex items-center justify-center space-x-1"
                    title="Auto-select 3 seats for a group"
                  >
                    <span>👨‍👩‍👧 3 Seats</span>
                  </button>

                  <button
                    onClick={() => selectMultipleSeats(4)}
                    className="bg-white/10 hover:bg-[#006633] text-white py-1.5 px-2 border border-white/20 hover:border-black transition text-center flex items-center justify-center space-x-1"
                    title="Auto-select 4 seats for a family row"
                  >
                    <span>👨‍👩‍👧‍👦 4 Seats</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedSeats.length > 0) {
                        setSelectedSeats([]);
                      } else {
                        selectMultipleSeats(1);
                      }
                    }}
                    className={`py-1.5 px-2 border transition text-center flex items-center justify-center font-bold ${
                      selectedSeats.length > 0
                        ? 'bg-red-700 hover:bg-red-800 text-white border-red-500'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400'
                    }`}
                  >
                    <span>{selectedSeats.length > 0 ? '✕ Clear All' : '+ 1 Seat'}</span>
                  </button>
                </div>
              </div>

              {/* Seat Preference Filter Bar */}
              <div className="bg-[#F2EFE9] p-3 border border-[#1A1A1A] space-y-2.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#006633]" />
                    <span>Filter Seats by Preference</span>
                  </span>

                  <button
                    onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                    className={`text-[9px] font-bold uppercase px-2.5 py-1 border transition flex items-center space-x-1 ${
                      showOnlyAvailable
                        ? 'bg-[#006633] text-white border-black shadow-[1px_1px_0px_#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/40 hover:border-[#1A1A1A]'
                    }`}
                  >
                    {showOnlyAvailable ? <EyeOff className="w-3 h-3 text-amber-300" /> : <Eye className="w-3 h-3 text-[#006633]" />}
                    <span>{showOnlyAvailable ? 'Free Seats Only' : 'Show All'}</span>
                  </button>
                </div>

                {/* Filter Buttons: All, Window, Aisle */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                  <button
                    onClick={() => setSeatFilter('ALL')}
                    className={`py-2 px-2 border text-center transition ${
                      seatFilter === 'ALL'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#006633]'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/30 hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span>All Layout</span>
                    <span className="block text-[8px] opacity-70">({totalAvailableCount} Free)</span>
                  </button>

                  <button
                    onClick={() => setSeatFilter('WINDOW')}
                    className={`py-2 px-2 border text-center transition flex flex-col items-center justify-center ${
                      seatFilter === 'WINDOW'
                        ? 'bg-[#006633] text-white border-black shadow-[2px_2px_0px_#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/30 hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      <span>🪟 Window</span>
                    </span>
                    <span className="block text-[8px] opacity-70">({availableWindowCount} Free)</span>
                  </button>

                  <button
                    onClick={() => setSeatFilter('AISLE')}
                    className={`py-2 px-2 border text-center transition flex flex-col items-center justify-center ${
                      seatFilter === 'AISLE'
                        ? 'bg-[#006633] text-white border-black shadow-[2px_2px_0px_#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/30 hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      <span>🚶 Aisle</span>
                    </span>
                    <span className="block text-[8px] opacity-70">({availableAisleCount} Free)</span>
                  </button>
                </div>

                {/* Active Filter Helper & Quick Selection */}
                <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#1A1A1A]/10 font-sans">
                  <span className="text-[#1A1A1A]/80 font-medium">
                    {seatFilter === 'ALL'
                      ? 'Showing standard layout.'
                      : `Highlighting ${seatFilter === 'WINDOW' ? 'Window (W)' : 'Aisle (A)'} seats.`}
                  </span>

                  {seatFilter !== 'ALL' && (
                    <button
                      onClick={() => autoSelectSeatType(seatFilter)}
                      className="text-[#006633] font-bold underline hover:text-black uppercase font-mono tracking-wider flex items-center space-x-1"
                    >
                      <span>+ Quick Select {seatFilter === 'WINDOW' ? 'Window' : 'Aisle'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] bg-white p-2 border border-[#1A1A1A] font-mono">
                <div className="flex items-center space-x-1">
                  <div className="w-3.5 h-3.5 border border-[#1A1A1A] bg-white" />
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3.5 h-3.5 bg-[#006633] border border-black" />
                  <span className="text-[#006633]">Selected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3.5 h-3.5 bg-[#1A1A1A] border border-black" />
                  <span className="text-slate-400">Booked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3.5 h-3.5 border-2 border-amber-600 bg-amber-200" />
                  <span className="text-amber-800">Filtered</span>
                </div>
              </div>

              {/* Graphical Bus Seat Layout */}
              <div className="bg-[#F2EFE9] p-5 border-2 border-[#1A1A1A] max-w-sm mx-auto space-y-4 shadow-[4px_4px_0px_#1A1A1A]">
                
                {/* Front Dashboard & Steering Wheel */}
                <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-2 text-[#1A1A1A] text-[10px] font-bold uppercase font-mono tracking-widest">
                  <div className="flex items-center space-x-1">
                    <Bus className="w-3.5 h-3.5 text-[#006633]" />
                    <span>Driver Cab</span>
                  </div>
                  <div className="bg-[#1A1A1A] text-white px-2 py-0.5 text-[8px] font-mono">Passenger Entrance</div>
                </div>

                {/* Seats Grid (4 Columns) */}
                <div className="grid grid-cols-4 gap-2">
                  {selectedTrip.seats.map((seat, seatIdx) => {
                    const isSelected = selectedSeats.includes(seat.number);
                    const win = isWindowSeat(seat);
                    const ais = isAisleSeat(seat);

                    let matchesFilter = true;
                    if (seatFilter === 'WINDOW') matchesFilter = win;
                    if (seatFilter === 'AISLE') matchesFilter = ais;

                    const animDelay = `${Math.min(seatIdx * 12, 350)}ms`;

                    if (showOnlyAvailable && seat.isBooked) {
                      return (
                        <div
                          key={seat.id}
                          style={{ animationDelay: animDelay }}
                          className="animate-seat-pop h-11 border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[8px] font-mono text-slate-300"
                        >
                          ✕
                        </div>
                      );
                    }

                    const attributes = getSeatAttributes(seat, selectedTrip);

                    return (
                      <button
                        key={seat.id}
                        disabled={seat.isBooked}
                        onClick={() => toggleSeat(seat.number, seat.isBooked)}
                        title={isSelected ? `Click to remove Seat ${seat.number}` : `Select Seat ${seat.number}`}
                        style={{ animationDelay: animDelay }}
                        className={`animate-seat-pop group relative h-11 border text-xs font-bold transition-all duration-200 ease-out flex flex-col items-center justify-center font-mono shadow-[1px_1px_0px_#1A1A1A] hover:z-30 z-10 hover:-translate-y-0.5 active:scale-95 ${
                          seat.isBooked
                            ? 'bg-[#1A1A1A] text-slate-500 border-[#1A1A1A] cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#006633] text-white border-black ring-2 ring-amber-400 font-extrabold shadow-[2px_2px_0px_#1A1A1A]'
                            : matchesFilter && seatFilter !== 'ALL'
                            ? 'bg-amber-200 text-[#1A1A1A] border-amber-600 ring-2 ring-amber-500 font-extrabold'
                            : matchesFilter
                            ? 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#006633] hover:text-white'
                            : 'bg-slate-100 text-slate-400 border-slate-300 opacity-30 hover:opacity-100'
                        }`}
                      >
                        <span className="text-xs">{seat.number}</span>
                        <span
                          className={`text-[7px] uppercase font-mono font-bold leading-none ${
                            isSelected
                              ? 'text-amber-300'
                              : matchesFilter && seatFilter !== 'ALL'
                              ? 'text-amber-900 font-extrabold'
                              : 'text-slate-400'
                          }`}
                        >
                          {win ? 'W' : 'A'}
                        </span>

                        {/* Interactive Remove Badge / Hover Overlay for Selected Seats directly in Grid */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-red-700 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Trash2 className="w-3 h-3 text-amber-300 mb-0.5" />
                            <span className="text-[7px] font-mono font-black uppercase tracking-widest">REMOVE</span>
                          </div>
                        )}

                        {/* Custom Seat Attributes Tooltip on Hover */}
                        <div
                          className={`absolute hidden group-hover:flex flex-col items-center z-50 pointer-events-none w-44 transition-all duration-150 ${
                            seat.row <= 2
                              ? 'top-full mt-2'
                              : 'bottom-full mb-2'
                          } ${
                            seat.column === 1
                              ? 'left-0 translate-x-0'
                              : seat.column === 4
                              ? 'right-0 left-auto translate-x-0'
                              : 'left-1/2 -translate-x-1/2'
                          }`}
                        >
                          {seat.row <= 2 && (
                            <div className="w-2.5 h-2.5 bg-[#1A1A1A] rotate-45 -mb-1 border-l border-t border-black z-10" />
                          )}

                          <div className="bg-[#1A1A1A] text-white text-[9px] p-2.5 border-2 border-black shadow-[4px_4px_0px_#006633] font-mono leading-tight w-full text-left space-y-1.5 rounded-none">
                            <div className="flex items-center justify-between border-b border-white/20 pb-1 font-bold">
                              <span className="text-amber-300 font-mono text-[11px]">Seat {seat.number}</span>
                              <span className="bg-[#006633] text-white text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold border border-white/20">
                                {seat.class}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-300">Fare:</span>
                              <span className="font-bold text-emerald-400 font-mono">KSh {seat.priceKsh.toLocaleString()}</span>
                            </div>

                            <div className="space-y-1 pt-1 border-t border-white/10">
                              <span className="text-[8px] text-amber-200/90 font-bold uppercase font-mono tracking-wider block">
                                Seat Attributes:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {attributes.map((attr, i) => (
                                  <span
                                    key={i}
                                    className="bg-white/10 border border-white/20 text-white text-[8px] px-1.5 py-0.5 font-sans font-medium whitespace-nowrap"
                                  >
                                    {attr}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-1 border-t border-white/10 text-center font-bold text-[8px] font-mono uppercase tracking-wider">
                              {seat.isBooked ? (
                                <span className="text-red-400">❌ Reserved</span>
                              ) : isSelected ? (
                                <span className="text-amber-300">✓ Click to Remove</span>
                              ) : (
                                <span className="text-emerald-300">⚡ Click to Select</span>
                              )}
                            </div>
                          </div>

                          {seat.row > 2 && (
                            <div className="w-2.5 h-2.5 bg-[#1A1A1A] rotate-45 -mt-1 border-r border-b border-black z-10" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Rear Bus Tail Indicator */}
                <div className="pt-2 border-t border-[#1A1A1A]/20 text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                    Rear Engine & Luggage Bay
                  </span>
                </div>
              </div>

              {/* Selected Seats Direct Removal List */}
              {selectedSeats.length > 0 && (
                <div className="bg-[#F2EFE9] border border-[#1A1A1A] p-3 font-mono space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                    <span className="flex items-center space-x-1.5">
                      <Armchair className="w-3.5 h-3.5 text-[#006633]" />
                      <span>Active Selection ({selectedSeats.length})</span>
                    </span>
                    <span className="text-[8px] text-slate-500">Tap 'Remove' to deselect</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.map(seatNum => (
                      <div
                        key={seatNum}
                        className="bg-[#006633] text-white text-[10px] font-bold px-2.5 py-1 border border-black flex items-center space-x-2 shadow-[1px_1px_0px_#1A1A1A]"
                      >
                        <span>Seat {seatNum}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSeat(seatNum, false);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-[8px] px-1.5 py-0.5 font-black uppercase tracking-wider flex items-center space-x-0.5 border border-white/30 transition"
                          title={`Deselect Seat ${seatNum}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Fare & Proceed Button */}
              <div className="flex items-center justify-between border-t-2 border-[#1A1A1A] pt-4">
                <div>
                  <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest block">
                    Selected ({selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'})
                  </span>
                  <span className="text-2xl font-black text-[#1A1A1A] font-mono">
                    KSh {totalFareKsh.toLocaleString()}
                  </span>
                </div>

                <div className="flex space-x-2">
                  {selectedSeats.length > 0 && (
                    <button
                      onClick={() => setSelectedSeats([])}
                      className="px-3 py-2 text-[10px] font-mono font-bold uppercase text-slate-600 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => setShowCheckoutModal(true)}
                    className={`font-bold text-xs px-6 py-3 border border-black font-mono uppercase tracking-widest shadow-[3px_3px_0px_#1A1A1A] transition ${
                      selectedSeats.length > 0
                        ? 'bg-[#006633] hover:bg-[#004d26] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300'
                    }`}
                  >
                    PROCEED TO PAYMENT
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== CHECKOUT & PAYMENT MODAL ==================== */}
      {showCheckoutModal && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Complete Reservation</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Passenger Inputs */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Passenger Name</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={e => setPassengerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">M-Pesa Phone Number</label>
                <input
                  type="text"
                  value={passengerPhone}
                  onChange={e => setPassengerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MPESA')}
                    className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition ${
                      paymentMethod === 'MPESA'
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-emerald-800 text-xs flex items-center justify-between">
                      M-PESA STK
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] text-emerald-600">Instant STK Prompt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH_TERMINAL')}
                    className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition ${
                      paymentMethod === 'CASH_TERMINAL'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-amber-900 text-xs flex items-center justify-between">
                      Pay at Terminal
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] text-amber-700">Cashier Counter</span>
                  </button>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Seats ({selectedSeats.join(', ')})</span>
                  <span>KSh {totalFareKsh.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="text-red-600">KSh {totalFareKsh.toLocaleString()}</span>
                </div>
              </div>

              {/* Simulated STK Dialog */}
              {stkPromptSimulated && (
                <div className="bg-emerald-900 text-white p-4 rounded-2xl text-center space-y-2 animate-bounce">
                  <p className="font-bold text-xs">📱 Check your phone for M-Pesa PIN Prompt</p>
                  <p className="text-[11px] text-emerald-200">Enter M-Pesa PIN to authorize KSh {totalFareKsh}</p>
                </div>
              )}

              <button
                disabled={isProcessingPayment}
                onClick={handleProceedBooking}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
              >
                {isProcessingPayment ? (
                  <span>Processing M-Pesa...</span>
                ) : (
                  <span>CONFIRM & PAY KSh {totalFareKsh.toLocaleString()}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DIGITAL TICKET & BOARDING PASS MODAL ==================== */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-6 text-slate-900 relative">
            <button
              onClick={() => setViewTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ticket Branding Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center space-x-1 text-red-600 font-black text-lg">
                <Bus className="w-5 h-5" />
                <span>EASY COACH</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                Digital Boarding Pass
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <QRCodeSVG value={viewTicket.qrCodeValue} size={160} />
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">
                {viewTicket.id}
              </span>
            </div>

            {/* Ticket Details Grid */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Passenger</span>
                  <span className="font-bold text-slate-900">{viewTicket.passengerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Seat Number(s)</span>
                  <span className="font-bold text-red-600">{viewTicket.seats.join(', ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Route</span>
                  <span className="font-bold text-slate-900">
                    {viewTicket.origin} → {viewTicket.destination}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Departure Bay</span>
                  <span className="font-bold text-emerald-600">{viewTicket.departureBay}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Date & Time</span>
                  <span className="font-bold text-slate-900">
                    {viewTicket.departureDate} ({viewTicket.departureTime})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Payment Ref</span>
                  <span className="font-mono font-bold text-slate-700">
                    {viewTicket.mpesaReceiptNumber || viewTicket.cashierConfirmationCode || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Boarding pass saved to offline wallet!')}
              className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl shadow hover:bg-slate-800 transition"
            >
              DOWNLOAD / SAVE TO WALLET
            </button>
          </div>
        </div>
      )}

      {/* ==================== RATE TRIP & VAN MODAL ==================== */}
      {ratingModalTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 font-black text-sm flex items-center justify-center border border-black shadow-[2px_2px_0px_#1A1A1A]">
                  ★
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Rate Your Van & Trip Experience</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {ratingModalTrip.busRegistration} ({ratingModalTrip.busFleetNumber}) • {ratingModalTrip.origin} → {ratingModalTrip.destination}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRatingModalTrip(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success State or Rating Form */}
            {ratingSubmittedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your rating for <span className="font-bold">{ratingModalTrip.busRegistration}</span> has been published. Safe travels!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                {/* Vehicle Quick Stats Banner */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Driver</span>
                    <span className="font-bold text-slate-800">{ratingModalTrip.driverName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Trips Taken</span>
                    <span className="font-bold text-emerald-700">{ratingModalTrip.busTripsCompletedCount || 342} trips</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Avg Speed</span>
                    <span className="font-bold text-slate-800">{ratingModalTrip.averageSpeedKmH || 78} km/h</span>
                  </div>
                </div>

                {/* Star Selector */}
                <div className="text-center space-y-2 py-2 bg-amber-50/50 rounded-2xl border border-amber-200/60 p-4">
                  <span className="text-xs font-bold text-slate-700 block uppercase font-mono">
                    Select Your Rating Star Score:
                  </span>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map(starNum => {
                      const isFilled = starNum <= (hoverStars || selectedStars);
                      return (
                        <button
                          type="button"
                          key={starNum}
                          onMouseEnter={() => setHoverStars(starNum)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setSelectedStars(starNum)}
                          className="p-1 transition transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`w-9 h-9 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                : 'text-slate-300 fill-slate-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-800 block">
                    {selectedStars === 5 && '⭐⭐⭐⭐⭐ 5/5 - Excellent & Highly Recommended!'}
                    {selectedStars === 4 && '⭐⭐⭐⭐ 4/5 - Very Good & Punctual'}
                    {selectedStars === 3 && '⭐⭐⭐ 3/5 - Average Journey'}
                    {selectedStars === 2 && '⭐⭐ 2/5 - Needs Improvement'}
                    {selectedStars === 1 && '⭐ 1/5 - Unsatisfactory'}
                  </span>
                </div>

                {/* Feedback Tags Checklist */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block uppercase font-mono">
                    What did you appreciate most?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '🏁 Safe Driving',
                      '🧹 Clean Bus & Seats',
                      '⏱️ On-time Departure',
                      '🛋️ Great Legroom',
                      '📶 Fast WiFi',
                      '😊 Friendly Crew',
                      '🔌 Working Power Outlets',
                      '❄️ Great AC'
                    ].map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleRatingTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition ${
                            isSelected
                              ? 'bg-[#006633] text-white border-black font-bold shadow-[2px_2px_0px_#1A1A1A]'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Text Area */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase font-mono">
                    Write a Passenger Review (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Tell other passengers about the driver speed, road comfort, and departure bay punctuality..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRatingModalTrip(null)}
                    className="w-1/3 py-3 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition uppercase font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs border border-black shadow-[3px_3px_0px_#1A1A1A] transition uppercase tracking-wider font-mono flex items-center justify-center space-x-1.5"
                  >
                    <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                    <span>Submit Rating & Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating AI Travel Advisor Widget Button */}
      {!isAiOpen && (
        <button
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#1A1A1A] hover:bg-[#006633] text-white border-2 border-white px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_#006633] flex items-center space-x-2 transition transform hover:-translate-y-1"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>Ask SafiriAI Advisor</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* ==================== AI TRAVEL ASSISTANT DRAWER ==================== */}
      <AiTravelAdvisorChatbot
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectRoute={(org, dst) => {
          setOrigin(org);
          setDestination(dst);
          setSearchFilterActive(true);
          setPassengerTab('search');
        }}
      />
    </div>
  );
};
