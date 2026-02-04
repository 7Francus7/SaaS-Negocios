import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
          Despensa SaaS
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          La evolución de tu sistema de gestión. Ahora en la nube, multi-tienda y accesible desde cualquier lugar.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-base sm:text-lg h-12 px-8 font-medium"
          >
            Ir al Dashboard (Demo)
          </Link>
          <a
            href="#"
            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-white text-gray-900 hover:bg-gray-100 text-base sm:text-lg h-12 px-8"
          >
            Documentación
          </a>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500">
        Migración en proceso - Next.js + Prisma + PostgreSQL
      </footer>
    </div>
  );
}
