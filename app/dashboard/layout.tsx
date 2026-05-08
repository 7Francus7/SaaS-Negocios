import { checkHasOpenSession } from "@/app/actions/cash";
import { getDashboardShellInfo } from "@/app/actions/dashboard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
       children,
}: {
       children: React.ReactNode;
}) {
       const shellInfo = await getDashboardShellInfo();
       const initialHasOpenCash =
              shellInfo.userRole === "SUPERADMIN" ? true : await checkHasOpenSession();

       return (
              <DashboardShell
                     initialHasOpenCash={initialHasOpenCash}
                     initialStoreName={shellInfo.storeName}
                     initialUserRole={shellInfo.userRole}
              >
                     {children}
              </DashboardShell>
       );
}
