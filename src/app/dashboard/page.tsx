import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | MadsJeez",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  redirect("/dashboard/resumen");
}
