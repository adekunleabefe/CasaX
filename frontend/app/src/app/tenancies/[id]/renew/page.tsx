import { redirect } from "next/navigation";

export default async function RenewTenancyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tenancies/${id}`);
}
