import { Settings } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";

export default function AdminSettingsPage() {
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Settings"
        description="Internal console preferences and platform controls will appear here."
      />
      <Card className="mt-8 py-14 text-center">
        <Settings className="mx-auto size-8 text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-950">
          Admin settings are being prepared.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Console configuration will be added when the next settings slice is
          ready.
        </p>
      </Card>
    </main>
  );
}
