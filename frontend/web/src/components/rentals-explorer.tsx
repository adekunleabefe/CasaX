"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card } from "@casax/ui";
import { RentalCard } from "@/components/rental-card";
import type { VerifiedRental } from "@/lib/rentals";

const defaultFilters = {
  query: "",
  location: "",
  price: "",
  unitType: "",
  bedrooms: "",
  availability: "",
};

interface RentalsExplorerProps {
  rentals: VerifiedRental[];
}

export function RentalsExplorer({ rentals }: RentalsExplorerProps) {
  const [filters, setFilters] = useState(defaultFilters);

  const filteredRentals = useMemo(() => {
    const query = filters.query.toLowerCase().trim();

    return rentals.filter((rental) => {
      const matchesQuery =
        !query ||
        `${rental.title} ${rental.propertyName} ${rental.city} ${rental.state}`
          .toLowerCase()
          .includes(query);
      const matchesLocation =
        !filters.location || rental.city === filters.location;
      const matchesPrice =
        !filters.price ||
        (filters.price === "under-2m" && rental.annualRent < 2_000_000) ||
        (filters.price === "2m-3m" &&
          rental.annualRent >= 2_000_000 &&
          rental.annualRent <= 3_000_000) ||
        (filters.price === "over-3m" && rental.annualRent > 3_000_000);
      const matchesUnitType =
        !filters.unitType || rental.unitType === filters.unitType;
      const matchesBedrooms =
        !filters.bedrooms || rental.bedrooms >= Number(filters.bedrooms);
      const matchesAvailability =
        !filters.availability || rental.availability === filters.availability;

      return (
        matchesQuery &&
        matchesLocation &&
        matchesPrice &&
        matchesUnitType &&
        matchesBedrooms &&
        matchesAvailability
      );
    });
  }, [filters, rentals]);

  function updateFilter(name: keyof typeof defaultFilters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <Card className="border-slate-200/80 p-4 shadow-[0_12px_32px_-26px_rgba(15,23,42,0.32)] sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <SlidersHorizontal className="size-4 text-emerald-700" />
          Find a verified rental
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.55fr_repeat(5,1fr)]">
          <label className="relative block">
            <span className="sr-only">Search rentals</span>
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Search rentals"
              type="search"
              value={filters.query}
            />
          </label>
          <FilterSelect
            label="Location"
            onChange={(value) => updateFilter("location", value)}
            options={[
              ["", "Location"],
              ["Lekki", "Lekki"],
              ["Yaba", "Yaba"],
              ["Victoria Island", "Victoria Island"],
            ]}
            value={filters.location}
          />
          <FilterSelect
            label="Price range"
            onChange={(value) => updateFilter("price", value)}
            options={[
              ["", "Price range"],
              ["under-2m", "Under ₦2m"],
              ["2m-3m", "₦2m - ₦3m"],
              ["over-3m", "Above ₦3m"],
            ]}
            value={filters.price}
          />
          <FilterSelect
            label="Unit type"
            onChange={(value) => updateFilter("unitType", value)}
            options={[
              ["", "Unit type"],
              ["Apartment", "Apartment"],
              ["Flat", "Flat"],
            ]}
            value={filters.unitType}
          />
          <FilterSelect
            label="Bedrooms"
            onChange={(value) => updateFilter("bedrooms", value)}
            options={[
              ["", "Bedrooms"],
              ["1", "1+ bedroom"],
              ["2", "2+ bedrooms"],
              ["3", "3+ bedrooms"],
            ]}
            value={filters.bedrooms}
          />
          <FilterSelect
            label="Availability"
            onChange={(value) => updateFilter("availability", value)}
            options={[
              ["", "Availability"],
              ["Available now", "Available now"],
              ["Available 01 Jun", "Available in June"],
            ]}
            value={filters.availability}
          />
        </div>
      </Card>

      <div className="mb-8 mt-10 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-950">
            {filteredRentals.length}
          </span>{" "}
          verified rentals available
        </p>
        {filteredRentals.length !== rentals.length && (
          <button
            className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            onClick={() => setFilters(defaultFilters)}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredRentals.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRentals.map((rental) => (
            <RentalCard key={rental.slug} rental={rental} showActions />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center border-dashed border-slate-300 px-6 py-16 text-center shadow-none">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="size-5" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            No verified rentals match these filters
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Adjust your search to view other vacancies currently managed through
            CasaX.
          </p>
          <Button
            className="mt-7 rounded-full"
            onClick={() => setFilters(defaultFilters)}
            type="button"
          >
            Clear filters
          </Button>
        </Card>
      )}
    </>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: [string, string][];
  value: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionLabel} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
