import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PassengerApp } from './components/passenger/PassengerApp';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { AiTravelAdvisorChatbot } from './components/common/AiTravelAdvisorChatbot';
import {
  AppRole,
  Operator,
  Trip,
  Booking,
  GPSLocation,
  Vehicle,
  Driver,
  Conductor,
  Terminal,
  MaintenanceRecord,
  FuelLog,
  LoyaltyAccount
} from './types';
import {
  INITIAL_OPERATORS,
  INITIAL_TERMINALS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_CONDUCTORS,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_GPS_LOCATIONS,
  INITIAL_MAINTENANCE,
  INITIAL_FUEL,
  INITIAL_LOYALTY
} from './data/mockData';
import { fetchInitialData } from './services/api';

export default function App() {
  const [currentRole, setCurrentRole] = useState<AppRole>('passenger');
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
  const [selectedOperator, setSelectedOperator] = useState<Operator>(INITIAL_OPERATORS[0]);
  const [terminals, setTerminals] = useState<Terminal[]>(INITIAL_TERMINALS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [conductors, setConductors] = useState<Conductor[]>(INITIAL_CONDUCTORS);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [gpsLocations, setGpsLocations] = useState<Record<string, GPSLocation>>(INITIAL_GPS_LOCATIONS);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(INITIAL_FUEL);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount>(INITIAL_LOYALTY);
  const [isGlobalAiOpen, setIsGlobalAiOpen] = useState(false);

  // Load state from backend Express REST API on mount
  useEffect(() => {
    async function initData() {
      const data = await fetchInitialData();
      if (data) {
        if (data.operators) setOperators(data.operators);
        if (data.terminals) setTerminals(data.terminals);
        if (data.vehicles) setVehicles(data.vehicles);
        if (data.drivers) setDrivers(data.drivers);
        if (data.conductors) setConductors(data.conductors);
        if (data.trips) setTrips(data.trips);
        if (data.bookings) setBookings(data.bookings);
        if (data.gpsLocations) setGpsLocations(data.gpsLocations);
        if (data.maintenanceRecords) setMaintenanceRecords(data.maintenanceRecords);
        if (data.fuelLogs) setFuelLogs(data.fuelLogs);
        if (data.loyalty) setLoyalty(data.loyalty);
      }
    }
    initData();
  }, []);

  // Handler when passenger creates new booking
  const handleBookingCreated = (newBooking: Booking, updatedTrip: Trip, updatedLoyalty: LoyaltyAccount) => {
    setBookings(prev => [newBooking, ...prev]);
    setTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
    setLoyalty(updatedLoyalty);
  };

  // Handler when cashier confirms cash payment
  const handleCashConfirmed = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, paymentStatus: 'PAID' } : b))
    );
  };

  // Fleet Admin & Operator Handlers
  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
  };

  const handleUpdateTripStatus = (tripId: string, newStatus: Trip['status'], delayMins?: number) => {
    setTrips(prev =>
      prev.map(t => (t.id === tripId ? { ...t, status: newStatus, delayMinutes: delayMins ?? t.delayMinutes } : t))
    );
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const handleUpdateVehicleStatus = (vehicleId: string, status: Vehicle['status']) => {
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, status } : v)));
  };

  const handleAddDriver = (newDriver: Driver) => {
    setDrivers(prev => [newDriver, ...prev]);
  };

  const handleAddConductor = (newConductor: Conductor) => {
    setConductors(prev => [newConductor, ...prev]);
  };

  const handleAddBookingOffline = (newBooking: Booking, tripId: string, seatNumbers: string[]) => {
    setBookings(prev => [newBooking, ...prev]);
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const updatedSeats = t.seats.map(s =>
            seatNumbers.includes(s.number) ? { ...s, isBooked: true, bookedByPassengerName: newBooking.passengerName } : s
          );
          const avail = updatedSeats.filter(s => !s.isBooked).length;
          const occ = Math.round(((t.totalSeatsCount - avail) / t.totalSeatsCount) * 100);
          return { ...t, seats: updatedSeats, availableSeatsCount: avail, occupancyPercent: occ };
        }
        return t;
      })
    );
  };

  const handleAddMaintenance = (newRecord: MaintenanceRecord) => {
    setMaintenanceRecords(prev => [newRecord, ...prev]);
  };

  const handleAddFuelLog = (newLog: FuelLog) => {
    setFuelLogs(prev => [newLog, ...prev]);
  };

  const handleBoardingStatusChange = (bookingId: string, status: Booking['boardingStatus']) => {
    setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, boardingStatus: status } : b)));
  };

  // SuperAdmin Handlers
  const handleAddOperator = (newOp: Operator) => {
    setOperators(prev => [newOp, ...prev]);
  };

  const handleToggleOperatorStatus = (operatorId: string) => {
    setOperators(prev =>
      prev.map(op =>
        op.id === operatorId
          ? { ...op, activeBusesCount: op.activeBusesCount > 0 ? 0 : 25 }
          : op
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        selectedOperator={selectedOperator}
        setSelectedOperator={setSelectedOperator}
        operators={operators}
        notificationsCount={3}
        onOpenAiAdvisor={() => setIsGlobalAiOpen(true)}
      />

      <div className="flex-1">
        {currentRole === 'passenger' && (
          <PassengerApp
            trips={trips}
            bookings={bookings}
            gpsLocations={gpsLocations}
            loyalty={loyalty}
            onBookingCreated={handleBookingCreated}
          />
        )}

        {currentRole === 'operator' && (
          <OperatorDashboard
            selectedOperator={selectedOperator}
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            conductors={conductors}
            bookings={bookings}
            terminals={terminals}
            maintenanceRecords={maintenanceRecords}
            fuelLogs={fuelLogs}
            onCashConfirmed={handleCashConfirmed}
            onAddTrip={handleAddTrip}
            onUpdateTripStatus={handleUpdateTripStatus}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onAddDriver={handleAddDriver}
            onAddConductor={handleAddConductor}
            onAddBookingOffline={handleAddBookingOffline}
            onAddMaintenance={handleAddMaintenance}
            onAddFuelLog={handleAddFuelLog}
            onBoardingStatusChange={handleBoardingStatusChange}
          />
        )}

        {currentRole === 'admin' && (
          <SuperAdminDashboard
            operators={operators}
            bookings={bookings}
            onAddOperator={handleAddOperator}
            onToggleOperatorStatus={handleToggleOperatorStatus}
          />
        )}
      </div>

      {/* Global AI Travel Advisor Chatbot Drawer */}
      <AiTravelAdvisorChatbot
        isOpen={isGlobalAiOpen}
        onClose={() => setIsGlobalAiOpen(false)}
        onSelectRoute={() => {
          setCurrentRole('passenger');
        }}
      />
    </div>
  );
}
