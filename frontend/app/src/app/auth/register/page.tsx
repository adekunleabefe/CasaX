import { redirect } from "next/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://casax.ng";

export default function RegisterRedirectPage() {
  redirect(`${WEB_URL}/auth/sign-up`);
}
