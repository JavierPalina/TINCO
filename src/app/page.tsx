import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard/pipeline');
  } else {
    redirect('/login');
  }
  return null;
}