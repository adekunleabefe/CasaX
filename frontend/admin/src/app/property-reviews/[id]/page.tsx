import { redirect } from "next/navigation";

export default async function AdminPropertyReviewDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/property-setup/${id}`);
}
