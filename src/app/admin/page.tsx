import AdminApp from "@/components/admin/AdminApp";
import { adminEnabled, isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminApp enabled={adminEnabled()} signedIn={await isAdmin()} />;
}
