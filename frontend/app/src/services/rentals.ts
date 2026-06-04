import { apiRequest } from "./api";

export interface PublicRental {
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
  photos: string[];
  inspectionAvailability: string;
  accent: string;
  verifiedAt: string;
}

export interface PublicRentalsList {
  items: PublicRental[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type WireRental = Omit<PublicRental, "annualRent"> & {
  annualRent: number | string;
};

function normalizeRental(rental: WireRental): PublicRental {
  return {
    ...rental,
    annualRent: Number(rental.annualRent),
  };
}

export async function getPublicRentals(): Promise<PublicRentalsList> {
  const response = await apiRequest<{
    items: WireRental[];
    pagination: PublicRentalsList["pagination"];
  }>("/public/rentals");
  return {
    ...response,
    items: response.items.map(normalizeRental),
  };
}
