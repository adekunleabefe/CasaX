import { redirect } from "next/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://casax.ng";

export default function ApplicantApplicationsRedirectPage() {
  redirect(`${WEB_URL}/applicant/applications`);
}
