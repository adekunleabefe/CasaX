"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BadgeCheck, ExternalLink, Eye, Pencil, Search } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  archiveAdminVacancy,
  getAdminVacancies,
  publishAdminVacancyListing,
  restoreAdminVacancyDraft,
  unpublishAdminVacancy,
  type AdminVacancyListing,
  type AdminVacancyStatus,
} from "@/services/operations";

const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

type VacancyTab = "published" | "drafts" | "archived";

const tabs: { label: string; value: VacancyTab; statuses: AdminVacancyStatus[] }[] = [
  { label: "Published", value: "published", statuses: ["PUBLISHED"] },
  { label: "Drafts", value: "drafts", statuses: ["PRIVATE"] },
  { label: "Archived", value: "archived", statuses: ["UNPUBLISHED", "FILLED"] },
];

const vacancyLabels: Record<AdminVacancyStatus, string> = {
  PRIVATE: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Archived",
  FILLED: "Filled",
};

export default function AdminVacanciesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = tabFromQuery(searchParams.get("tab"));
  const [search, setSearch] = useState("");
  const vacancies = useQuery({
    queryKey: ["admin", "vacancies"],
    queryFn: () => getAdminVacancies(),
  });

  const grouped = useMemo(() => {
    const rows = vacancies.data ?? [];
    return {
      published: rows.filter((item) => item.status === "PUBLISHED"),
      drafts: rows.filter((item) => item.status === "PRIVATE"),
      archived: rows.filter((item) =>
        ["UNPUBLISHED", "FILLED"].includes(item.status),
      ),
    } satisfies Record<VacancyTab, AdminVacancyListing[]>;
  }, [vacancies.data]);

  const filteredRows = useMemo(() => {
    return filterRows(grouped[activeTab], search, (vacancy) => [
      vacancy.title,
      vacancy.unit?.name ?? "",
      vacancy.unit?.unitType ?? "",
      vacancy.unit?.property.name ?? "",
      vacancy.unit?.property.city ?? "",
      vacancy.unit?.property.state ?? "",
    ]);
  }, [activeTab, grouped, search]);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Vacancy publishing"
        description="Manage vacancy drafts, published rental listings, and archived vacancy records."
      />

      <Card className="mt-8 border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search listing, property, unit, or location"
            value={search}
          />
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.value
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            key={tab.value}
            onClick={() => router.replace(`/vacancy-publishing?tab=${tab.value}`)}
            type="button"
          >
            {tab.label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.value
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {grouped[tab.value].length}
            </span>
          </button>
        ))}
      </div>

      <section className="mt-6">
        {vacancies.isLoading ? <LoadingCards /> : null}
        {vacancies.isError ? (
          <ErrorState
            title="Unable to load vacancy publishing records"
            onRetry={() => void vacancies.refetch()}
          />
        ) : null}
        {!vacancies.isLoading && !vacancies.isError ? (
          <VacancyTable rows={filteredRows} tab={activeTab} />
        ) : null}
      </section>
    </main>
  );
}

function VacancyTable({
  rows,
  tab,
}: {
  rows: AdminVacancyListing[];
  tab: VacancyTab;
}) {
  if (rows.length === 0) {
    const copy = {
      drafts: {
        title: "No draft vacancies yet",
        description:
          "No draft vacancies yet. Prepare a vacancy from a ready unit inside Property Setup.",
      },
      published: {
        title: "No published listings yet",
        description:
          "Published CasaX rental listings will appear here after vacancy drafts go live.",
      },
      archived: {
        title: "No archived vacancies yet",
        description:
          "Unpublished or filled vacancy records will be stored here for operational history.",
      },
    }[tab];
    return <EmptyState description={copy.description} title={copy.title} />;
  }

  return (
    <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-950">{sectionTitle(tab)}</h2>
        <p className="mt-1 text-sm text-slate-500">{sectionDescription(tab)}</p>
      </div>
      <div className="divide-y divide-slate-100">
        <TableHeader tab={tab} />
        {rows.map((vacancy) => (
          <VacancyRow key={vacancy.id} tab={tab} vacancy={vacancy} />
        ))}
      </div>
    </Card>
  );
}

