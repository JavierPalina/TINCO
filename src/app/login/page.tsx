import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AuthComponent from "./AuthComponent";
import { authOptions } from "@/lib/authOptions";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard/pipeline");
  }

  return <AuthComponent />;
}
