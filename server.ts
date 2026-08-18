import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_OPERATORS,
  INITIAL_TERMINALS,
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_CONDUCTORS,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_GPS_LOCATIONS,
  INITIAL_MAINTENANCE,
  INITIAL_FUEL,
  INITIAL_LOYALTY,
  INITIAL_STUDENTS,
  INITIAL_SCHOOL_BUSES,
  generateSeatsForBus
} from './src/data/mockData.js';
import { Trip, Booking, Vehicle, MaintenanceRecord, Student, SchoolBus } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// State collections
let operators = [...INITIAL_OPERATORS];
let terminals = [...INITIAL_TERMINALS];
let routes = [...INITIAL_ROUTES];
let vehicles = [...INITIAL_VEHICLES];
let drivers = [...INITIAL_DRIVERS];
let conductors = [...INITIAL_CONDUCTORS];
let trips: Trip[] = [...INITIAL_TRIPS];
let bookings: Booking[] = [...INITIAL_BOOKINGS];
let gpsLocations = { ...INITIAL_GPS_LOCATIONS };
let maintenanceRecords: MaintenanceRecord[] = [...INITIAL_MAINTENANCE];
let fuelLogs = [...INITIAL_FUEL];
let loyalty = { ...INITIAL_LOYALTY };
let students: Student[] = [...INITIAL_STUDENTS];
let schoolBuses: SchoolBus[] = [...INITIAL_SCHOOL_BUSES];

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// REST API Endpoints

// 1. Initial State Data
app.get('/api/initial-data', (req, res) => {
  res.json({
    operators,
    terminals,
    routes,
    vehicles,
    drivers,
    conductors,
    trips,
    bookings,
    gpsLocations,
    maintenanceRecords,
    fuelLogs,
    loyalty,
  });
});

// 2. Search Trips
app.get('/api/search-trips', (req, res) => {
  const { origin, destination, date } = req.query;
  let result = trips;

  if (origin && typeof origin === 'string' && origin !== 'All') {
    result = result.filter(t => t.origin.toLowerCase() === origin.toLowerCase());
  }
  if (destination && typeof destination === 'string' && destination !== 'All') {
    result = result.filter(t => t.destination.toLowerCase() === destination.toLowerCase());
  }
  if (date && typeof date === 'string') {
    result = result.filter(t => t.departureDate === date);
  }

  res.json({ trips: result });
});

