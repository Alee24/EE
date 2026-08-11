# 🚌 Easy Coach Transport & Fleet Management Platform

An AI-powered, multi-tenant intercity bus ticketing, fleet management, and transport operations platform designed for Kenyan bus operators (e.g., Easy Coach, Modern Coast, Raha Express, Mash Poa).

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Key Architecture & Portals](#-key-architecture--portals)
3. [Core Functionality](#-core-functionality)
4. [Tech Stack & Tech Standards](#-tech-stack--tech-standards)
5. [How to Build Features with Antigravity AI](#-how-to-build-features-with-antigravity-ai)
6. [Getting Started & Development](#-getting-started--development)

---

## 🌟 Overview

The platform provides a 3-in-1 ecosystem for intercity bus transit in Kenya:

- **Passenger Portal**: Interactive seat selection, route search, M-Pesa mobile money checkout, instant QR pass generation, and live GPS bus tracking.
- **Operator ERP Portal**: Route scheduling, driver/conductor rosters, terminal board management, walk-in ticket issuing, maintenance & fuel logs, and cash reconciliation.
- **Super Admin SaaS Dashboard**: Platform-wide tenant management, commission tracking, operator onboarding, and aggregate analytics.
- **Gemini AI Engine**: AI Travel Advisor for passengers (route advice, luggage policy, terminal tips) and AI Business Analyst for bus company managers (revenue optimization, fuel efficiency, demand forecasting).

---

## 🏛️ Key Architecture & Portals

### 1. Passenger Booking Portal
- **Interactive 48-Seater Bus Layout**: Animated seat grid with filterable seat classes (Standard vs VIP, Window vs Aisle).
- **M-Pesa Express Checkout**: Simulated M-Pesa STK push workflow with validation and till integration.
- **Digital Boarding Pass**: Instant QR code pass generation downloadable or printable for terminal gate validation.
- **Live GPS Map Tracking**: Leaflet-based interactive bus location tracker along Kenyan highways (e.g., Nairobi–Mombasa A109, Nairobi–Kisumu A104).

### 2. Bus Operator ERP Portal
- **Trips & Schedules**: Create departure slots, set fares, assign buses and drivers, and handle highway delay alerts.
- **Walk-in Cashier Terminal**: Issue tickets directly at Afya Centre or Mwembe Tayari terminals with instant cash confirmation.
- **Fleet & Crew Roster**: Bus registration, driver licensing records, and maintenance/service interval scheduling.
- **Fuel & Maintenance Logs**: Track diesel consumption per kilometer, garage repair bills, and odometer readings.
- **AI Business Analyst**: Natural language query interface powered by Gemini to analyze route profitability and fleet health.

### 3. SaaS Super Admin Dashboard
- **Tenant Management**: Onboard new bus companies, configure commission percentages, and suspend/activate operator accounts.
- **Platform Analytics**: Aggregate gross ticket sales, total bookings count, and system commission intake.

---

## 🛠️ Tech Stack & Tech Standards

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion, QR Code React, Leaflet Maps.
- **Backend & API**: Node.js, Express, `tsx` runner, `esbuild` server compiler.
- **AI Integration**: `@google/genai` (Gemini API) running strictly server-side (`server.ts`).
- **Styling**: Newspaper & brutalist-inspired Kenyan transport design aesthetic (`#006633` Easy Coach Green, `#F2EFE9` Warm Canvas, `#1A1A1A` High-Contrast Ink).

---

## 🤖 How to Build Features with Antigravity AI

When asking the **Antigravity AI Agent** to build new features or extend functionality, use these structured prompting patterns for optimal results:

### 💡 General Prompting Strategy
1. **Be Specific About the Role/Portal**: Specify whether the feature belongs to the `Passenger Portal`, `Operator ERP`, or `Super Admin`.
2. **Reference Existing Types**: Mention relevant entities from `src/types.ts` (e.g., `Trip`, `Booking`, `Vehicle`, `Driver`, `Operator`).
3. **Specify UI & Interaction Expectations**: Describe visual states, button interactions, or smooth transitions.

---

### 📝 Example Feature Request Prompts for Antigravity

#### 1. Adding a New Passenger Feature
> *"Add a 'Luggage Tracking & Tagging' option during checkout in `PassengerApp.tsx`. Allow passengers to select additional excess luggage (e.g., 1 extra suitcase for KSh 300) and generate a unique luggage claim tag on their QR boarding pass."*

#### 2. Adding a New Operator ERP Tool
> *"In `OperatorDashboard.tsx`, under the Maintenance tab, add a feature to schedule automated brake and oil service reminders when a bus reaches 10,000 km since its last service date."*

#### 3. Enhancing AI Capabilities
> *"Extend the server-side Gemini route in `server.ts` to include weather condition awareness for Kenyan highways (e.g. rain delays on the Nakuru-Eldoret highway) when answering passenger travel advice queries."*

#### 4. Adding Route / Pricing Rules
> *"Add a dynamic pricing engine toggle in the Operator Dashboard that automatically increases seat fares by 15% during peak holiday weekends (e.g. Easter or Christmas departure dates)."*

---

## 🚀 Getting Started & Development

### 1. Installation
Dependencies are pre-configured in `package.json`. To install manually:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file or rely on platform environment settings:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Running Development Server
Start the Express server with Vite middleware on Port 3000:
```bash
npm run dev
```

### 4. Production Build & Start
```bash
npm run build
npm start
```
