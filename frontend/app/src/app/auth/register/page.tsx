import { redirect } from "next/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function RegisterRedirectPage() {
  redirect(`${WEB_URL}/auth/sign-up`);
}
