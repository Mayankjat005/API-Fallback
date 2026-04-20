import { redirect } from "next/navigation";

export default function Home() {
  // Redirecting the root domain to the main site as requested
  redirect("https://www.tmovie.in");
}
