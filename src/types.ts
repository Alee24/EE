export type AppRole = 'passenger' | 'operator' | 'admin';

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Operator {
  id: string;
  name: string;
  logoUrl?: string;
  code: string; // e.g. 'EC', 'MC', 'RE'
  commissionRate: number; // e.g., 0.065 for 6.5%
  rating: number;
  contactEmail: string;
  contactPhone: string;
  activeBusesCount: number;
  totalTripsCount: number;
  monthlyRevenueKsh: number;
}

export interface Terminal {
  id: string;
  name: string;
  city: string;
  address: string;
  totalBays: number;
  cashierCounters: number;
  coordinates: { lat: number; lng: number };
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationHours: number;
  popularRank?: number;
  intermediateStops: string[];
  baseFareKsh: number;
}

export interface Vehicle {
  id: string;
  operatorId: string;
  registrationNumber: string; // e.g. 'KDA 123A'
  fleetNumber: string; // e.g. 'BUS-014'
  model: string; // e.g. 'Scania F360', 'Isuzu FRR'
  capacity: number; // e.g. 49
  seatLayoutType: '2x2_standard' | '2x1_vip' | '2x2_executive';
  wifiAvailable: boolean;
  acAvailable: boolean;
  chargingPorts: boolean;
  recliningSeats: boolean;
  mileageKm: number;
  lastServiceDate: string;
  nextServiceDueDate: string;
  insuranceExpiryDate: string;
  inspectionExpiryDate: string;
  status: 'active' | 'maintenance' | 'out_of_service';
  fuelLevelPercent: number;
}

export interface Driver {
  id: string;
  operatorId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  rating: number;
  tripsCompleted: number;
  assignedBusReg?: string;
  status: 'available' | 'on_trip' | 'off_duty';
  hoursWorkedThisWeek: number;
}

export interface Conductor {
  id: string;
  operatorId: string;
  name: string;
  phone: string;
  assignedBusReg?: string;
  rating: number;
}

export interface Seat {
  id: string;
  number: string; // e.g., '1A', '12B', ' VIP-1'
  row: number;
  column: number;
  class: 'standard' | 'executive' | 'vip';
  priceKsh: number;
  isBooked: boolean;
  isWindow: boolean;
  isAisle: boolean;
  bookedByPassengerName?: string;
}

export interface Trip {
  id: string;
  operatorId: string;
  operatorName: string;
  routeId: string;
  origin: string;
  destination: string;
  busRegistration: string;
  busModel: string;
  busFleetNumber: string;
  driverId: string;
  driverName: string;
  conductorName: string;
  departureTime: string; // e.g. '07:00 AM'
  departureDate: string; // e.g. '2026-08-10'
  estimatedArrivalTime: string; // e.g. '02:30 PM'
  durationHours: number;
  originTerminalId: string;
  originTerminalName: string;
  destinationTerminalId: string;
  destinationTerminalName: string;
  departureBay: string;
  fareKsh: number;
  availableSeatsCount: number;
  totalSeatsCount: number;
  status: 'SCHEDULED' | 'BOARDING' | 'EN_ROUTE' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  delayMinutes: number;
  occupancyPercent: number;
  wifi: boolean;
  ac: boolean;
  chargingPorts: boolean;
  recliningSeats: boolean;
  seats: Seat[];
  busTripsCompletedCount?: number;
  averageSpeedKmH?: number;
  ratingStars?: number;
  ratingCount?: number;
  reviews?: Array<{
    id: string;
    passengerName: string;
    rating: number;
    comment: string;
    date: string;
    tags?: string[];
  }>;
}

export interface Booking {
  id: string; // e.g. 'ECB89231'
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  tripId: string;
  operatorName: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  departureBay: string;
  seats: string[]; // e.g., ['18B', '18C']
  totalAmountKsh: number;
  paymentMethod: 'MPESA' | 'CASH_TERMINAL';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  mpesaReceiptNumber?: string;
  cashierConfirmationCode?: string;
  qrCodeValue: string;
  boardingStatus: 'NOT_BOARDED' | 'BOARDED' | 'NO_SHOW';
  bookedAt: string;
}

export interface GPSLocation {
  tripId: string;
  busRegistration: string;
  route: string;
  driverName: string;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  headingDegree: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  estimatedArrival: string;
  predictedDelayMinutes: number;
  lastUpdated: string;
  nearestTown: string;
  routeWaypoints: Array<{ lat: number; lng: number; name: string }>;
  busTripsCompletedCount?: number;
  averageSpeedKmH?: number;
  ratingStars?: number;
  ratingCount?: number;
  reviews?: Array<{
    id: string;
    passengerName: string;
    rating: number;
    comment: string;
    date: string;
    tags?: string[];
  }>;
}

export interface MaintenanceRecord {
  id: string;
  busRegistration: string;
  busModel: string;
  type: 'Oil Change' | 'Brake Service' | 'Tire Replacement' | 'Engine Overhaul' | 'AC Repair';
  costKsh: number;
  serviceDate: string;
  garageName: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'URGENT';
  notes: string;
}

export interface FuelLog {
  id: string;
  busRegistration: string;
  date: string;
  liters: number;
  costPerLiterKsh: number;
  totalCostKsh: number;
  stationName: string;
  odometerKm: number;
}

export interface LoyaltyAccount {
  passengerId: string;
  pointsBalance: number;
  tier: LoyaltyTier;
  referralCode: string;
  totalSpentKsh: number;
  tripsCount: number;
}

export interface AIRecommendation {
  id: string;
  type: 'DEMAND' | 'MAINTENANCE' | 'ROUTE_TIMING' | 'PRICING';
  title: string;
  description: string;
  impactKsh?: number;
  actionText: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'SEARCH' | 'BOOK' | 'TRACK';
    payload?: any;
  };
}
