import { redirect } from "next/navigation";

// /home is no longer used — everything lives on the root page.
export default function HomePage() {
  redirect("/");
}
