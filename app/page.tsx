import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("auth")

  if (isLoggedIn) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}

