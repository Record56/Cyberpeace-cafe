import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/scanner");

  return (
    <div className="min-h-screen">
      <AdminNav userName={session.name} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
