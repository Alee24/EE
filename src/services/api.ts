import { Trip, Booking, Vehicle, MaintenanceRecord } from '../types';

export async function fetchInitialData() {
  try {
    const res = await fetch('/api/initial-data');
    if (!res.ok) throw new Error('Failed to load backend state');
    return await res.json();
  } catch (err) {
    console.warn('API error, relying on client fallback', err);
    return null;
  }
}

export async function searchTrips(origin: string, destination: string, date: string) {
  try {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);

    const res = await fetch(`/api/search-trips?${params.toString()}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.trips as Trip[];
  } catch (err) {
    console.error('searchTrips error', err);
    return [];
  }
}

export async function createBooking(payload: {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatsSelected: string[];
  paymentMethod: 'MPESA' | 'CASH_TERMINAL';
}) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to complete booking');
  }
  return await res.json();
}

export async function triggerMpesaStkPush(phone: string, amount: number, bookingId: string) {
  const res = await fetch('/api/payments/mpesa-stk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount, bookingId }),
  });
  return await res.json();
}

export async function confirmTerminalCash(bookingId: string, cashierId: string = 'CSH-01') {
  const res = await fetch('/api/payments/cash-confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, cashierId }),
  });
  return await res.json();
}

export async function askTravelAssistant(prompt: string) {
  const res = await fetch('/api/ai/travel-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return await res.json();
}

export async function askBusinessAnalyst(query: string) {
  const res = await fetch('/api/ai/business-analyst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return await res.json();
}

export async function getRouteIntelligence(origin: string, destination: string) {
  const res = await fetch('/api/ai/route-intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  });
  return await res.json();
}