function TableHeader({ tab }: { tab: VacancyTab }) {
  if (tab === "drafts") {
    return (
      <div className="hidden grid-cols-[1.2fr_1fr_0.75fr_0.9fr_0.8fr_0.8fr_0.8fr_1.15fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:grid">
        <span>Draft listing</span>
        <span>Property</span>
        <span>Unit</span>
        <span>Location</span>
        <span>Unit type</span>
        <span>Annual rent</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
    );
  }
  if (tab === "archived") {
    return (
      <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.9fr_0.9fr_0.9fr_1fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:grid">
        <span>Listing</span>
        <span>Property</span>
        <span>Unit</span>
        <span>Annual rent</span>
        <span>Last status</span>
        <span>Archived date</span>
        <span>Actions</span>
      </div>
    );
  }
  return (
    <div className="hidden grid-cols-[1.4fr_1fr_0.75fr_0.9fr_0.9fr_0.75fr_0.8fr_1.15fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:grid">
      <span>Listing</span>
      <span>Property</span>
      <span>Unit</span>
      <span>Annual rent</span>
      <span>Published date</span>
      <span>Applications</span>
      <span>Status</span>
      <span>Actions</span>
    </div>
  );
}

function VacancyRow({
  vacancy,
  tab,
}: {
  vacancy: AdminVacancyListing;
  tab: VacancyTab;
}) {
  const queryClient = useQueryClient();
  const publish = useMutation({
    mutationFn: () => publishAdminVacancyListing(vacancy.id),
    onSuccess: () => invalidateVacancies(queryClient),
  });
  const unpublish = useMutation({
    mutationFn: () => unpublishAdminVacancy(vacancy.id),
    onSuccess: () => invalidateVacancies(queryClient),
  });
  const archive = useMutation({
    mutationFn: () => archiveAdminVacancy(vacancy.id),
    onSuccess: () => invalidateVacancies(queryClient),
  });
  const restore = useMutation({
    mutationFn: () => restoreAdminVacancyDraft(vacancy.id),
    onSuccess: () => invalidateVacancies(queryClient),
  });
  const applicationCount = vacancy.unit?.applications?.length ?? 0;
  const publicUrl = `${WEB_URL}/rentals/${slugForVacancy(vacancy)}`;

  if (tab === "drafts") {
    return (
      <div className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1.2fr_1fr_0.75fr_0.9fr_0.8fr_0.8fr_0.8fr_1.15fr] xl:items-center">
        <ListingCell vacancy={vacancy} />
        <Cell label="Property">{vacancy.unit?.property.name ?? "-"}</Cell>
        <Cell label="Unit">{vacancy.unit?.name ?? "-"}</Cell>
        <Cell label="Location">{locationFor(vacancy)}</Cell>
        <Cell label="Unit type">{vacancy.unit?.unitType ?? "-"}</Cell>
        <Cell label="Annual rent">{rentFor(vacancy)}</Cell>
        <Cell label="Status"><StatusPill label="Draft" tone="slate" /></Cell>
        <Cell label="Actions">
          <RowActions>
            <Button className="h-9 rounded-full px-3 text-xs" disabled variant="outline">
              <Eye className="mr-1.5 size-3.5" />
              Preview
            </Button>
            <Button className="h-9 rounded-full px-3 text-xs" disabled variant="outline">
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Button>
            <Button
              className="h-9 rounded-full px-3 text-xs"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
              type="button"
            >
              {publish.isPending ? "Publishing..." : "Publish"}
            </Button>
            <Button
              className="h-9 rounded-full px-3 text-xs"
              disabled={archive.isPending}
              onClick={() => archive.mutate()}
              type="button"
              variant="outline"
            >
              Archive
            </Button>
          </RowActions>
        </Cell>
      </div>
    );
  }

  if (tab === "archived") {
    return (
      <div className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1.4fr_1fr_0.8fr_0.9fr_0.9fr_0.9fr_1fr] xl:items-center">
        <ListingCell vacancy={vacancy} />
        <Cell label="Property">{vacancy.unit?.property.name ?? "-"}</Cell>
        <Cell label="Unit">{vacancy.unit?.name ?? "-"}</Cell>
        <Cell label="Annual rent">{rentFor(vacancy)}</Cell>
        <Cell label="Last status">
          <StatusPill
            label={vacancyLabels[vacancy.status]}
            tone={vacancy.status === "FILLED" ? "green" : "slate"}
          />
        </Cell>
        <Cell label="Archived date">{formatDate(vacancy.updatedAt)}</Cell>
        <Cell label="Actions">
          <RowActions>
            <Button
              className="h-9 rounded-full px-3 text-xs"
              disabled={restore.isPending}
              onClick={() => restore.mutate()}
              type="button"
            >
              {restore.isPending ? "Restoring..." : "Restore to Draft"}
            </Button>
            <Button className="h-9 rounded-full px-3 text-xs" disabled variant="outline">
              View
            </Button>
          </RowActions>
        </Cell>
      </div>
    );
  }

  return (
    <div className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1.4fr_1fr_0.75fr_0.9fr_0.9fr_0.75fr_0.8fr_1.15fr] xl:items-center">
      <ListingCell vacancy={vacancy} />
      <Cell label="Property">{vacancy.unit?.property.name ?? "-"}</Cell>
      <Cell label="Unit">{vacancy.unit?.name ?? "-"}</Cell>
      <Cell label="Annual rent">{rentFor(vacancy)}</Cell>
      <Cell label="Published date">{formatDate(vacancy.publishedAt)}</Cell>
      <Cell label="Applications">{applicationCount}</Cell>
      <Cell label="Status"><StatusPill label="Published" tone="green" /></Cell>
      <Cell label="Actions">
        <RowActions>
          <Button className="h-9 rounded-full px-3 text-xs" variant="outline" asChild>
            <a href={publicUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="mr-1.5 size-3.5" />
              Open Public Listing
            </a>
          </Button>
          <Button className="h-9 rounded-full px-3 text-xs" disabled variant="outline">
            Edit
          </Button>
          <Button
            className="h-9 rounded-full px-3 text-xs"
            disabled={unpublish.isPending}
            onClick={() => unpublish.mutate()}
            type="button"
            variant="outline"
          >
            {unpublish.isPending ? "Unpublishing..." : "Unpublish"}
          </Button>
          <Button
            className="h-9 rounded-full px-3 text-xs"
            disabled={archive.isPending}
            onClick={() => archive.mutate()}
            type="button"
            variant="outline"
          >
            <Archive className="mr-1.5 size-3.5" />
            Archive
          </Button>
        </RowActions>
      </Cell>
    </div>
  );
}

