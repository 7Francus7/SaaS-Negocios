import { checkHasOpenSession } from "@/app/actions/cash";
import { getDashboardShellInfo } from "@/app/actions/dashboard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
       children,
}: {
       children: React.ReactNode;
}) {
       // Sin una sesión válida, enviar al login en vez de dejar que la
       // resolución de tienda lance una excepción y rompa el render del servidor.
       const user = await getCurrentUser();
       if (!user) {
              redirect("/");
       }

       let shellInfo: Awaited<ReturnType<typeof getDashboardShellInfo>>;
       try {
              shellInfo = await getDashboardShellInfo();
       } catch {
              redirect("/");
       }

       // Una falla transitoria en la verificación de caja no debe tirar abajo
       // todo el dashboard: por defecto no bloqueamos la operación.
       let initialHasOpenCash = true;
       if (shellInfo.userRole !== "SUPERADMIN") {
              try {
                     initialHasOpenCash = await checkHasOpenSession();
              } catch {
                     initialHasOpenCash = true;
              }
       }

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
