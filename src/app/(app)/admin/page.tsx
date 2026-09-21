import { currentUser } from "@clerk/nextjs/server";
import { AdminPortal } from "@/components/admin/admin-portal";
import { isAdminUser } from "@/lib/agent/admin";

export default async function AdminPage() {
  const user = await currentUser();
  return (
    <AdminPortal
      signedIn={Boolean(user)}
      isAdmin={user ? isAdminUser(user.id) : false}
      clerkId={user?.id}
    />
  );
}