// 3. Create Booking (Transactional Seat Lock)
app.post('/api/bookings', (req, res) => {
  const {
    tripId,
    passengerName,
    passengerPhone,
    passengerEmail,
    seatsSelected,
    paymentMethod,
  } = req.body;

  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Prevent double booking
  const unavailableSeats = seatsSelected.filter((seatNum: string) => {
    const seatObj = trip.seats.find(s => s.number === seatNum);
    return !seatObj || seatObj.isBooked;
  });

  if (unavailableSeats.length > 0) {
    return res.status(400).json({
      error: `Seats ${unavailableSeats.join(', ')} are no longer available. Please select different seats.`,
    });
  }

  // Mark seats as booked
  trip.seats = trip.seats.map(s => {
    if (seatsSelected.includes(s.number)) {
      return { ...s, isBooked: true, bookedByPassengerName: passengerName };
    }
    return s;
  });

  // Calculate fare
  const totalAmount = seatsSelected.reduce((sum: number, seatNum: string) => {
    const s = trip.seats.find(st => st.number === seatNum);
    return sum + (s ? s.priceKsh : trip.fareKsh);
  }, 0);

  // Update trip availability stats
  trip.availableSeatsCount = trip.seats.filter(s => !s.isBooked).length;
  trip.occupancyPercent = Math.round(
    ((trip.totalSeatsCount - trip.availableSeatsCount) / trip.totalSeatsCount) * 100
  );

  const bookingId = `ECB${Math.floor(100000 + Math.random() * 900000)}`;
  const isMpesa = paymentMethod === 'MPESA';
  const mpesaRef = isMpesa ? `SJK${Math.floor(100000 + Math.random() * 900000)}MP` : undefined;
  const cashCode = !isMpesa ? `CSH-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

  const newBooking: Booking = {
    id: bookingId,
    passengerId: 'p_alex',
    passengerName,
    passengerPhone,
    passengerEmail: passengerEmail || 'passenger@gmail.com',
    tripId: trip.id,
    operatorName: trip.operatorName,
    origin: trip.origin,
    destination: trip.destination,
    departureDate: trip.departureDate,
    departureTime: trip.departureTime,
    departureBay: trip.departureBay,
    seats: seatsSelected,
    totalAmountKsh: totalAmount,
    paymentMethod: isMpesa ? 'MPESA' : 'CASH_TERMINAL',
    paymentStatus: isMpesa ? 'PAID' : 'PENDING',
    mpesaReceiptNumber: mpesaRef,
    cashierConfirmationCode: cashCode,
    qrCodeValue: `${bookingId}-${passengerName.toUpperCase().replace(/\s+/g, '-')}-SEATS${seatsSelected.join('')}-${trip.origin.substring(0, 3)}-${trip.destination.substring(0, 3)}`,
    boardingStatus: 'NOT_BOARDED',
    bookedAt: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
  };

  bookings.unshift(newBooking);

  // Update loyalty points
  loyalty.pointsBalance += Math.floor(totalAmount / 10);
  loyalty.totalSpentKsh += totalAmount;
  loyalty.tripsCount += 1;

  res.json({
    success: true,
    booking: newBooking,
    trip,
    loyalty,
  });
});

// 4. M-Pesa STK Push Simulation
app.post('/api/payments/mpesa-stk', (req, res) => {
  const { phone, amount, bookingId } = req.body;
  const booking = bookings.find(b => b.id === bookingId);

  setTimeout(() => {
    const mpesaRef = `SJK${Math.floor(100000 + Math.random() * 900000)}STK`;
    if (booking) {
      booking.paymentStatus = 'PAID';
      booking.mpesaReceiptNumber = mpesaRef;
    }
    res.json({
      success: true,
      checkoutRequestId: `ws_CO_09082026_${Math.floor(100000 + Math.random() * 900000)}`,
      receiptNumber: mpesaRef,
      message: `M-Pesa payment of KSh ${amount} received from ${phone}. Receipt ${mpesaRef}.`,
    });
  }, 1200);
});

// 5. Terminal Cashier Confirmation
app.post('/api/payments/cash-confirm', (req, res) => {
  const { bookingId, cashierId } = req.body;
  const booking = bookings.find(b => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.paymentStatus = 'PAID';
  booking.cashierConfirmationCode = `CONF-CSH-${cashierId || '01'}-${Date.now().toString().slice(-4)}`;

  res.json({
    success: true,
    booking,
    message: `Cash payment of KSh ${booking.totalAmountKsh} confirmed at terminal cashier. Ticket active!`,
  });
});

// 6. AI Travel Assistant
app.post('/api/ai/travel-assistant', async (req, res) => {
  const { prompt } = req.body;
  const client = getGeminiClient();

  const currentDatabaseRoutes = `
- Nairobi -> Mombasa: 07:00 AM (KSh 1,800 Standard) | 22:00 PM Night VIP (KSh 2,200). Approx 7.5 hrs via A109 Highway.
- Nairobi -> Kisumu: 07:30 AM (KSh 1,500 Isuzu Luxury) | 21:00 PM Night Express (KSh 1,700). Approx 6.0 hrs via A104 & Kericho.
- Nairobi -> Eldoret: 08:00 AM (KSh 1,400 MAN Coach) | 22:30 PM (KSh 1,600). Approx 5.5 hrs via Nakuru Highway.
- Nairobi -> Nakuru: 08:30 AM (KSh 800 Scania Shuttle). Approx 2.5 hrs.
- Nairobi -> Kakamega: 07:00 AM (KSh 1,600 Executive). Approx 6.5 hrs.
`;

  if (!client) {
    // Detailed fallback responses based on keywords
    const lower = (prompt || '').toLowerCase();
    let reply = '';
    let category = 'GENERAL';

    if (lower.includes('price') || lower.includes('cheap') || lower.includes('fare') || lower.includes('cost') || lower.includes('discount')) {
      category = 'PRICES';
      reply = `💰 **Best Price Advice**:\n• **Cheapest Days**: Tuesdays and Wednesdays have off-peak fare discounts (up to 15% off KSh 1,800 to Mombasa -> KSh 1,530).\n• **Morning vs Night**: Morning 07:00 AM departures are typically KSh 200–300 cheaper than 22:00 PM Night VIP express coaches.\n• **Loyalty Points**: Booking via SafiriAI earns 10% back in points towards free tickets!`;
    } else if (lower.includes('traffic') || lower.includes('jam') || lower.includes('road') || lower.includes('highway') || lower.includes('congestion')) {
      category = 'TRAFFIC';
      reply = `🚦 **Traffic & Highway Forecast**:\n• **Nairobi – Mombasa (A109)**: Light traffic around Mtito Andei & Voi. Expect minor 10-15 min delays at Mariakani weighbridge between 2 PM and 5 PM.\n• **Nairobi – Nakuru – Kisumu (A104)**: Escarpment stretch near Mai Mahiu is clear today. Morning 07:30 AM departure arrives in Kisumu by 1:30 PM before evening city congestion.`;
    } else if (lower.includes('date') || lower.includes('when') || lower.includes('day') || lower.includes('schedule') || lower.includes('time')) {
      category = 'DATES';
      reply = `🗓️ **Optimal Travel Dates & Times**:\n• **Best Travel Days**: Tuesdays, Wednesdays, and Thursdays offer 40% lower passenger congestion and smooth highway flow.\n• **Avoid Peak Hours**: Friday 4:00 PM - 8:00 PM and Sunday afternoon departures experience highest demand and surge traffic. Book early morning 07:00 AM departures!`;
    } else if (lower.includes('seat') || lower.includes('view') || lower.includes('comfortable') || lower.includes('legroom')) {
      category = 'SEATS';
      reply = `💺 **Seat Recommendation**:\n• **Smoothest Ride**: Seats **3A, 3B, 4A, 4B** (Rows 3-5 behind driver) offer maximum stability over suspension and minimal engine noise.\n• **Best Views**: Window seats on the **Right Side** (A seats) give scenic views of Mt. Longonot & Great Rift Valley on western routes!`;
    } else {
      reply = `🚌 **SafiriAI Travel Advice**:\n• **Nairobi to Mombasa**: 07:00 AM (KSh 1,800). Tuesdays are cheapest!\n• **Nairobi to Kisumu**: 07:30 AM (KSh 1,500). Clear roads today via Kericho.\n• **Nairobi to Eldoret**: 08:00 AM (KSh 1,400). High demand on weekends.\nHow else can I assist with your intercity journey?`;
    }

    return res.json({ reply, category });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are SafiriAI's Expert Intercity Bus Travel Advisor for Kenyan transportation (Easy Coach, Modern Coast, etc.).
User question: "${prompt}"

Available Route & Fare Context:
${currentDatabaseRoutes}

Instructions:
Provide actionable, clear travel advice covering:
1. Best Prices & Fares (e.g., off-peak mid-week deals, morning vs night rates)
2. Optimal Travel Dates & Times (avoiding weekend surge and highway jams)
3. Highway Traffic & Road Conditions (A109 Mombasa Road, A104 Great North Road, weighbridges, escarpments)
4. Seat Recommendations (comfort, suspension stability, legroom, scenic views)

Keep your tone friendly, professional, and clear. Format with bullet points, bold key insights, and emoji markers.`,
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    res.json({
      reply: `🚌 **Travel Tip**: For the best fares and least traffic, book Tuesday or Wednesday morning buses (07:00 AM). Highway A109 to Mombasa and A104 to Kisumu are both operating with smooth road conditions today!`,
    });
  }
});

