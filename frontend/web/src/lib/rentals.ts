const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");
const apiAssetOrigin = apiBaseUrl.replace(/\/api\/v\d+\/?$/, "");

export const rentalImageFallback =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="60%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <circle cx="900" cy="170" r="220" fill="#10b981" opacity="0.18"/>
      <text x="80" y="675" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700">CasaX verified rental</text>
      <text x="82" y="724" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="28">Photo coming soon</text>
    </svg>`,
  );

export interface VerifiedRental {
  id: string;
  vacancyListingId: string;
  propertyId: string;
  unitId: string;
  slug: string;
  propertyName: string;
  unitName: string;
  title: string;
  address: string;
  city: string;
  state: string;
  annualRent: number;
  bedrooms: number;
  bathrooms: number | null;
  unitType: string;
  propertyType: string;
  propertyUnits: number;
  availability: string;
  description: string;
  amenities: string[];
  media: string[];
  photos: string[];
  inspectionAvailability: string;
  accent: string;
  verifiedAt: string;
  isPreview?: boolean;
}

export interface RentalsList {
  items: VerifiedRental[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RentalFilters {
  location?: string;
  city?: string;
  minRent?: string;
  maxRent?: string;
  unitType?: string;
  bedrooms?: string;
}

export function resolveAssetUrl(path?: string | null) {
  const value = path?.trim();
  if (!value) return rentalImageFallback;

  try {
    return new URL(value).toString();
  } catch {
    if (value.startsWith("/uploads")) {
      return `${apiAssetOrigin}${value}`;
    }
    if (value.startsWith("/")) {
      return value;
    }
    return rentalImageFallback;
  }
}

async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    next: { revalidate: 60 },
  });
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Unable to load CasaX rentals.");
  }
  return payload.data;
}

export function getRentals(filters: RentalFilters = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return publicApi<RentalsList>(`/public/rentals${suffix}`);
}

export function getRentalBySlug(slug: string) {
  return publicApi<VerifiedRental>(`/public/rentals/${slug}`);
}

export function authHandoffUrl(intent: "inspection" | "apply" | "save", slug: string) {
  const url = new URL("/auth", process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000");
  url.searchParams.set("intent", intent);
  url.searchParams.set("rental", slug);
  url.searchParams.set("next", `/rentals/${slug}`);
  return `${url.pathname}${url.search}`;
}

export const previewRentals: VerifiedRental[] = [
  {
    id: "preview-1",
    vacancyListingId: "preview-1",
    propertyId: "preview-property-1",
    unitId: "preview-unit-1",
    slug: "preview-ikoyi-waterfront-one-bedroom",
    propertyName: "Adeniyi Jones Residences",
    unitName: "One-bedroom Apartment",
    title: "One-bedroom apartment in a serviced residential block",
    address: "Adeniyi Jones Avenue",
    city: "Ikeja",
    state: "Lagos",
    annualRent: 1800000,
    bedrooms: 1,
    bathrooms: 1,
    unitType: "One-bedroom",
    propertyType: "Apartment block",
    propertyUnits: 18,
    availability: "Preview",
    description:
      "A sample CasaX rental preview showing the kind of verified apartment information renters can expect.",
    amenities: ["Gated access", "Water supply", "Parking"],
    media: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-900 via-slate-800 to-emerald-900",
    verifiedAt: "",
    isPreview: true,
  },
  {
    id: "preview-2",
    vacancyListingId: "preview-2",
    propertyId: "preview-property-2",
    unitId: "preview-unit-2",
    slug: "preview-lekki-mini-flat",
    propertyName: "Chevron Court",
    unitName: "Mini-flat",
    title: "Bright mini-flat near Lekki conservation axis",
    address: "Chevron Drive",
    city: "Lekki",
    state: "Lagos",
    annualRent: 2200000,
    bedrooms: 1,
    bathrooms: 1,
    unitType: "Mini-flat",
    propertyType: "Residential estate",
    propertyUnits: 24,
    availability: "Preview",
    description:
      "A sample CasaX preview apartment for renters exploring upcoming verified apartments.",
    amenities: ["Estate security", "Parking", "Tiled floors"],
    media: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-900 via-emerald-900 to-slate-800",
    verifiedAt: "",
    isPreview: true,
  },
  {
    id: "preview-3",
    vacancyListingId: "preview-3",
    propertyId: "preview-property-3",
    unitId: "preview-unit-3",
    slug: "preview-yaba-two-bedroom",
    propertyName: "Sabo Heights",
    unitName: "Two-bedroom Apartment",
    title: "Two-bedroom apartment close to Yaba transit routes",
    address: "Sabo",
    city: "Yaba",
    state: "Lagos",
    annualRent: 2800000,
    bedrooms: 2,
    bathrooms: 2,
    unitType: "Two-bedroom",
    propertyType: "Apartment block",
    propertyUnits: 12,
    availability: "Preview",
    description:
      "A sample apartment preview with marketing information only, not occupancy or review history.",
    amenities: ["Balcony", "Water supply", "Secure compound"],
    media: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-900 via-slate-700 to-emerald-800",
    verifiedAt: "",
    isPreview: true,
  },
  {
    id: "preview-4",
    vacancyListingId: "preview-4",
    propertyId: "preview-property-4",
    unitId: "preview-unit-4",
    slug: "preview-gwarinpa-self-contained",
    propertyName: "Gwarinpa Garden Flats",
    unitName: "Self-contained Studio",
    title: "Self-contained apartment in a calm residential cluster",
    address: "3rd Avenue",
    city: "Gwarinpa",
    state: "Abuja",
    annualRent: 950000,
    bedrooms: 1,
    bathrooms: 1,
    unitType: "Self-contained",
    propertyType: "Residential flats",
    propertyUnits: 10,
    availability: "Preview",
    description:
      "A sample CasaX preview apartment showing basic property marketing details.",
    amenities: ["Private bathroom", "Water supply", "Compound parking"],
    media: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-950 via-slate-800 to-orange-900",
    verifiedAt: "",
    isPreview: true,
  },
  {
    id: "preview-5",
    vacancyListingId: "preview-5",
    propertyId: "preview-property-5",
    unitId: "preview-unit-5",
    slug: "preview-port-harcourt-three-bedroom",
    propertyName: "Peter Odili Road Residences",
    unitName: "Three-bedroom Apartment",
    title: "Three-bedroom apartment with family-friendly layout",
    address: "Peter Odili Road",
    city: "Port Harcourt",
    state: "Rivers",
    annualRent: 3200000,
    bedrooms: 3,
    bathrooms: 3,
    unitType: "Three-bedroom",
    propertyType: "Apartment block",
    propertyUnits: 16,
    availability: "Preview",
    description:
      "A sample preview apartment for the kind of reviewed rental information CasaX publishes.",
    amenities: ["Family layout", "Parking", "Gated access"],
    media: [
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-900 via-slate-800 to-emerald-950",
    verifiedAt: "",
    isPreview: true,
  },
  {
    id: "preview-6",
    vacancyListingId: "preview-6",
    propertyId: "preview-property-6",
    unitId: "preview-unit-6",
    slug: "preview-ajah-two-bedroom",
    propertyName: "Sangotedo Park Apartments",
    unitName: "Two-bedroom Apartment",
    title: "Two-bedroom apartment around Sangotedo residential corridor",
    address: "Sangotedo",
    city: "Ajah",
    state: "Lagos",
    annualRent: 2400000,
    bedrooms: 2,
    bathrooms: 2,
    unitType: "Two-bedroom",
    propertyType: "Apartment block",
    propertyUnits: 20,
    availability: "Preview",
    description:
      "A sample CasaX preview apartment using only public-facing property marketing information.",
    amenities: ["Estate access", "Parking", "Water supply"],
    media: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    photos: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    inspectionAvailability: "Inspection booking opens for live rentals",
    accent: "from-slate-950 via-emerald-950 to-slate-800",
    verifiedAt: "",
    isPreview: true,
  },
];
