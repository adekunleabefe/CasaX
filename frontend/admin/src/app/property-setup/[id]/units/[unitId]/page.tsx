"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Star, Trash2, Upload } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  deleteAdminUnitImage,
  getAdminUnit,
  markAdminUnitReady,
  prepareAdminVacancy,
  updateAdminUnitImage,
  updateAdminUnit,
  uploadAdminUnitImage,
  type AdminUnitImage,
  type AdminUnit,
} from "@/services/operations";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function AdminUnitSetupPage() {
  const params = useParams<{ id: string; unitId: string }>();
  const unit = useQuery({
    queryKey: ["admin", "unit", params.unitId],
    queryFn: () => getAdminUnit(params.unitId),
  });

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Unit Setup"
        title={unit.data?.name ?? "Unit setup"}
        description="Complete unit readiness before vacancy publishing."
        backHref={`/property-setup/${params.id}`}
      />
      {unit.isLoading ? <LoadingCards /> : null}
      {unit.isError ? (
        <ErrorState
          title="Unable to load unit setup"
          onRetry={() => void unit.refetch()}
        />
      ) : null}
      {unit.data ? (
        <UnitSetupWorkspace propertyId={params.id} unit={unit.data} />
      ) : null}
    </main>
  );
}

function UnitSetupWorkspace({
  propertyId,
  unit,
}: {
  propertyId: string;
  unit: AdminUnit & {
    property: {
      id: string;
      name: string;
      city: string;
      state: string;
      listingStatus: string;
      verificationStatus: string;
    };
  };
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("cover");
  const queryClient = useQueryClient();
  const router = useRouter();
  const update = useMutation({
    mutationFn: (input: Parameters<typeof updateAdminUnit>[1]) =>
      updateAdminUnit(unit.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unit.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "vacancies", "ready-units"],
      });
    },
  });
  const markReady = useMutation({
    mutationFn: () => markAdminUnitReady(unit.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unit.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "vacancies", "ready-units"],
      });
    },
  });
  const prepareVacancy = useMutation({
    mutationFn: () =>
      prepareAdminVacancy(unit.id, {
        title: unit.listingTitle ?? `${unit.name} at ${unit.property.name}`,
        description:
          unit.publicDescription ??
          "CasaX-verified vacancy managed through CasaX operations.",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unit.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "vacancies"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      router.push("/vacancy-publishing?tab=drafts");
    },
  });
  const uploadImage = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Select a unit photo first");
      return uploadAdminUnitImage(unit.id, {
        file: selectedFile,
        caption,
        category,
        isCover: (unit.images?.length ?? 0) === 0 || category === "cover",
      });
    },
    onSuccess: async () => {
      setSelectedFile(null);
      setCaption("");
      setCategory("cover");
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unit.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
    },
  });
  const ready = canMarkReady(unit);
  const listingStatus = unit.vacancyListings?.[0]?.status ?? "Not listed";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      name: String(form.get("name") ?? unit.name),
      unitType: String(form.get("unitType") ?? unit.unitType),
      bedroomCount: Number(form.get("bedroomCount") ?? unit.bedroomCount),
      bathroomCount: Number(form.get("bathroomCount") ?? unit.bathroomCount),
      rentAmount: Number(form.get("rentAmount") ?? unit.rentAmount),
      serviceCharge: Number(form.get("serviceCharge") ?? unit.serviceCharge ?? 0),
      depositAmount: Number(form.get("depositAmount") ?? unit.depositAmount ?? 0),
      availabilityDate: String(form.get("availabilityDate") ?? "") || undefined,
      listingTitle: String(form.get("listingTitle") ?? ""),
      publicDescription: String(form.get("publicDescription") ?? ""),
      amenities: textToList(String(form.get("amenities") ?? "")),
      inspectionNotes: String(form.get("inspectionNotes") ?? ""),
      status: String(form.get("status") ?? unitStatusInput(unit.status)) as
        | "vacant"
        | "occupied"
        | "pending_approval"
        | "maintenance"
        | "inactive",
      readinessStatus: String(
        form.get("readinessStatus") ?? unit.readinessStatus,
      ) as "INCOMPLETE" | "READY",
    });
  }

  return (
    <form className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={submit}>
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <SectionTitle
            description="Rent belongs to the unit and is inherited by resident tenancies."
            title="Basic unit info"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Unit number" name="name" defaultValue={unit.name} />
            <Field label="Unit type" name="unitType" defaultValue={unit.unitType} />
            <Field
              label="Bedrooms"
              name="bedroomCount"
              type="number"
              defaultValue={unit.bedroomCount}
            />
            <Field
              label="Bathrooms"
              name="bathroomCount"
              type="number"
              defaultValue={unit.bathroomCount}
            />
            <Field
              label="Annual rent"
              name="rentAmount"
              type="number"
              defaultValue={Number(unit.rentAmount)}
            />
            <Field
              label="Service charge"
              name="serviceCharge"
              type="number"
              defaultValue={Number(unit.serviceCharge ?? 0)}
            />
            <Field
              label="Deposit amount"
              name="depositAmount"
              type="number"
              defaultValue={Number(unit.depositAmount ?? 0)}
            />
            <Field
              label="Availability date"
              name="availabilityDate"
              type="date"
              defaultValue={dateInputValue(unit.availabilityDate)}
            />
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <SectionTitle
            description="These fields power the public rental listing after readiness is approved."
            title="Listing setup"
          />
          <div className="mt-5 grid gap-4">
            <Field
              label="Listing title"
              name="listingTitle"
              defaultValue={unit.listingTitle ?? ""}
            />
            <TextArea
              label="Public description"
              name="publicDescription"
              defaultValue={unit.publicDescription ?? ""}
            />
            <TextArea
              label="Amenities"
              name="amenities"
              placeholder="One amenity per line"
              defaultValue={listToText(unit.amenities)}
            />
            <TextArea
              label="Inspection notes"
              name="inspectionNotes"
              defaultValue={unit.inspectionNotes ?? ""}
            />
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <SectionTitle
            description="Upload real unit photos for public vacancy publishing."
            title="Media"
          />
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr_.8fr_auto] md:items-end">
              <label className="text-sm font-medium text-slate-700">
                Upload photo
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className={inputClass}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </label>
              <Field
                label="Caption"
                name="imageCaption"
                placeholder="Living area"
                value={caption}
                onChange={setCaption}
              />
              <label className="text-sm font-medium text-slate-700">
                Category
                <select
                  className={inputClass}
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="cover">Cover photo</option>
                  <option value="living_area">Room / living area</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="exterior">Exterior / building</option>
                  <option value="extra">Extra / detail</option>
                </select>
              </label>
              <Button
                disabled={!selectedFile || uploadImage.isPending}
                onClick={() => uploadImage.mutate()}
                type="button"
              >
                <Upload className="mr-2 size-4" />
                {uploadImage.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {uploadImage.isError ? (
              <p className="mt-3 text-sm text-red-600">
                {uploadImage.error instanceof Error
                  ? uploadImage.error.message
                  : "Unable to upload photo"}
              </p>
            ) : null}
          </div>
          <PhotoGrid images={unit.images ?? []} unitId={unit.id} />
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            At least 5 uploaded photos and one cover photo are required before
            this unit can be marked ready for vacancy publishing.
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <SectionTitle title="Status" />
          <div className="mt-5 space-y-4">
            <SelectField
              label="Unit status"
              name="status"
              defaultValue={unitStatusInput(unit.status)}
              options={[
                ["vacant", "Vacant"],
                ["occupied", "Occupied"],
                ["pending_approval", "Pending review"],
                ["maintenance", "Maintenance"],
                ["inactive", "Inactive"],
              ]}
            />
            <SelectField
              label="Readiness status"
              name="readinessStatus"
              defaultValue={unit.readinessStatus}
              options={[
                ["INCOMPLETE", "Incomplete"],
                ["READY", "Ready"],
              ]}
            />
            <SummaryLine label="Listing status" value={listingStatus.replaceAll("_", " ")} />
            <SummaryLine
              label="Annual rent"
              value={formatCurrency(Number(unit.rentAmount))}
            />
            <SummaryLine
              label="Property"
              value={`${unit.property.name}, ${unit.property.city}`}
            />
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <SectionTitle title="Readiness rule" />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {readinessChecks(unit).map((check) => (
              <div className="flex items-center gap-2" key={check.label}>
                {check.ok ? (
                  <CheckCircle2 className="size-4 text-emerald-700" />
                ) : (
                  <AlertCircle className="size-4 text-amber-600" />
                )}
                <span>{check.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Button className="w-full" disabled={update.isPending} type="submit">
            {update.isPending ? "Saving..." : "Save unit"}
          </Button>
          <Button
            className="w-full"
            disabled={!ready || markReady.isPending || unit.readinessStatus === "READY"}
            onClick={() => markReady.mutate()}
            type="button"
            variant="outline"
          >
            {markReady.isPending ? "Marking..." : "Mark ready for vacancy"}
          </Button>
          <Button
            className="w-full"
            disabled={
              unit.readinessStatus !== "READY" ||
              unit.status !== "VACANT" ||
              prepareVacancy.isPending
            }
            onClick={() => prepareVacancy.mutate()}
            type="button"
            variant="outline"
          >
            {prepareVacancy.isPending ? "Preparing..." : "Prepare vacancy"}
          </Button>
          {prepareVacancy.isError ? (
            <p className="text-xs leading-5 text-amber-700">
              Vacancy draft may already exist for this unit. Check Vacancy
              Publishing drafts.
            </p>
          ) : null}
          <Button asChild className="w-full" variant="ghost">
            <Link href={`/property-setup/${propertyId}`}>Back to property</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        defaultValue={defaultValue}
        name={name}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function PhotoGrid({
  images,
  unitId,
}: {
  images: AdminUnitImage[];
  unitId: string;
}) {
  const queryClient = useQueryClient();
  const setCover = useMutation({
    mutationFn: (imageId: string) => updateAdminUnitImage(imageId, { isCover: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unitId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
    },
  });
  const remove = useMutation({
    mutationFn: (imageId: string) => deleteAdminUnitImage(imageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "unit", unitId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
    },
  });

  if (images.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No unit photos uploaded yet.
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image) => (
        <div
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          key={image.id}
        >
          <div className="relative aspect-[4/3] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={image.caption ?? "Unit photo"}
              className="h-full w-full object-cover"
              src={absoluteImageUrl(image.imageUrl)}
            />
            {image.isCover ? (
              <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                Cover
              </span>
            ) : null}
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="font-semibold text-slate-900">
                {image.caption || "Unit photo"}
              </p>
              <p className="mt-1 text-xs capitalize text-slate-500">
                {(image.category ?? "extra").replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="px-3 py-2 text-xs"
                disabled={image.isCover || setCover.isPending}
                onClick={() => setCover.mutate(image.id)}
                type="button"
                variant="outline"
              >
                <Star className="mr-1 size-3.5" />
                Set cover
              </Button>
              <Button
                className="px-3 py-2 text-xs text-red-600"
                disabled={remove.isPending}
                onClick={() => remove.mutate(image.id)}
                type="button"
                variant="ghost"
              >
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select className={inputClass} defaultValue={defaultValue} name={name}>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold capitalize text-slate-900">{value}</span>
    </div>
  );
}

function readinessChecks(unit: AdminUnit) {
  const images = unit.images ?? [];
  return [
    { label: "Unit number exists", ok: Boolean(unit.name.trim()) },
    { label: "Unit type exists", ok: Boolean(unit.unitType.trim()) },
    { label: "Annual rent exists", ok: Number(unit.rentAmount) > 0 },
    { label: "Listing title exists", ok: Boolean(unit.listingTitle?.trim()) },
    {
      label: "Public description exists",
      ok: Boolean(unit.publicDescription?.trim()),
    },
    { label: "Occupancy status is vacant", ok: unit.status === "VACANT" },
    { label: "At least 5 photos uploaded", ok: images.length >= 5 },
    { label: "Cover photo selected", ok: images.some((image) => image.isCover) },
  ];
}

function canMarkReady(unit: AdminUnit) {
  return readinessChecks(unit).every((check) => check.ok);
}

function textToList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value?: string[] | null) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function absoluteImageUrl(value: string) {
  if (value.startsWith("http")) return value;
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.casax.ng/api/v1";
  return `${apiUrl.replace(/\/api\/v1\/?$/, "")}${value}`;
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function unitStatusInput(status: AdminUnit["status"]) {
  const map = {
    VACANT: "vacant",
    OCCUPIED: "occupied",
    PENDING_APPROVAL: "pending_approval",
    MAINTENANCE: "maintenance",
    INACTIVE: "inactive",
  } as const;
  return map[status];
}
