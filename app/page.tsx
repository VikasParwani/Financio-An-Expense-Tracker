import { redirect } from "next/navigation"

export default function Home() {
  // Always redirect to login page from the root
  redirect("/login")
}
