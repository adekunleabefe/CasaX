"use client";

import { Bell, LockKeyhole, UserRound } from "lucide-react";
import { Card } from "@casax/ui";
import { useCurrentUser } from "@/features/auth/queries";

export default function SettingsPage() {
  const currentUser = useCurrentUser();
  const profile = currentUser.data?.profile;
  const name = profile
    ? `${profile.firstName} ${profile.lastName}`
    : currentUser.data?.email;
  const role = currentUser.data?.role ?? "workspace";

  return (
    <main className="mx-auto max-w-5xl p-5 lg:p-8">
      <header>
        <p className="text-sm font-medium text-emerald-700">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Account preferences
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your CasaX identity, notifications and account security.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">Profile</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                {name ?? "CasaX user"}
              </h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                {role} workspace
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <LockKeyhole className="size-5 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Security</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Password and session controls will be managed here.
          </p>
        </Card>

        <Card className="md:col-span-3">
          <Bell className="size-5 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Notifications</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            This space is ready for future email, push notification and resident
            communication preferences.
          </p>
        </Card>
      </section>
    </main>
  );
}
