import { redirect } from "next/navigation";

export default function NewApplicationRedirectPage() {
  redirect("/applications");
}
