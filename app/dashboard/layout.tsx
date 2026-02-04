import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
       children,
}: {
       children: React.ReactNode;
}) {
       return (
              <div className="min-h-screen bg-gray-50 flex font-[family-name:var(--font-geist-sans)]">
                     <Sidebar />
                     <main className="flex-1 ml-64 p-8">
                            {children}
                     </main>
              </div>
       );
}
