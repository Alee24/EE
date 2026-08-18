import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GraduationCap,
  Bus,
  ShieldCheck,
  MapPin,
  Clock,
  Gauge,
  Volume2,
  VolumeX,
  Eye,
  Ear,
  Accessibility,
  HeartPulse,
  Sparkles,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Radio,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Send,
  Users,
  Compass
} from 'lucide-react';
import { Student, SchoolBus, DisabilityType } from '../../types';
import { INITIAL_STUDENTS, INITIAL_SCHOOL_BUSES } from '../../data/mockData';
import { getSchoolAccessibilityAI, updateStudentStatus, updateBusTelematics } from '../../services/api';

interface SchoolTransportAppProps {
  onSwitchToIntercity?: () => void;
}

export const SchoolTransportApp: React.FC<SchoolTransportAppProps> = ({ onSwitchToIntercity }) => {
  const [viewMode, setViewMode] = useState<'parent' | 'manager'>('parent');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_liam');
  const [schoolBuses, setSchoolBuses] = useState<SchoolBus[]>(INITIAL_SCHOOL_BUSES);
  const [selectedBusId, setSelectedBusId] = useState<string>('sch_bus_04');
  
  // Target location for ETA check
  const [targetLocationId, setTargetLocationId] = useState<string>('std_stop');
  const [customPlaceName, setCustomPlaceName] = useState<string>('');

  // AI Disability Accommodation State
  const [activeDisabilityTab, setActiveDisabilityTab] = useState<DisabilityType>('visual_impairment');
  const [aiSpokenText, setAiSpokenText] = useState<string>('');
  const [aiVisualAlert, setAiVisualAlert] = useState<string>('');
  const [aiDriverAction, setAiDriverAction] = useState<string>('');
  const [aiSafetyPoints, setAiSafetyPoints] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [hapticFlashed, setHapticFlashed] = useState<boolean>(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const studentMarkerRef = useRef<L.Marker | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const selectedBus = schoolBuses.find(b => b.id === selectedBusId) || schoolBuses[0];

  // Route path waypoints for simulation
  const routeCoordinates: Array<{ lat: number; lng: number; speed: number; place: string; eta: string; distMeters: number }> = [
    { lat: -1.2642, lng: 36.7934, speed: 32, place: 'Rhapta Road, Westlands (Stop 1)', eta: '12 mins', distMeters: 2400 },
    { lat: -1.2685, lng: 36.7980, speed: 38, place: 'St. Michael’s Road Junction', eta: '9 mins', distMeters: 1800 },
    { lat: -1.2721, lng: 36.8015, speed: 28, place: 'Riverside Drive Close (Stop 2)', eta: '7 mins', distMeters: 1400 },
    { lat: -1.2745, lng: 36.7915, speed: 34, place: 'Approaching Mandera Road Ring', eta: '4 mins', distMeters: 850 },
    { lat: -1.2785, lng: 36.7865, speed: 20, place: 'Kileleshwa Green Gardens Gate (Liam’s Gate)', eta: '0 mins (Arrived)', distMeters: 0 },
    { lat: -1.2850, lng: 36.7780, speed: 36, place: 'James Gichuru Valley Corridor', eta: '6 mins to Maya', distMeters: 1200 },
    { lat: -1.2912, lng: 36.7698, speed: 22, place: 'Valley Arcade Shopping Centre (Maya’s Stop)', eta: '0 mins (Arrived)', distMeters: 0 },
    { lat: -1.2855, lng: 36.7655, speed: 15, place: 'Nairobi International Academy Main Gate', eta: '0 mins (School Arrived)', distMeters: 0 },
  ];

  // Sync active disability when student changes
  useEffect(() => {
    if (selectedStudent && selectedStudent.disability) {
      setActiveDisabilityTab(selectedStudent.disability);
    }
  }, [selectedStudentId]);

  // Request AI Accessibility Guidance when student, bus, or location changes
  useEffect(() => {
    fetchAiAccessibility();
  }, [selectedStudentId, selectedBusId, activeDisabilityTab, simStep]);

  // AI Guidance Fetcher
  const fetchAiAccessibility = async () => {
    setIsAiLoading(true);
    const currLoc = routeCoordinates[simStep % routeCoordinates.length];
    try {
      const res = await getSchoolAccessibilityAI({
        studentId: selectedStudent.id,
        busId: selectedBus.id,
        disabilityType: activeDisabilityTab,
        targetLocationName: targetLocationId === 'std_stop' ? selectedStudent.stopName : customPlaceName || 'School Main Gate',
        currentSpeedKmH: currLoc.speed,
        distanceMeters: currLoc.distMeters,
        etaMinutes: Math.max(1, Math.round(currLoc.distMeters / 250)),
      });

      if (res && res.spokenAudioText) {
        setAiSpokenText(res.spokenAudioText);
        setAiVisualAlert(res.visualAlertText || '');
        setAiDriverAction(res.driverActionRequired || '');
        setAiSafetyPoints(res.keySafetyPoints || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI accessibility guidance', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Text-to-Speech Spoken Audio Function
  const handleSpeakAudio = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = aiSpokenText || `Attention parent. School Bus ${selectedBus.registrationNumber} is ${routeCoordinates[simStep].distMeters} meters away travelling at ${routeCoordinates[simStep].speed} kilometers per hour.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95; // Clear natural cadence
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Trigger Visual & Haptic Vibration alert
  const handleTriggerHaptic = () => {
    setHapticFlashed(true);
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
    setTimeout(() => setHapticFlashed(false), 2500);
  };

  // Route Simulation Timer
  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimStep(prev => {
          const next = (prev + 1) % routeCoordinates.length;
          const point = routeCoordinates[next];
          
          // Update live bus state
          setSchoolBuses(buses =>
            buses.map(b =>
              b.id === selectedBusId
                ? {
                    ...b,
                    currentLat: point.lat,
                    currentLng: point.lng,
                    speedKmH: point.speed,
                    estimatedArrivalNextStop: `${point.eta} (${point.place})`,
                    nextStopName: point.place,
                  }
                : b
            )
          );

          // If reached student stop, trigger haptic & accessibility chime
          if (point.distMeters === 0) {
            handleTriggerHaptic();
          }

          return next;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedBusId]);

  // Leaflet Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([selectedStudent.stopCoordinates.lat, selectedStudent.stopCoordinates.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous layers except tile layer
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Draw route polyline connecting all stops
    const latLngs: [number, number][] = routeCoordinates.map(r => [r.lat, r.lng]);
    L.polyline(latLngs, {
      color: '#006633',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
    }).addTo(map);

    // Geofence Circle around Student's Stop (300m Safe Zone)
    L.circle([selectedStudent.stopCoordinates.lat, selectedStudent.stopCoordinates.lng], {
      radius: 350,
      color: '#006633',
      fillColor: '#006633',
      fillOpacity: 0.12,
      weight: 2,
    }).addTo(map);

    // Student Home / Stop Marker
    const studentIconHtml = `
      <div class="flex items-center justify-center w-8 h-8 bg-amber-400 text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-bold text-xs">
        🏠
      </div>
    `;
    const studentIcon = L.divIcon({
      html: studentIconHtml,
      className: 'custom-student-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([selectedStudent.stopCoordinates.lat, selectedStudent.stopCoordinates.lng], { icon: studentIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold text-[#1A1A1A] font-serif">${selectedStudent.name} (${selectedStudent.grade})</div>
          <div class="text-[#006633] font-bold font-mono text-[10px]">${selectedStudent.stopName}</div>
          <div class="text-slate-600 text-[10px]">Pickup: ${selectedStudent.scheduledPickupTime}</div>
          <div class="mt-1 bg-amber-100 text-amber-900 px-1 py-0.5 text-[9px] font-bold">
            ${selectedStudent.disability.toUpperCase().replace('_', ' ')}
          </div>
        </div>`
      );

    // School Campus Marker
    const schoolIconHtml = `
      <div class="flex items-center justify-center w-9 h-9 bg-[#1A1A1A] text-white border-2 border-white shadow-[2px_2px_0px_#006633] font-bold text-xs">
        🏫
      </div>
    `;
    const schoolIcon = L.divIcon({
      html: schoolIconHtml,
      className: 'custom-school-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([-1.2855, 36.7655], { icon: schoolIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold font-serif">Nairobi International Academy</div>
          <div class="text-slate-600 text-[10px]">Main Campus Gate</div>
        </div>`
      );

    // Live Bus Marker with pulse
    const currPoint = routeCoordinates[simStep % routeCoordinates.length];
    const busIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 bg-emerald-500/40 rounded-full animate-ping"></div>
        <div class="w-10 h-10 bg-[#006633] text-white flex items-center justify-center border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
          <span class="text-sm font-bold">🚌</span>
        </div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busIconHtml,
      className: 'custom-school-bus-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const busMarker = L.marker([currPoint.lat, currPoint.lng], { icon: busIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold text-[#006633] font-mono">${selectedBus.registrationNumber}</div>
          <div class="text-[#1A1A1A] font-serif italic">${selectedBus.fleetNumber}</div>
          <div class="text-slate-700 font-mono text-[10px]">Live Speed: ${currPoint.speed} km/h (Limit: 40)</div>
          <div class="text-emerald-700 font-bold text-[10px]">ETA: ${currPoint.eta}</div>
        </div>`
      );

    busMarkerRef.current = busMarker;
  }, [selectedStudent, simStep, selectedBus]);

  // Handle student check-in status toggle (RFID simulation)
  const handleToggleStudentStatus = async (newStatus: Student['status']) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const eventTime = `${timeStr} (${newStatus === 'on_bus' ? 'Boarded via RFID' : newStatus === 'at_school' ? 'Arrived at Campus' : 'At Home'})`;
    
    setStudents(prev =>
      prev.map(s => (s.id === selectedStudent.id ? { ...s, status: newStatus, lastEventTime: eventTime } : s))
    );

    try {
      await updateStudentStatus(selectedStudent.id, newStatus, eventTime);
    } catch (err) {
      console.error(err);
    }
  };

  const currTelemetry = routeCoordinates[simStep % routeCoordinates.length];

  return (
    <div className={`w-full min-h-[calc(100vh-4rem)] ${highContrastMode ? 'bg-black text-yellow-300' : 'bg-[#F2EFE9] text-[#1A1A1A]'}`}>
      
      {/* Top Banner & Mode Switcher */}
      <div className="border-b border-[#1A1A1A] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#006633] text-white flex items-center justify-center border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif font-black text-lg sm:text-xl tracking-tight uppercase">
                  School SafeTransit & Accessibility
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-[#1A1A1A] text-[9px] font-mono px-2 py-0.5 font-bold uppercase">
                  AI-Inclusive
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Nairobi International Academy • Live GPS, Speed Telemetry & Multi-Disability Assistance
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Accessibility Contrast Toggle */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center bg-[#F2EFE9] border border-[#1A1A1A] p-0.5">
              <button
                id="btn-parent-view"
                onClick={() => setViewMode('parent')}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-1.5 transition ${
                  viewMode === 'parent'
                    ? 'bg-[#1A1A1A] text-white shadow-[1px_1px_0px_#006633]'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Parent View</span>
              </button>

              <button
                id="btn-manager-view"
                onClick={() => setViewMode('manager')}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-1.5 transition ${
                  viewMode === 'manager'
                    ? 'bg-[#1A1A1A] text-white shadow-[1px_1px_0px_#006633]'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transport Manager</span>
              </button>
            </div>

            <button
              id="btn-high-contrast"
              onClick={() => setHighContrastMode(!highContrastMode)}
              title="Toggle High-Contrast Mode for Low Vision accessibility"
              className={`p-2 border border-[#1A1A1A] text-xs font-mono font-bold flex items-center space-x-1 shadow-[2px_2px_0px_#1A1A1A] ${
                highContrastMode ? 'bg-yellow-400 text-black' : 'bg-white text-[#1A1A1A]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">High Contrast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Control Bar: Student / Child Selector & Bus Picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Student / Child Switcher */}
          <div className="bg-white p-4 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              {viewMode === 'parent' ? '👤 Select Your Child' : '📋 Student Passenger Manifest'}
            </label>
            <select
              id="select-school-student"
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono font-bold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#006633]"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade}) — {s.disability !== 'none' ? `♿ ${s.disability.toUpperCase().replace('_', ' ')}` : 'Standard'}
                </option>
              ))}
            </select>
            
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600">Assigned Bus:</span>
              <span className="font-bold text-[#006633]">{selectedBus.registrationNumber} ({selectedBus.fleetNumber})</span>
            </div>
          </div>

          {/* 2. Target Place / Stop ETA Selector */}
          <div className="bg-white p-4 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              📍 View Bus ETA at Place / Stop
            </label>
            <select
              id="select-target-eta-place"
              value={targetLocationId}
              onChange={e => setTargetLocationId(e.target.value)}
              className="w-full bg-[#F2EFE9] border border-[#1A1A1A] p-2 text-xs font-mono font-bold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#006633]"
            >
              <option value="std_stop">Home Pickup: {selectedStudent.stopName}</option>
              <option value="school_gate">School Campus: Nairobi International Academy Gate</option>
              <option value="valley_arcade">Valley Arcade Shopping Centre Stop</option>
              <option value="riverside_close">Riverside Drive Close Stop</option>
              <option value="westlands_pride">Westlands Pride Apartments Gate</option>
            </select>

            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600">Calculated ETA:</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 border border-amber-300">
                {currTelemetry.eta} ({currTelemetry.distMeters}m away)
              </span>
            </div>
          </div>

          {/* 3. Live Route Simulation Controls */}
          <div className="bg-white p-4 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  🛰️ GPS Telematics Simulation
                </label>
                <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span>
                  <span>LIVE SENSORS</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-mono">
                Simulate bus driving along Kileleshwa route to test live speed & audio alerts.
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <button
                id="btn-toggle-simulation"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex-1 py-1.5 px-3 text-xs font-bold font-mono uppercase flex items-center justify-center space-x-1.5 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition ${
                  isSimulating ? 'bg-amber-400 text-black hover:bg-amber-500' : 'bg-[#006633] text-white hover:bg-[#005528]'
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Pause Route Drive' : '▶ Simulate Route Drive'}</span>
              </button>

              <button
                id="btn-reset-simulation"
                onClick={() => {
                  setIsSimulating(false);
                  setSimStep(0);
                }}
                title="Reset simulation to start"
                className="p-1.5 bg-white border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-slate-100"
              >
                <RotateCcw className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Status Card & Disability Highlight Bar */}
        <div className="bg-[#1A1A1A] text-white p-4 sm:p-5 border border-[#1A1A1A] shadow-[6px_6px_0px_#006633]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Speedometer & Zone Alert */}
            <div className="bg-slate-900 p-3.5 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span className="flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bus Speed</span>
                </span>
                <span className="text-amber-400 font-bold">Zone Limit: 40 km/h</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-mono font-black ${currTelemetry.speed > 40 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                  {currTelemetry.speed}
                </span>
                <span className="text-xs font-mono text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] font-mono">
                {currTelemetry.speed <= 40 ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Safe School Zone Speed</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Speed Warning Triggered</span>
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Arrival (ETA) to Destination */}
            <div className="bg-slate-900 p-3.5 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>ETA at {selectedStudent.name.split(' ')[0]}’s Stop</span>
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-mono font-black text-amber-300">
                  {currTelemetry.eta.split(' ')[0]}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currTelemetry.eta.includes('mins') ? 'minutes' : 'arrival'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                Distance: <span className="text-white font-bold">{currTelemetry.distMeters} meters away</span>
              </div>
            </div>

            {/* Student Boarding RFID Status */}
            <div className="bg-slate-900 p-3.5 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Student RFID Status</span>
                </span>
                <span className="text-sky-300 font-mono text-[9px]">{selectedStudent.rfidTag}</span>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                  selectedStudent.status === 'on_bus'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                    : selectedStudent.status === 'at_school'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500'
                }`}>
                  {selectedStudent.status === 'on_bus' ? '🚍 Onboard School Bus' : selectedStudent.status === 'at_school' ? '🏫 At School Campus' : '🏠 At Home (Waiting)'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate pt-0.5">
                {selectedStudent.lastEventTime || `Scheduled Pickup: ${selectedStudent.scheduledPickupTime}`}
              </div>
            </div>

            {/* Care Matron & Driver Direct Contact */}
            <div className="bg-slate-900 p-3.5 border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Crew Contact</span>
                <span className="text-emerald-400 font-bold">Driver Jackson</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${selectedBus.driverPhone}`}
                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-center border border-slate-700 flex items-center justify-center space-x-1 text-emerald-300"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Driver</span>
                </a>
                <a
                  href={`tel:${selectedBus.matronPhone}`}
                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-center border border-slate-700 flex items-center justify-center space-x-1 text-sky-300"
                >
                  <HeartPulse className="w-3 h-3" />
                  <span>Matron Mercy</span>
                </a>
              </div>
              <div className="text-[9px] font-mono text-slate-500 text-center">
                Special Care Nurse onboard
              </div>
            </div>

          </div>
        </div>

        {/* 2 Column Layout: Interactive Live Map vs AI Disability Accommodations Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Interactive GPS Map View (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white p-3 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-[#006633]" />
                  <h2 className="font-serif font-bold text-sm uppercase text-[#1A1A1A]">
                    Live School Bus Tracker & Geofence
                  </h2>
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-600">
                  {currTelemetry.place}
                </div>
              </div>

              {/* Leaflet Map Box */}
              <div className="relative w-full h-96 overflow-hidden border border-[#1A1A1A] bg-[#F2EFE9]">
                <div ref={mapContainerRef} className="w-full h-full z-10" />

                {/* Floating On-Map Speed & Distance HUD */}
                <div className="absolute top-3 left-3 z-20 bg-[#1A1A1A]/95 text-white p-3 border border-white/20 shadow-[3px_3px_0px_#006633] text-xs font-mono space-y-1 max-w-[240px]">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>{selectedBus.registrationNumber}</span>
                    <span className="text-[9px] bg-[#006633] text-white px-1 py-0.5">GPS ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Live Speed: <strong className="text-emerald-400">{currTelemetry.speed} km/h</strong>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Next Stop: <span className="text-white font-bold">{selectedStudent.stopName.split(' ')[0]}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    ETA: <strong className="text-amber-300">{currTelemetry.eta}</strong>
                  </div>
                </div>

                {/* Visual / Haptic Flash Notification Overlay */}
                {hapticFlashed && (
                  <div className="absolute inset-0 z-30 bg-emerald-500/25 pointer-events-none flex items-center justify-center animate-pulse">
                    <div className="bg-[#1A1A1A] text-white border-2 border-emerald-400 p-4 text-center shadow-xl">
                      <Radio className="w-8 h-8 text-emerald-400 mx-auto animate-bounce mb-1" />
                      <div className="font-mono font-bold text-sm text-emerald-300">⚡ GEOFENCE 350M PROXIMITY ALERT</div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5">Haptic vibration pulse dispatched to student & parent device!</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Route Waypoint Progression */}
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {selectedBus.stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`p-2 border text-[10px] font-mono ${
                      stop.isCompleted
                        ? 'bg-slate-100 border-slate-300 text-slate-500 line-through'
                        : stop.name.includes(selectedStudent.name.split(' ')[0]) || (selectedStudent.stopName.includes(stop.name.split(' ')[0]))
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-[2px_2px_0px_#D97706]'
                        : 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Stop #{idx + 1}</span>
                      <span>{stop.scheduledTime}</span>
                    </div>
                    <div className="truncate mt-0.5">{stop.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (RFID Boarding Test) */}
            <div className="bg-white p-3.5 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-slate-700">
                Simulation Actions for {selectedStudent.name}:
              </span>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-simulate-boarded"
                  onClick={() => handleToggleStudentStatus('on_bus')}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-mono font-bold border border-[#1A1A1A] shadow-[1px_1px_0px_#1A1A1A]"
                >
                  ✓ Simulate Tap-In (Boarded)
                </button>
                <button
                  id="btn-simulate-school"
                  onClick={() => handleToggleStudentStatus('at_school')}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-mono font-bold border border-[#1A1A1A] shadow-[1px_1px_0px_#1A1A1A]"
                >
                  🏫 Tap-Out (At School)
                </button>
                <button
                  id="btn-simulate-home"
                  onClick={() => handleToggleStudentStatus('at_home')}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-[#1A1A1A] text-[11px] font-mono font-bold border border-[#1A1A1A]"
                >
                  Reset (At Home)
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Accessibility & Multi-Disability Engine (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white p-4 sm:p-5 border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="font-serif font-black text-base uppercase text-[#1A1A1A]">
                    AI Disability Accommodations
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#006633] text-white px-2 py-0.5">
                  GEMINI 3.7 FLASH
                </span>
              </div>

              {/* Disability Mode Selector */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Select Disability Assistance Profile:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="tab-disability-visual"
                    onClick={() => setActiveDisabilityTab('visual_impairment')}
                    className={`p-2 border text-left flex items-start space-x-2 transition ${
                      activeDisabilityTab === 'visual_impairment'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#006633]'
                        : 'bg-[#F2EFE9] text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold font-mono">Visual / Blindness</div>
                      <div className="text-[9px] opacity-70">Spoken Voice ETA & Audio Proximity</div>
                    </div>
                  </button>

                  <button
                    id="tab-disability-hearing"
                    onClick={() => setActiveDisabilityTab('hearing_impairment')}
                    className={`p-2 border text-left flex items-start space-x-2 transition ${
                      activeDisabilityTab === 'hearing_impairment'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#006633]'
                        : 'bg-[#F2EFE9] text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Ear className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold font-mono">Deaf / Hard of Hearing</div>
                      <div className="text-[9px] opacity-70">Visual Flash & Haptic Vibrations</div>
                    </div>
                  </button>

                  <button
                    id="tab-disability-wheelchair"
                    onClick={() => setActiveDisabilityTab('wheelchair_mobility')}
                    className={`p-2 border text-left flex items-start space-x-2 transition ${
                      activeDisabilityTab === 'wheelchair_mobility'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#006633]'
                        : 'bg-[#F2EFE9] text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Accessibility className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold font-mono">Wheelchair / Mobility</div>
                      <div className="text-[9px] opacity-70">Hydraulic Ramp Prep & Bay Lock</div>
                    </div>
                  </button>

                  <button
                    id="tab-disability-sensory"
                    onClick={() => setActiveDisabilityTab('autism_sensory')}
                    className={`p-2 border text-left flex items-start space-x-2 transition ${
                      activeDisabilityTab === 'autism_sensory'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#006633]'
                        : 'bg-[#F2EFE9] text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold font-mono">Autism / Sensory</div>
                      <div className="text-[9px] opacity-70">Silent Arrival & Calming Schedule</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. Feature for Visual Impairment: AI Audio Speech Synthesizer */}
              {activeDisabilityTab === 'visual_impairment' && (
                <div className="bg-amber-50 p-4 border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-900 flex items-center space-x-1.5">
                      <Volume2 className="w-4 h-4 text-amber-700" />
                      <span>AI Spoken Audio Arrival Announcer</span>
                    </span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5">
                      Voice Enabled
                    </span>
                  </div>

                  <p className="text-xs font-serif text-amber-950 italic leading-relaxed bg-white/80 p-3 border border-amber-200">
                    "{aiSpokenText || 'Attention parent. School Bus KCC 789S is currently 850 meters away, traveling at a safe 34 km/h. Estimated arrival at Kileleshwa Green Gardens is in 4 minutes. Matron Mercy is prepared to assist Liam.'}"
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      id="btn-listen-ai-speech"
                      onClick={handleSpeakAudio}
                      className={`flex-1 py-2 px-3 text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition ${
                        isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#006633] text-white hover:bg-[#005528]'
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      <span>{isSpeaking ? '⏹ Stop Spoken Audio' : '🔊 Listen to AI Spoken Guidance'}</span>
                    </button>

                    <button
                      id="btn-refresh-ai-guidance"
                      onClick={fetchAiAccessibility}
                      disabled={isAiLoading}
                      className="p-2 bg-white border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-slate-100 disabled:opacity-50"
                      title="Regenerate live AI guidance"
                    >
                      <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono text-amber-800">
                    💡 Ideal for parents and visually impaired students walking to the curb.
                  </div>
                </div>
              )}

              {/* 2. Feature for Wheelchair & Mobility: Ramp Deployment Signal */}
              {activeDisabilityTab === 'wheelchair_mobility' && (
                <div className="bg-sky-50 p-4 border border-sky-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-900 flex items-center space-x-1.5">
                      <Accessibility className="w-4 h-4 text-sky-700" />
                      <span>Automated Hydraulic Ramp Dispatcher</span>
                    </span>
                    <span className="text-[9px] bg-sky-200 text-sky-900 font-bold px-1.5 py-0.5">
                      Lift Prepped
                    </span>
                  </div>

                  <div className="bg-white p-3 border border-sky-200 text-xs font-mono text-slate-800 space-y-1.5">
                    <div className="font-bold text-sky-900">Driver Action Dispatched:</div>
                    <p className="text-[11px] text-slate-700">
                      {aiDriverAction || 'Deploy hydraulic wheelchair lift upon arrival, lower wheelchair ramp to curb level, and secure four-point wheel clamp in Bay #1.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white p-2 border border-sky-200">
                      <span className="text-slate-500 block">Wheelchair Bay:</span>
                      <strong className="text-emerald-700">Bay #1 (Reserved)</strong>
                    </div>
                    <div className="bg-white p-2 border border-sky-200">
                      <span className="text-slate-500 block">Hydraulic Lift:</span>
                      <strong className="text-sky-700">Pre-heated & Ready</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerHaptic}
                    className="w-full py-2 px-3 bg-sky-800 hover:bg-sky-900 text-white text-xs font-mono font-bold uppercase border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ping Driver: Confirm Ramp Deployment</span>
                  </button>
                </div>
              )}

              {/* 3. Feature for Deaf / Hard of Hearing: Visual & Haptic Pulse */}
              {activeDisabilityTab === 'hearing_impairment' && (
                <div className="bg-emerald-50 p-4 border border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-900 flex items-center space-x-1.5">
                      <Ear className="w-4 h-4 text-emerald-700" />
                      <span>High-Visibility Visual & Haptic Strobe</span>
                    </span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5">
                      Haptic Ready
                    </span>
                  </div>

                  <div className="bg-white p-3 border border-emerald-200 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-xs font-mono font-bold text-emerald-900">
                        {aiVisualAlert || `School Bus ${selectedBus.registrationNumber} is ${currTelemetry.distMeters}m away (${currTelemetry.eta} ETA).`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Driver Jackson is approaching with cabin amber beacon illuminated.
                    </p>
                  </div>

                  <button
                    id="btn-test-haptic"
                    onClick={handleTriggerHaptic}
                    className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-mono font-bold uppercase border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] flex items-center justify-center space-x-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Trigger Device Vibration / Pulse Test</span>
                  </button>
                </div>
              )}

              {/* 4. Feature for Autism / Sensory: Calming Schedule */}
              {activeDisabilityTab === 'autism_sensory' && (
                <div className="bg-purple-50 p-4 border border-purple-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-900 flex items-center space-x-1.5">
                      <HeartPulse className="w-4 h-4 text-purple-700" />
                      <span>Sensory-Calm & Quiet Arrival Protocol</span>
                    </span>
                    <span className="text-[9px] bg-purple-200 text-purple-900 font-bold px-1.5 py-0.5">
                      No Horn Zone
                    </span>
                  </div>

                  <div className="bg-white p-3 border border-purple-200 text-xs font-mono text-slate-800 space-y-1">
                    <div className="font-bold text-purple-900">Quiet Arrival Protocol Active:</div>
                    <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                      <li>No horn honking at gate (Silent arrival)</li>
                      <li>Predictable countdown schedule displayed</li>
                      <li>Front window seat 3A reserved in quiet section</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Key Safety Checkpoints List */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-1.5">
                  AI Trip Safety Checklist:
                </div>
                <div className="space-y-1">
                  {(aiSafetyPoints.length > 0
                    ? aiSafetyPoints
                    : [
                        'School zone speed compliant (<40 km/h)',
                        'Care Matron standing by for curb guidance',
                        'RFID sensor ready for instant attendance log'
                      ]
                  ).map((point, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-xs font-mono text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006633] shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
