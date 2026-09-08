import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/racks", label: "Rak", icon: "🗄️" },
  { to: "/items", label: "Barang", icon: "📦" },
  { to: "/transactions", label: "Riwayat", icon: "🧾" },
  { to: "/settings", label: "Pengaturan", icon: "⚙️" },
] as const;

export function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup menu setiap kali navigasi terjadi
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-retro-orange border-b-4 border-ink sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 h-16">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl text-white tracking-wide drop-shadow-[2px_2px_0_#3E2F23] hover:-translate-y-0.5 transition-transform"
          >
            📦 LetakIn
          </Link>

          {/* Nav horizontal — hanya desktop */}
          <div className="hidden sm:flex items-center gap-3">
            {NAV.map((item) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link
                key={item.to}
                to={item.to as any}
                className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-all min-h-[40px] inline-flex items-center gap-1.5 ${
                  isActive(item.to)
                    ? "bg-retro-yellow text-ink border-ink shadow-retro-sm"
                    : "border-transparent text-white hover:bg-white/20"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Tombol hamburger — hanya mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            className={`sm:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border-2 border-ink font-bold text-lg transition-all duration-100 ${
              menuOpen
                ? "bg-retro-pink text-white shadow-none translate-x-0.5 translate-y-0.5"
                : "bg-retro-yellow text-ink shadow-retro-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
            }`}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Dropdown menu — hanya mobile */}
        {menuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 px-4 pt-2 pb-4">
            <div className="card-retro p-2 space-y-1 max-w-7xl mx-auto">
              {NAV.map((item) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link
                  key={item.to}
                  to={item.to as any}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 font-bold text-base transition-all min-h-[44px] ${
                    isActive(item.to)
                      ? "bg-retro-yellow text-ink border-ink shadow-retro-sm"
                      : "border-transparent text-ink hover:bg-retro-yellow/30"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="border-t-4 border-ink bg-paper mt-8">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-center gap-2 text-sm font-bold flex-wrap text-center">
          <span>📦 LetakIN — dibuat oleh</span>
          <a
            href="https://github.com/TahuTech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-retro-yellow text-ink border-2 border-ink rounded-lg px-3 py-1.5 shadow-retro-sm min-h-[40px]
              hover:shadow-retro hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5 transition-all"
          >
            🐙 TahuTech
          </a>
        </div>
      </footer>
    </div>
  );
}
