"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Phone,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { useCurrentApplicant } from "@/lib/applicant-queries";

type SettingsTab = "personal" | "security" | "notifications" | "preferences";

const tabs: { label: string; value: SettingsTab; icon: typeof UserRound }[] = [
  { label: "Personal", value: "personal", icon: UserRound },
  { label: "Security", value: "security", icon: LockKeyhole },
  { label: "Notifications", value: "notifications", icon: Bell },
  { label: "Preferences", value: "preferences", icon: Settings2 },
];

export default function ApplicantProfilePage() {
  const currentUser = useCurrentApplicant();
  const profile = currentUser.data?.profile;
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const [notice, setNotice] = useState<string | null>(null);

  const email = currentUser.data?.email ?? "";
  const firstName = profile?.firstName ?? "";
  const lastName = profile?.lastName ?? "";
  const phone = profile?.phone ?? "";
  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    "CasaX user";
  const initials = getInitials(fullName, email);

  return (
    <>
      <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">
            CasaX account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Your CasaX profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep your details ready for inspections and rental applications.
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-semibold text-white shadow-lg shadow-slate-300/70">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {fullName}
                </h2>
                <Badge className="bg-emerald-50 text-emerald-700">
                  CasaX account
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <Mail className="size-4 text-slate-400" />
                  {email || "Email unavailable"}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="size-4 text-slate-400" />
                  {profile?.phone ?? "Phone not added"}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Joined
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              Available after account audit sync
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Your CasaX account connects saved rentals, inspections, and
              applications before resident onboarding.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-slate-200 bg-white p-0 shadow-sm shadow-slate-200/50">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;
              return (
                <button
                  className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setNotice(null);
                  }}
                  type="button"
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === "personal" ? (
              <PersonalTab
                email={email}
                firstName={firstName}
                key={`${email}-${firstName}-${lastName}-${phone}`}
                lastName={lastName}
                notice={notice}
                phone={phone}
                onReset={() => setNotice(null)}
                onSave={() =>
                  setNotice(
                    "Profile editing UI is ready. Connect a backend profile update endpoint to persist these changes.",
                  )
                }
              />
            ) : (
              <PlaceholderTab tab={activeTab} />
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <InfoCard
            icon={CheckCircle2}
            title="Application readiness"
            text="Complete your profile before submitting rental applications."
          />
          <InfoCard
            icon={ShieldCheck}
            title="Account security"
            text="Password and session controls will be managed here."
          />
          <Card className="border-emerald-100 bg-emerald-50 shadow-none">
            <h2 className="font-semibold text-emerald-950">
              Resident transition
            </h2>
            <p className="mt-3 text-sm leading-6 text-emerald-800">
              When your application is approved and onboarding is complete,
              this same account moves into the CasaX Resident Portal.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function PersonalTab({
  email,
  firstName,
  lastName,
  notice,
  phone,
  onReset,
  onSave,
}: {
  email: string;
  firstName: string;
  lastName: string;
  notice: string | null;
  phone: string;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Personal information
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep your account details clear for inspection booking and CasaX
          application review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" defaultValue={firstName} name="firstName" />
        <Field label="Last name" defaultValue={lastName} name="lastName" />
        <Field
          defaultValue={email || "Email unavailable"}
          label="Email address"
          name="email"
          readonly
        />
        <Field
          defaultValue={phone}
          label="Phone number"
          name="phone"
          placeholder="+234..."
        />
      </div>

      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
        <Button className="rounded-xl" type="submit">
          Save changes
        </Button>
        <Button
          className="rounded-xl"
          onClick={onReset}
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

function PlaceholderTab({ tab }: { tab: Exclude<SettingsTab, "personal"> }) {
  const copy = {
    security: {
      title: "Security settings",
      text: "Password updates, active sessions, and trusted device controls will be managed here.",
    },
    notifications: {
      title: "Notification settings",
      text: "Choose how CasaX should notify you about inspections, applications, and rental updates.",
    },
    preferences: {
      title: "Rental preferences",
      text: "Preferred locations, unit types, and budget alerts will appear here as CasaX expands account tools.",
    },
  }[tab];

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-950">{copy.title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
        {copy.text}
      </p>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  readonly = false,
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder?: string;
  readonly?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
          readonly ? "bg-slate-50 text-slate-500" : "bg-white text-slate-900"
        }`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        readOnly={readonly}
      />
    </label>
  );
}

function InfoCard({
  icon: Icon,
  text,
  title,
}: {
  icon: typeof CheckCircle2;
  text: string;
  title: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-5 font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </Card>
  );
}

function getInitials(name: string, email?: string) {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1 && words[0] !== "CasaX") {
    return words[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? "AX";
}
