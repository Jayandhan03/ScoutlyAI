import { redirect } from "next/navigation";

// The former "/home" hub has been consolidated into the intelligence dashboard.
export default function HomeRedirect() {
  redirect("/dashboard");
}