function ListingCell({ vacancy }: { vacancy: AdminVacancyListing }) {
  return (
    <Cell label="Listing">
      <p className="font-semibold text-slate-950">{vacancy.title}</p>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
        {vacancy.description ?? "CasaX-reviewed vacancy"}
      </p>
    </Cell>
  );
}

function Cell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
        {label}
      </p>
      <div className="text-slate-700">{children}</div>
    </div>
  );
}

function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "slate";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        tone === "green"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card className="py-14 text-center">
      <BadgeCheck className="mx-auto size-8 text-emerald-700" />
      <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Card>
  );
}

function filterRows<T>(
  rows: T[],
  search: string,
  getValues: (row: T) => (string | number | null | undefined)[],
) {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) =>
    getValues(row).join(" ").toLowerCase().includes(term),
  );
}

function formatCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function rentFor(vacancy: AdminVacancyListing) {
  return vacancy.unit ? formatCurrency(vacancy.unit.rentAmount) : "-";
}

function locationFor(vacancy: AdminVacancyListing) {
  if (!vacancy.unit) return "-";
  return `${vacancy.unit.property.city}, ${vacancy.unit.property.state}`;
}

function sectionTitle(tab: VacancyTab) {
  if (tab === "drafts") return "Draft vacancies";
  if (tab === "archived") return "Archived vacancies";
  return "Published vacancies";
}

function sectionDescription(tab: VacancyTab) {
  if (tab === "drafts") {
    return "Draft vacancy records prepared from ready units inside Property Setup.";
  }
  if (tab === "archived") {
    return "Historical unpublished or filled vacancy records kept for operations visibility.";
  }
  return "Live CasaX-reviewed rental listings visible on CasaX.ng.";
}

function tabFromQuery(value: string | null): VacancyTab {
  if (value === "drafts" || value === "archived" || value === "published") {
    return value;
  }
  return "published";
}

function slugForVacancy(vacancy: AdminVacancyListing) {
  const readable = vacancy.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${readable || "rental"}-${vacancy.id}`;
}

function invalidateVacancies(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["admin", "vacancies"] });
  void queryClient.invalidateQueries({
    queryKey: ["admin", "vacancies", "ready-units"],
  });
  void queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
}
