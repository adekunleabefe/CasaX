"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicRentals } from "@/services/rentals";

export const rentalKeys = {
  public: ["public-rentals"] as const,
};

export function usePublicRentals() {
  return useQuery({
    queryKey: rentalKeys.public,
    queryFn: getPublicRentals,
  });
}
