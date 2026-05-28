"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Building2, MapPin, Plus } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { useProperties } from "@/features/properties/queries";
import {
  EmptyProperties,
  ErrorState,
  LoadingCards,
} from "@/components/operations/query-states";
import { PageHeader } from "@/components/operations/page-header";
import { StatusBadge } from "@/components/operations/status-badge";

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const properties = useProperties(submittedSearch);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Properties"
        title="Managed portfolio"
        description="Owned property records with unit inventory and operational status."
        action={
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 size-4" /> Add property
            </Link>
          </Button>
        }
      />
      <form className="mt-8 flex max-w-xl gap-3" onSubmit={submitSearch}>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search property, city, or address"
          value={search}
        />
        <Button variant="outline" type="submit">
          Search
        </Button>
      </form>
      <section className="mt-7">
        {properties.isLoading ? <LoadingCards /> : null}
        {properties.isError ? (
          <ErrorState
            title="Unable to load properties"
            onRetry={() => void properties.refetch()}
          />
        ) : null}
        {properties.data?.items.length === 0 ? (
          submittedSearch ? (
            <Card className="py-14 text-center">
              <h2 className="font-semibold">No properties match your search</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try another location or property name.
              </p>
            </Card>
          ) : (
            <EmptyProperties
              action={
                <Button asChild>
                  <Link href="/properties/new">Create property</Link>
                </Button>
              }
            />
          )
        ) : null}
        {properties.data?.items.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {properties.data.items.map((property) => (
              <Card className="flex flex-col" key={property.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950">
                    <Building2 className="size-5 text-white" />
                  </div>
                  <StatusBadge status={property.status} />
                </div>
                <h2 className="mt-5 text-lg font-semibold">{property.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="size-4" />
                  {property.city}, {property.state}
                </p>
                <div className="mt-6 flex gap-6 border-t border-slate-100 pt-5 text-sm">
                  <div>
                    <p className="text-slate-500">Units</p>
                    <p className="mt-1 font-semibold">
                      {property._count.units}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Record type</p>
                    <p className="mt-1 font-semibold">{property.type}</p>
                  </div>
                </div>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                  href={`/properties/${property.id}`}
                >
                  Open property <ArrowRight className="size-4" />
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
