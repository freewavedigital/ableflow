import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format, isToday, parseISO } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Navigation, User, Briefcase, AlertCircle, Loader2 } from "lucide-react";

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const JOB_STATUS_COLORS = {
  scheduled: "#3b82f6",
  dispatched: "#06b6d4",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  cancelled: "#94a3b8",
  follow_up_required: "#f97316",
  default: "#6366f1",
};

function createJobIcon(status) {
  const color = JOB_STATUS_COLORS[status] || JOB_STATUS_COLORS.default;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function createTechIcon(name) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="#1e293b" stroke="white" stroke-width="2"/>
      <text x="18" y="23" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="white">${initials}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// Geocodes an address string using Nominatim
async function geocode(address) {
  if (!address) return null;
  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

export default function MapView({ jobs, technicians, selectedDate }) {
  const [jobCoords, setJobCoords] = useState({}); // { jobId: { lat, lng } | null }
  const [techLocations, setTechLocations] = useState({}); // { userEmail: { lat, lng, name } }
  const [geocoding, setGeocoding] = useState(false);
  const geocodedRef = useRef(new Set());

  // Filter to today's jobs with an address
  const todayJobs = jobs.filter(
    (j) => j.scheduled_date && isToday(parseISO(j.scheduled_date)) && (j.site_address || j.site_suburb)
  );

  // Geocode today's job addresses
  useEffect(() => {
    const toGeocode = todayJobs.filter(
      (j) => !geocodedRef.current.has(j.id) && (j.site_address || j.site_suburb)
    );
    if (toGeocode.length === 0) return;

    setGeocoding(true);
    Promise.all(
      toGeocode.map(async (j) => {
        const addr = [j.site_address, j.site_suburb].filter(Boolean).join(", ") + ", Australia";
        const coords = await geocode(addr);
        geocodedRef.current.add(j.id);
        return { id: j.id, coords };
      })
    ).then((results) => {
      const updates = {};
      results.forEach(({ id, coords }) => { updates[id] = coords; });
      setJobCoords((prev) => ({ ...prev, ...updates }));
      setGeocoding(false);
    });
  }, [todayJobs.length]);

  // Watch technician geolocation (simulated — uses browser location for current user as proxy)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Store current user's location under a "me" key
        setTechLocations((prev) => ({
          ...prev,
          me: { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "My Location" },
        }));
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const mappedJobs = todayJobs.filter((j) => jobCoords[j.id]);
  const allPoints = [
    ...mappedJobs.map((j) => jobCoords[j.id]),
    ...Object.values(techLocations),
  ].filter(Boolean);

  const JOB_TYPE_LABELS = {
    leak_inspection: "Leak Inspection",
    structural_inspection: "Structural Inspection",
    pressure_test: "Pressure Test",
    scuba_dive_test: "Scuba Dive Test",
    pipe_blockage: "Pipe Blockage",
    repair: "Repair",
    domestic_inspection: "Domestic Inspection",
    service_call: "Service Call",
    follow_up: "Follow-up",
    other: "Other",
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: "600px" }}>
      {/* Loading overlay */}
      {geocoding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground shadow">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Locating job addresses…
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs space-y-1.5 shadow">
        <p className="font-semibold text-foreground mb-2">Legend</p>
        {Object.entries(JOB_STATUS_COLORS).filter(([k]) => k !== "default").map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <span className="w-3 h-3 rounded-full bg-slate-800 flex-shrink-0" />
          <span className="text-muted-foreground">Technician</span>
        </div>
      </div>

      {/* No jobs message */}
      {!geocoding && todayJobs.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/60 pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No jobs scheduled for today</p>
            <p className="text-xs text-muted-foreground/60">Jobs with addresses will appear as pins on the map</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[-33.8688, 151.2093]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPoints.length > 0 && <FitBounds points={allPoints} />}

        {/* Job markers */}
        {mappedJobs.map((job) => {
          const coords = jobCoords[job.id];
          if (!coords) return null;
          return (
            <Marker key={job.id} position={[coords.lat, coords.lng]} icon={createJobIcon(job.status)}>
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-semibold text-sm mb-1">{job.job_number || "Job"}</div>
                  <div className="text-xs text-gray-600 mb-1">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    📍 {[job.site_address, job.site_suburb].filter(Boolean).join(", ")}
                  </div>
                  {job.scheduled_time_start && (
                    <div className="text-xs text-gray-500 mb-1">🕐 {job.scheduled_time_start}{job.scheduled_time_end ? ` – ${job.scheduled_time_end}` : ""}</div>
                  )}
                  {job.contact_name && <div className="text-xs text-gray-500 mb-2">👤 {job.contact_name}</div>}
                  <a
                    href={`/JobDetail?id=${job.id}`}
                    className="text-xs text-blue-600 underline"
                  >
                    View Job →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Technician location markers */}
        {Object.entries(techLocations).map(([key, loc]) => (
          <Marker key={key} position={[loc.lat, loc.lng]} icon={createTechIcon(loc.name)}>
            <Popup>
              <div className="text-sm font-semibold">{loc.name}</div>
              <div className="text-xs text-gray-500 mt-1">Current location</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}