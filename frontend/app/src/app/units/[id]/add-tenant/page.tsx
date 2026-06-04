import { redirect } from "next/navigation";

export default async function AddTenantRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/units/${id}`);
}