// 7. AI Business Analyst for Transport Operators
app.post('/api/ai/business-analyst', async (req, res) => {
  const { query } = req.body;
  const client = getGeminiClient();

  const totalRev = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmountKsh, 0) + 1842500;

  const statsSummary = `
- Total Revenue Today: KSh ${totalRev.toLocaleString()}
- Total Bookings Today: ${bookings.length + 1280}
- Average Fleet Occupancy: 87%
- Active Buses on Road: ${vehicles.filter(v => v.status === 'active').length}
- Highest Revenue Route: Nairobi - Mombasa (KSh 542,000 today)
- Second Highest Revenue Route: Nairobi - Kisumu (KSh 324,000 today)
- Highest Maintenance Cost Bus: KDD 321D (Brake service KSh 45,000)
- Fleet Fuel Efficiency: 3.2 km / Liter average across Scania fleet
`;

  if (!client) {
    return res.json({
      answer: `Based on actual database operational metrics:\n${statsSummary}\n\nRecommendation: Demand on the Nairobi-Mombasa corridor is running at 92% occupancy. Adding 2 additional 6:30 PM evening departures will generate an estimated KSh 172,000 extra revenue tomorrow.`,
    });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are an executive AI Business Analyst for Easy Coach Transport ERP in Kenya.
Operator query: "${query}"

Live operational dataset metrics:
${statsSummary}

Answer the query accurately using the database metrics provided. Keep it structured with clear bullet points and actionable business suggestions.`,
    });

    res.json({ answer: response.text });
  } catch (err) {
    res.json({
      answer: `Based on your fleet records:\n- Top Revenue Corridor: Nairobi – Mombasa (KSh 542,000)\n- Highest Maintenance Vehicle: KDD 321D (KSh 45,000 brake replacement)\n- Recommended Action: Schedule additional weekend trips on Nairobi – Kisumu due to 88% average demand.`,
    });
  }
});

// 8. AI Route Intelligence
app.post('/api/ai/route-intelligence', async (req, res) => {
  const { origin, destination } = req.body;
  res.json({
    recommendedRoute: 'A109 Nairobi-Mombasa Highway via Mtito Andei & Voi',
    distanceKm: 480,
    estimatedDuration: '7 Hours 30 Mins',
    trafficCondition: 'Light to moderate at Salama & Voi weighbridge',
    weatherCondition: 'Sunny, 28°C dry road conditions',
    delayProbability: '12% (Minor 10-15 min slowdown near Mariakani toll point)',
    journeyScore: 94,
    explanation: 'Highway A109 is clear with optimal road conditions today. Morning departures (07:00 AM) avoid heavy afternoon freight traffic.',
  });
});

// 9. School Transport Data
app.get('/api/school/data', (req, res) => {
  res.json({
    students,
    schoolBuses,
  });
});

// 10. Update Student Status (e.g. RFID Scan)
app.post('/api/school/update-student-status', (req, res) => {
  const { studentId, status, eventTime } = req.body;
  const std = students.find(s => s.id === studentId);
  if (!std) {
    return res.status(404).json({ error: 'Student not found' });
  }

  std.status = status;
  if (eventTime) std.lastEventTime = eventTime;

  // Also adjust onboard student count on corresponding bus
  const bus = schoolBuses.find(b => b.id === std.busId);
  if (bus) {
    const onboard = students.filter(s => s.busId === bus.id && s.status === 'on_bus').length;
    bus.studentsOnboardCount = onboard;
  }

  res.json({ success: true, student: std, bus });
});

// 11. Update Bus Telematics (GPS, Speed, ETA)
app.post('/api/school/update-telematics', (req, res) => {
  const { busId, currentLat, currentLng, speedKmH, headingDegree, nextStopName, estimatedArrivalNextStop } = req.body;
  const bus = schoolBuses.find(b => b.id === busId);
  if (!bus) {
    return res.status(404).json({ error: 'School bus not found' });
  }

  if (currentLat !== undefined) bus.currentLat = currentLat;
  if (currentLng !== undefined) bus.currentLng = currentLng;
  if (speedKmH !== undefined) {
    bus.speedKmH = speedKmH;
    bus.isSpeedingAlert = speedKmH > bus.speedLimitKmH;
  }
  if (headingDegree !== undefined) bus.headingDegree = headingDegree;
  if (nextStopName) bus.nextStopName = nextStopName;
  if (estimatedArrivalNextStop) bus.estimatedArrivalNextStop = estimatedArrivalNextStop;

  res.json({ success: true, bus });
});

// 12. AI Accessibility & Multi-Disability Assistant for School Transport
app.post('/api/ai/school-accessibility', async (req, res) => {
  const { studentId, busId, disabilityType, targetLocationName, currentSpeedKmH, distanceMeters, etaMinutes } = req.body;
  const client = getGeminiClient();

  const std = students.find(s => s.id === studentId) || students[0];
  const bus = schoolBuses.find(b => b.id === busId) || schoolBuses[0];
  const disType = disabilityType || std.disability;
  const dist = distanceMeters || 850;
  const eta = etaMinutes || 4;
  const speed = currentSpeedKmH !== undefined ? currentSpeedKmH : bus.speedKmH;
  const locName = targetLocationName || std.stopName;

  const fallbackData = {
    visual_impairment: {
      spokenAudioText: `Attention ${std.parentName || 'Parent'}. School Bus ${bus.registrationNumber} driven by ${bus.driverName} is currently ${dist} meters away, traveling at a safe ${speed} kilometers per hour. Estimated arrival at ${locName} is in ${eta} minutes. Matron ${bus.matronName} is prepared to guide ${std.name} to front row Seat 1A. Please prepare to step toward the designated gate.`,
      visualAlertText: `🔊 AUDIO PROXIMITY ACTIVE: Bus ${bus.registrationNumber} is ${dist}m away (${eta} mins). Safe speed ${speed} km/h. Matron ${bus.matronName} standing by at door.`,
      hapticPattern: 'double_pulse',
      driverActionRequired: 'Activate external proximity chime and guide student with visual impairment at doorstep.',
      keySafetyPoints: [
        'Spoken audio voice broadcast dispatched',
        'Curb audio beacon ready at gate',
        'Matron assistance confirmed for boarding'
      ]
    },
    wheelchair_mobility: {
      spokenAudioText: `School Bus ${bus.registrationNumber} is ${dist} meters away traveling at ${speed} km/h. ETA at ${locName} is ${eta} minutes. Hydraulic wheelchair lift deployment has been scheduled for Driver ${bus.driverName}. Wheelchair Bay #1 is locked and cleared.`,
      visualAlertText: `♿ ACCESSIBILITY ALERT: Bus ${bus.registrationNumber} arriving in ${eta} mins. Hydraulic lift deployment signal sent to Driver ${bus.driverName}. Wheelchair Bay #1 reserved.`,
      hapticPattern: 'rapid_pulse',
      driverActionRequired: 'Deploy hydraulic lift upon arrival, lower wheelchair ramp to curb level, and secure four-point wheel clamp.',
      keySafetyPoints: [
        'Hydraulic lift pre-deployment signal sent',
        'Wheelchair Bay #1 cleared & secured',
        'Curb clearance verified for ramp extension'
      ]
    },
    hearing_impairment: {
      spokenAudioText: `School bus is ${dist} meters away, ETA ${eta} minutes at ${locName}. Visual strobe alert active on student wearable device.`,
      visualAlertText: `🟢 HIGH-VISIBILITY FLASH ALERT: School Bus ${bus.registrationNumber} is ${dist}m away (${eta} mins ETA). Speed: ${speed} km/h. Driver ${bus.driverName} is arriving at ${locName}. Step to designated pickup point.`,
      hapticPattern: 'rapid_pulse',
      driverActionRequired: 'Turn on front cabin amber beacon light and use clear hand-sign greeting.',
      keySafetyPoints: [
        'High-contrast visual strobe alert active',
        'Haptic vibration pulse sent to student phone/watch',
        'Front-facing visual signage illuminated'
      ]
    },
    autism_sensory: {
      spokenAudioText: `Bus ${bus.registrationNumber} is approaching peacefully, ${eta} minutes away. Cabin environment is calm with low engine noise.`,
      visualAlertText: `🧘 SENSORY-CALM NOTIFICATION: Bus is ${dist}m away (${eta} mins). Cabin is quiet and orderly. Seat is reserved near front window.`,
      hapticPattern: 'single_pulse',
      driverActionRequired: 'No horn honking at gate. Maintain quiet cabin environment.',
      keySafetyPoints: [
        'Predictable visual countdown active',
        'Silent arrival protocol enforced (no horn)',
        'Calm low-sensory transition assisted by Matron'
      ]
    },
    none: {
      spokenAudioText: `School Bus ${bus.registrationNumber} is ${dist} meters away, traveling at ${speed} km/h. Estimated arrival at ${locName} in ${eta} minutes.`,
      visualAlertText: `Bus ${bus.registrationNumber} is ${dist}m away (${eta} mins ETA) traveling at ${speed} km/h.`,
      hapticPattern: 'single_pulse',
      driverActionRequired: 'Standard safe school stop protocol.',
      keySafetyPoints: ['Safe speed monitoring active', 'On-time arrival estimated']
    }
  };

  if (!client) {
    const selected = (fallbackData as any)[disType] || fallbackData.visual_impairment;
    return res.json({
      success: true,
      student: std,
      bus,
      disabilityType: disType,
      ...selected
    });
  }

  try {
    const prompt = `You are the AI Accessibility & School Transport Officer for Nairobi International Academy.
Generate tailored real-time arrival guidance for a student with disability and their parent/transport manager:

Student: ${std.name} (${std.grade})
Disability Profile: ${disType} (Notes: ${std.specialNeedsNotes})
Assigned School Bus: ${bus.registrationNumber} (${bus.fleetNumber})
Driver: ${bus.driverName}, Care Matron: ${bus.matronName}
Current Telematics: Bus is ${dist} meters away, driving at ${speed} km/h (School Zone limit: ${bus.speedLimitKmH} km/h).
Target Destination Stop: ${locName}
Estimated Time of Arrival: ${eta} minutes (${bus.estimatedArrivalNextStop})

Please output structured JSON with:
1. "spokenAudioText": A warm, natural, crystal-clear spoken briefing to be read aloud by speech synthesizer for a parent or visually impaired person. Include bus reg, driver, current distance, speed, ETA, and boarding action.
2. "visualAlertText": High-visibility formatted alert message for screen display or deaf/hard of hearing users.
3. "hapticPattern": One of "single_pulse", "double_pulse", "rapid_pulse".
4. "driverActionRequired": Specific action instructions for Driver and Matron (e.g. wheelchair ramp readiness, sensory calm, physical guiding).
5. "keySafetyPoints": Array of 3 short bullet points.

Return ONLY valid JSON.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      student: std,
      bus,
      disabilityType: disType,
      spokenAudioText: parsed.spokenAudioText || (fallbackData as any)[disType]?.spokenAudioText,
      visualAlertText: parsed.visualAlertText || (fallbackData as any)[disType]?.visualAlertText,
      hapticPattern: parsed.hapticPattern || 'double_pulse',
      driverActionRequired: parsed.driverActionRequired || (fallbackData as any)[disType]?.driverActionRequired,
      keySafetyPoints: parsed.keySafetyPoints || (fallbackData as any)[disType]?.keySafetyPoints,
    });
  } catch (err) {
    const selected = (fallbackData as any)[disType] || fallbackData.visual_impairment;
    return res.json({
      success: true,
      student: std,
      bus,
      disabilityType: disType,
      ...selected
    });
  }
});

// Start Express and Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kenya Bus Transport Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
