import { redirect } from "next/navigation";

export default async function AccountApplicationDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/applicant/applications/${id}`);
}
