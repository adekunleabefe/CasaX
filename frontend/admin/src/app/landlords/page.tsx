"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, Plus, Search, Users } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  getAdminLandlords,
  inviteLandlord,
  type AdminLandlordSummary,
} from "@/services/operations";

export default function AdminLandlordsPage() {
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const landlords = useQuery({
    queryKey: ["admin", "landlords"],
    queryFn: getAdminLandlords,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (landlords.data ?? []).filter((landlord) => {
      const name = landlordName(landlord);
      if (!term) return true;
      return [
        name,
        landlord.user.email,
        landlord.businessName ?? "",
        landlord.status ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [landlords.data, search]);

  const totalLandlords = landlords.data?.length ?? 0;
  const activeLandlords = (landlords.data ?? []).filter(
    (landlord) => landlord.user.isActive,
  ).length;
  const pendingInvitations = (landlords.data ?? []).filter(
    (landlord) => landlord.latestInvitation?.status === "PENDING",
  ).length;
  const propertiesUnderManagement = (landlords.data ?? []).reduce(
    (total, landlord) => total + (landlord.propertyCount ?? 0),
    0,
  );

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX Operations"
        title="Landlords"
        description="Manage onboarded property owners and invite new landlords."
        action={
          <Button onClick={() => setShowInvite((value) => !value)}>
            <Plus className="mr-2 size-4" />
            Invite landlord
          </Button>
        }
      />

      {showInvite ? <InviteLandlordCard onClose={() => setShowInvite(false)} /> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total landlords" value={totalLandlords} />
        <SummaryCard label="Active landlords" value={activeLandlords} />
        <SummaryCard label="Pending invitations" value={pendingInvitations} />
        <SummaryCard
          label="Properties under management"
          value={propertiesUnderManagement}
        />
      </div>

      <Card className="mt-8 border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search landlord, email, business, or status"
            value={search}
          />
        </div>
      </Card>

      <section className="mt-7">
        {landlords.isLoading ? <LoadingCards /> : null}
        {landlords.isError ? (
          <ErrorState
            title="Unable to load landlords"
            onRetry={() => void landlords.refetch()}
          />
        ) : null}
        {landlords.isSuccess && rows.length === 0 ? (
          <Card className="py-14 text-center">
            <Users className="mx-auto size-8 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              No landlords found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Invite a property owner to begin CasaX onboarding.
            </p>
          </Card>
        ) : null}
        {rows.length ? <LandlordsTable rows={rows} /> : null}
      </section>
    </main>
  );
}

function InviteLandlordCard({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const invite = useMutation({
    mutationFn: inviteLandlord,
    onSuccess: async (invitation) => {
      formRef.current?.reset();
      setError(undefined);
      setSuccess(
        invitation.emailQueued
          ? `Invitation sent to ${invitation.email}.`
          : `Invitation created for ${invitation.email}, but email delivery needs attention.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "landlords"] });
    },
    onError: (caught) => {
      setSuccess(undefined);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to invite this landlord.",
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(undefined);
    setSuccess(undefined);
    invite.mutate({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      businessName: String(form.get("businessName") ?? ""),
    });
  }

  return (
    <Card className="mt-8 border-emerald-100 bg-white p-8 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Invite-only onboarding
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Invite landlord
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            The property owner receives a secure setup link before CasaX creates
            and verifies property records internally.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <form
        className="mt-7 grid gap-4 sm:grid-cols-2"
        onSubmit={submit}
        ref={formRef}
      >
        <AdminInput label="First name" name="firstName" required />
        <AdminInput label="Last name" name="lastName" required />
        <AdminInput label="Email" name="email" required type="email" />
        <AdminInput label="Business name" name="businessName" />
        {error ? (
          <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700 sm:col-span-2">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">
            {success}
          </p>
        ) : null}
        <Button className="sm:col-span-2" disabled={invite.isPending} type="submit">
          {invite.isPending ? "Sending invitation..." : "Send invitation"}
        </Button>
      </form>
    </Card>
  );
}

function LandlordsTable({ rows }: { rows: AdminLandlordSummary[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden grid-cols-[1fr_1.2fr_1fr_0.7fr_0.6fr_0.6fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
        <span>Name</span>
        <span>Email</span>
        <span>Business name</span>
        <span>Status</span>
        <span>Properties</span>
        <span>Units</span>
        <span>Date invited/created</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((landlord) => (
          <LandlordRow key={landlord.id} landlord={landlord} />
        ))}
      </div>
    </Card>
  );
}

function LandlordRow({ landlord }: { landlord: AdminLandlordSummary }) {
  const status = landlord.user.isActive ? "Active" : "Invited";
  const createdDate =
    landlord.latestInvitation?.createdAt ?? landlord.createdAt ?? landlord.user.createdAt;

  return (
    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1.2fr_1fr_0.7fr_0.6fr_0.6fr_0.8fr_0.7fr] lg:items-center">
      <Metric label="Name" value={landlordName(landlord)} />
      <Metric label="Email" value={landlord.user.email} />
      <Metric label="Business name" value={landlord.businessName ?? "-"} />
      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {status}
      </span>
      <Metric label="Properties" value={String(landlord.propertyCount ?? 0)} />
      <Metric label="Units" value={String(landlord.unitCount ?? 0)} />
      <Metric
        label="Date invited/created"
        value={createdDate ? new Date(createdDate).toLocaleDateString() : "-"}
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild className="px-3 py-2 text-xs" variant="outline">
          <Link href={`/property-setup?landlord=${landlord.id}`}>
            <Building2 className="mr-1 size-3" />
            Properties
          </Link>
        </Button>
        <Button asChild className="px-3 py-2 text-xs" variant="ghost">
          <a href={`mailto:${landlord.user.email}`}>
            <Mail className="mr-1 size-3" />
            Email
          </a>
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 lg:hidden">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700 lg:mt-0">
        {value}
      </p>
    </div>
  );
}

function AdminInput({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function landlordName(landlord: AdminLandlordSummary) {
  return landlord.user.profile
    ? `${landlord.user.profile.firstName} ${landlord.user.profile.lastName}`
    : "Unnamed landlord";
}
