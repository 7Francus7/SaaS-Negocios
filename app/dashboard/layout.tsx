"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
       children,
}: {
       children: React.ReactNode;
}) {
       const pathname = usePathname();
       const isAdminPage = pathname?.startsWith("/dashboard/admin");

       return (
              <div className="min-h-screen bg-gray-50 flex font-[family-name:var(--font-geist-sans)]">
                     <Sidebar />
                     <main className={cn(
                            "flex-1 ml-72 transition-all duration-500",
                            isAdminPage ? "p-0" : "p-8"
                     )}>
                            {children}
                     </main>
              </div>
       );
}
