export interface VerifiedRental {
  slug: string;
  propertyName: string;
  unitName: string;
  title: string;
  address: string;
  city: string;
  state: string;
  annualRent: number;
  bedrooms: number;
  bathrooms: number;
  unitType: string;
  propertyType: string;
  propertyUnits: number;
  availability: string;
  description: string;
  amenities: string[];
  media: string[];
  managedBy: string;
  managerSince: string;
  accent: string;
  verifiedAt: string;
}

export const verifiedRentals: VerifiedRental[] = [
  {
    slug: "lekki-heights-a3",
    propertyName: "Lekki Heights",
    unitName: "Unit A3",
    title: "Two-bedroom residence in Lekki Phase 1",
    address: "Admiralty Way",
    city: "Lekki",
    state: "Lagos",
    annualRent: 2_400_000,
    bedrooms: 2,
    bathrooms: 2,
    unitType: "Apartment",
    propertyType: "Serviced apartment building",
    propertyUnits: 18,
    availability: "Available now",
    description:
      "A calm, well-managed residence with an active maintenance record and transparent tenancy process.",
    amenities: [
      "24-hour security",
      "Dedicated parking",
      "Backup power",
      "Water supply",
    ],
    media: ["Living room", "Kitchen", "Bedroom", "Building exterior"],
    managedBy: "Lekki Heights Operations",
    managerSince: "Managed on CasaX since 2024",
    accent: "from-slate-950 via-slate-900 to-emerald-900",
    verifiedAt: "Verified today",
  },
  {
    slug: "cedar-court-b12",
    propertyName: "Cedar Court",
    unitName: "Unit B12",
    title: "Modern three-bedroom home in Yaba",
    address: "Herbert Macaulay Way",
    city: "Yaba",
    state: "Lagos",
    annualRent: 1_850_000,
    bedrooms: 3,
    bathrooms: 3,
    unitType: "Flat",
    propertyType: "Residential court",
    propertyUnits: 24,
    availability: "Available 01 Jun",
    description:
      "A spacious family-oriented flat with verified vacancy status and responsive property operations.",
    amenities: [
      "Visitor parking",
      "Gated access",
      "Service area",
      "Prepaid meter",
    ],
    media: ["Main living area", "Primary suite", "Kitchen", "Compound"],
    managedBy: "Cedar Court Management",
    managerSince: "Managed on CasaX since 2023",
    accent: "from-slate-950 via-slate-800 to-slate-700",
    verifiedAt: "Verified 2 hours ago",
  },
  {
    slug: "harbour-view-c7",
    propertyName: "Harbour View",
    unitName: "Unit C7",
    title: "Premium one-bedroom apartment in Victoria Island",
    address: "Akin Adesola Street",
    city: "Victoria Island",
    state: "Lagos",
    annualRent: 3_100_000,
    bedrooms: 1,
    bathrooms: 2,
    unitType: "Apartment",
    propertyType: "Premium apartment tower",
    propertyUnits: 32,
    availability: "Available now",
    description:
      "A refined city apartment in a professionally operated building with verified availability.",
    amenities: [
      "Elevator access",
      "Concierge desk",
      "Backup power",
      "Secure entry",
    ],
    media: ["City view", "Open living room", "Bedroom", "Lobby"],
    managedBy: "Harbour View Management",
    managerSince: "Managed on CasaX since 2025",
    accent: "from-slate-900 via-emerald-950 to-slate-950",
    verifiedAt: "Verified today",
  },
];

export function getRentalBySlug(slug: string) {
  return verifiedRentals.find((rental) => rental.slug === slug);
}
