export const EQUIPMENT = [
  { id: 1, name: "Excavator JD 350G", category: "Heavy Machinery", price: 4500, unit: "day", owner: "Rajesh Kumar", location: "Andheri, Mumbai", rating: 4.8, reviews: 34, available: true, img: "🏗️", tags: ["construction", "digging"], desc: "Powerful excavator for large construction sites. 350G series with GPS tracking." },
  { id: 2, name: "Concrete Mixer 500L", category: "Construction", price: 850, unit: "day", owner: "Priya Sharma", location: "Thane, Mumbai", rating: 4.5, reviews: 21, available: true, img: "🔧", tags: ["construction", "concrete"], desc: "Heavy-duty concrete mixer with 500L capacity. Diesel powered." },
  { id: 3, name: "Tower Crane 8T", category: "Heavy Machinery", price: 12000, unit: "day", owner: "BuildPro Ltd.", location: "Navi Mumbai", rating: 4.9, reviews: 12, available: false, img: "🏛️", tags: ["crane", "lifting"], desc: "8-tonne capacity tower crane. Comes with operator and safety equipment." },
  { id: 4, name: "Generator 50kVA", category: "Power", price: 1200, unit: "day", owner: "PowerRent Co.", location: "Dadar, Mumbai", rating: 4.6, reviews: 55, available: true, img: "⚡", tags: ["power", "generator"], desc: "Silent diesel generator 50kVA. Ideal for events and construction sites." },
  { id: 5, name: "Scissor Lift 6m", category: "Access Equipment", price: 2200, unit: "day", owner: "HighReach Pvt.", location: "Bandra, Mumbai", rating: 4.7, reviews: 18, available: true, img: "🔝", tags: ["access", "lift"], desc: "Electric scissor lift reaching 6m height. Zero-emission indoor use." },
  { id: 6, name: "Hydraulic Jack 20T", category: "Tools", price: 350, unit: "day", owner: "ToolMaster", location: "Kurla, Mumbai", rating: 4.3, reviews: 40, available: true, img: "🔩", tags: ["tools", "lifting"], desc: "20-tonne hydraulic jack set with stands and accessories." },
  { id: 7, name: "Welding Machine MIG", category: "Tools", price: 600, unit: "day", owner: "WeldPro", location: "Vikhroli, Mumbai", rating: 4.4, reviews: 29, available: true, img: "🔆", tags: ["tools", "welding"], desc: "Professional MIG welding machine 250A. Includes wire and accessories." },
  { id: 8, name: "Compactor Plate 90kg", category: "Construction", price: 750, unit: "day", owner: "CompactKing", location: "Mulund, Mumbai", rating: 4.2, reviews: 15, available: true, img: "📐", tags: ["construction", "compaction"], desc: "90kg plate compactor for soil and asphalt compaction." },
];

export const CATEGORIES = ["All", "Heavy Machinery", "Construction", "Power", "Access Equipment", "Tools"];

export const MY_LISTINGS = [
  { id: 101, name: "Bulldozer D6T", category: "Heavy Machinery", price: 5500, unit: "day", status: "Active", rentals: 8, earnings: 44000, img: "🚜" },
  { id: 102, name: "Air Compressor 200L", category: "Tools", price: 450, unit: "day", status: "Active", rentals: 23, earnings: 10350, img: "💨" },
];

export const BOOKINGS = [
  { id: "BK001", equipment: "Generator 50kVA", owner: "PowerRent Co.", from: "2026-03-05", to: "2026-03-08", days: 3, total: 3600, status: "Confirmed", img: "⚡" },
  { id: "BK002", equipment: "Scissor Lift 6m", owner: "HighReach Pvt.", from: "2026-02-20", to: "2026-02-22", days: 2, total: 4400, status: "Completed", img: "🔝" },
];

export const COLORS = {
  primary: "#1e3a8a",
  primaryLight: "#2563eb",
  accent: "#f59e0b",
  success: "#059669",
  successLight: "#d1fae5",
  danger: "#991b1b",
  dangerLight: "#fee2e2",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  white: "#ffffff",
  background: "#f0f4f8",
};
