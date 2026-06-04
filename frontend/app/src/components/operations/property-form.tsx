"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { PropertyInput, UnitMixInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { propertySchema } from "@/features/properties/schemas";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function PropertyForm({
  initialValues,
  submitLabel,
  isPending,
  error,
  onSubmit,
}: {
  initialValues?: PropertyInput;
  submitLabel: string;
  isPending: boolean;
  error?: string;
  onSubmit: (values: PropertyInput) => Promise<void>;
}) {
  const isSubmission = !initialValues;
  const [unitMix, setUnitMix] = useState<UnitMixInput[]>(
    initialValues?.unitMix ?? [
      {
        unitType: "Self-contained",
        quantity: 4,
        annualRent: 500000,
        unitNamingPrefix: "Self-contained",
      },
    ],
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof PropertyInput | "unitMix", string>>
  >({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      ...Object.fromEntries(new FormData(event.currentTarget)),
      ...(isSubmission ? { unitMix } : {}),
    };
    const parsed = propertySchema.safeParse(values);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [
            field,
            messages?.[0],
          ]),
        ),
      );
      return;
    }
    if (isSubmission && !parsed.data.unitMix?.length) {
      setFieldErrors({ unitMix: "Add at least one unit mix row." });
      return;
    }
    setFieldErrors({});
    try {
      await onSubmit(parsed.data);
    } catch {
      // Mutation error is surfaced through the query state below the fields.
    }
  }

  const defaults = initialValues ?? {
    name: "",
    address: "",
    city: "",
    state: "Lagos",
    type: "Apartment building",
    status: "active",
  };
  const totalUnits = unitMix.reduce((total, row) => total + Number(row.quantity || 0), 0);
  const annualRentRoll = unitMix.reduce(
    (total, row) => total + Number(row.quantity || 0) * Number(row.annualRent || 0),
    0,
  );

  return (
    <Card className="max-w-3xl">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Property name" error={fieldErrors.name}>
          <input
            className={inputClass}
            defaultValue={defaults.name}
            name="name"
            placeholder="Lekki Heights"
          />
        </Field>
        <Field label="Property type" error={fieldErrors.type}>
          <input
            className={inputClass}
            defaultValue={defaults.type}
            name="type"
            placeholder="Apartment building"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Street address" error={fieldErrors.address}>
            <input
              className={inputClass}
              defaultValue={defaults.address}
              name="address"
              placeholder="14 Admiralty Way"
            />
          </Field>
        </div>
        <Field label="City" error={fieldErrors.city}>
          <input
            className={inputClass}
            defaultValue={defaults.city}
            name="city"
            placeholder="Lekki"
          />
        </Field>
        <Field label="State" error={fieldErrors.state}>
          <input
            className={inputClass}
            defaultValue={defaults.state}
            name="state"
            placeholder="Lagos"
          />
        </Field>
        <Field label="Operational status" error={fieldErrors.status}>
          <select
            className={inputClass}
            defaultValue={defaults.status}
            name="status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        {isSubmission ? (
          <div className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 sm:col-span-2">
            <div>
              <h2 className="font-semibold text-slate-950">
                Unit mix
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add the realistic unit mix for this property. CasaX will
                generate units from the submitted unit mix and review details
                during verification.
              </p>
            </div>

            <div className="space-y-4">
              {unitMix.map((row, index) => (
                <div
                  className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100 sm:grid-cols-4"
                  key={index}
                >
                  <CompactField label="Unit type">
                    <input
                      className={inputClass}
                      onChange={(event) =>
                        updateUnitMix(index, { unitType: event.target.value })
                      }
                      placeholder="Mini-flat"
                      value={row.unitType}
                    />
                  </CompactField>
                  <CompactField label="Quantity">
                    <input
                      className={inputClass}
                      min={1}
                      onChange={(event) =>
                        updateUnitMix(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                      placeholder="6"
                      type="number"
                      value={row.quantity}
                    />
                  </CompactField>
                  <CompactField label="Annual rent">
                    <input
                      className={inputClass}
                      min={0}
                      onChange={(event) =>
                        updateUnitMix(index, {
                          annualRent: Number(event.target.value),
                        })
                      }
                      placeholder="800000"
                      type="number"
                      value={row.annualRent}
                    />
                  </CompactField>
                  <CompactField label="Naming prefix">
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          updateUnitMix(index, {
                            unitNamingPrefix: event.target.value,
                          })
                        }
                        placeholder="Mini-flat"
                        value={row.unitNamingPrefix ?? ""}
                      />
                      {unitMix.length > 1 ? (
                        <Button
                          onClick={() => removeUnitMix(index)}
                          type="button"
                          variant="outline"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </CompactField>
                </div>
              ))}
            </div>

            {fieldErrors.unitMix ? (
              <p className="text-sm font-medium text-orange-700">
                {fieldErrors.unitMix}
              </p>
            ) : null}

            <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center">
              <span>
                Total generated units:{" "}
                <strong className="text-slate-950">{totalUnits}</strong>
              </span>
              <span>
                Annual rent roll:{" "}
                <strong className="text-slate-950">
                  {formatCurrency(annualRentRoll)}
                </strong>
              </span>
              <Button onClick={addUnitMix} type="button" variant="outline">
                Add unit type
              </Button>
            </div>
          </div>
        ) : null}
        <div className="self-end">
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-orange-700 sm:col-span-2">{error}</p>
        ) : null}
      </form>
    </Card>
  );

  function updateUnitMix(index: number, patch: Partial<UnitMixInput>) {
    setUnitMix((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addUnitMix() {
    setUnitMix((rows) => [
      ...rows,
      {
        unitType: "Mini-flat",
        quantity: 1,
        annualRent: 0,
        unitNamingPrefix: "Mini-flat",
      },
    ]);
  }

  function removeUnitMix(index: number) {
    setUnitMix((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span className="mt-2 block text-xs font-medium text-orange-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function CompactField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
      {label}
      {children}
    </label>
  );
}
