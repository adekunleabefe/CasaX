"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card } from "@casax/ui";
import { RentalCard } from "@/components/rental-card";
import type { VerifiedRental } from "@/lib/rentals";

const defaultFilters = {
  query: "",
  location: "",
  minRent: "",
  maxRent: "",
  unitType: "",
  bedrooms: "",
};

const categoryChips = [
  "All",
  "Mini flat",
  "Self-contained",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "Studio",
  "House",
];

interface RentalsExplorerProps {
  rentals: VerifiedRental[];
  isPreviewMode?: boolean;
  initialFilters?: Partial<typeof defaultFilters>;
}

export function RentalsExplorer({
  initialFilters = {},
  rentals,
  isPreviewMode = false,
}: RentalsExplorerProps) {
  const [filters, setFilters] = useState({
    ...defaultFilters,
    ...initialFilters,
  });

  const filteredRentals = useMemo(() => {
    const query = filters.query.toLowerCase().trim();
    const location = filters.location.toLowerCase().trim();
    const unitType = normalizeFilterValue(filters.unitType);

    return rentals.filter((rental) => {
      const rentalLocation = `${rental.city} ${rental.state}`.toLowerCase();
      const matchesQuery =
        !query ||
        `${rental.title} ${rental.propertyName} ${rental.city} ${rental.state}`
          .toLowerCase()
          .includes(query);
      const matchesLocation =
        !location || rentalLocation.includes(location);
      const matchesPrice =
        (!filters.minRent || rental.annualRent >= Number(filters.minRent)) &&
        (!filters.maxRent || rental.annualRent <= Number(filters.maxRent));
      const matchesUnitType =
        !unitType || normalizeFilterValue(rental.unitType).includes(unitType);
      const matchesBedrooms =
        !filters.bedrooms || rental.bedrooms >= Number(filters.bedrooms);

      return (
        matchesQuery &&
        matchesLocation &&
        matchesPrice &&
        matchesUnitType &&
        matchesBedrooms
      );
    });
  }, [filters, rentals]);

  function updateFilter(name: keyof typeof defaultFilters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <Card className="border-slate-200/80 bg-white p-4 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.38)] sm:p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <SlidersHorizontal className="size-4 text-emerald-700" />
            {isPreviewMode
              ? "Explore sample apartments"
              : "Find a verified rental"}
          </div>
          <p className="text-xs text-slate-500">
            Search by city, unit type, annual rent, or bedroom count.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
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
          <input
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            onChange={(event) => updateFilter("location", event.target.value)}
            placeholder="Location"
            value={filters.location}
          />
          <FilterSelect
            label="Unit type"
            onChange={(value) => updateFilter("unitType", value)}
            options={[
              ["", "Unit type"],
              ...Array.from(
                new Set(rentals.map((rental) => rental.unitType)),
              ).map((unitType) => [unitType, unitType] as [string, string]),
            ]}
            value={filters.unitType}
          />
          <input
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            inputMode="numeric"
            onChange={(event) => updateFilter("minRent", event.target.value)}
            placeholder="Min rent"
            value={filters.minRent}
          />
          <input
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            inputMode="numeric"
            onChange={(event) => updateFilter("maxRent", event.target.value)}
            placeholder="Max rent"
            value={filters.maxRent}
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
        </div>
      </Card>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {categoryChips.map((chip) => {
          const active =
            chip === "All"
              ? !filters.unitType
              : normalizeFilterValue(filters.unitType) ===
                normalizeFilterValue(chip);
          return (
            <button
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              key={chip}
              onClick={() => updateFilter("unitType", chip === "All" ? "" : chip)}
              type="button"
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div className="mb-7 mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-950">
            {filteredRentals.length}
          </span>{" "}
          {isPreviewMode ? "preview apartments" : "verified rentals available"}
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRentals.map((rental) => (
            <RentalCard
              key={rental.slug}
              rental={rental}
              showActions={!isPreviewMode}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center shadow-none">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="size-5" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            No verified rentals match these filters
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Adjust your search to view other rentals currently available through
            CasaX.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              className="rounded-full"
              onClick={() => setFilters(defaultFilters)}
              type="button"
            >
              Clear filters
            </Button>
            <Button
              className="rounded-full"
              onClick={() => updateFilter("location", "Lagos")}
              type="button"
              variant="outline"
            >
              Try Lagos
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function normalizeFilterValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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
