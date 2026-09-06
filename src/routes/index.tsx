import { Link } from "@tanstack/react-router";
import { useDashboardSummary, useRacks, useTransactions } from "../hooks/api";

export function DashboardPage() {
  const { data: summary } = useDashboardSummary();
  const { data: transactionPage } = useTransactions({ page: 1, pageSize: 8 });
  const { data: racks = [] } = useRacks();
  const lowStock = summary?.lowStockItems ?? [];
  const transactions = transactionPage?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">✦ Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Barang"
          value={summary?.totalItems ?? 0}
          to="/items"
          color="bg-retro-orange"
          icon="📦"
        />
        <StatCard
          label="Stok Menipis"
          value={summary?.lowStockCount ?? 0}
          to="/items?filter=low"
          color="bg-retro-pink"
          icon="⚠️"
          alert={(summary?.lowStockCount ?? 0) > 0}
        />
        <StatCard
          label="Jumlah Rak"
          value={racks.length}
          to="/racks"
          color="bg-retro-teal"
          icon="🗄️"
        />
        <StatCard
          label="Total Unit"
          value={summary?.totalUnits ?? 0}
          color="bg-retro-sky"
          icon="✦"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card-retro p-4">
          <h2 className="text-lg mb-3 text-retro-pink flex items-center gap-2">
            <span className="badge-retro bg-retro-pink text-white">!</span>
            Stok Menipis
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-ink/50 text-sm">Semua stok aman 👍</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {lowStock.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <Link
                    to="/items/$itemId"
                    params={{ itemId: item.id }}
                    className="flex justify-between items-center py-2 hover:bg-retro-yellow/20 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-ink/50">
                        {item.bin
                          ? `${item.bin.rack.name} → ${item.bin.label}`
                          : "Belum ditempatkan"}
                      </div>
                    </div>
                    <span className="badge-retro bg-retro-pink text-white">
                      {item.quantity}/{item.minStock} {item.unit}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-retro p-4">
          <h2 className="text-lg mb-3">🧾 Transaksi Terakhir</h2>
          {transactions.length === 0 ? (
            <p className="text-ink/50 text-sm">Belum ada transaksi</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {transactions.slice(0, 8).map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center py-2 text-sm"
                >
                  <div>
                    <span
                      className={`badge-retro mr-1 ${
                        tx.type === "in"
                          ? "bg-retro-teal text-white"
                          : tx.type === "out"
                            ? "bg-retro-orange text-white"
                            : "bg-retro-sky text-white"
                      }`}
                    >
                      {tx.type.toUpperCase()}
                    </span>{" "}
                    <span className="font-bold">{tx.item.name}</span>
                    {tx.note && (
                      <div className="text-xs text-ink/50">{tx.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base">
                      {tx.type === "out" ? "−" : "+"}
                      {tx.quantity}
                    </div>
                    <div className="text-xs text-ink/40">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  to,
  color,
  icon,
  alert,
}: {
  label: string;
  value: number;
  to?: string;
  color: string;
  icon: string;
  alert?: boolean;
}) {
  const cls = `${color} border-2 border-ink rounded-xl shadow-retro p-4 block text-white
    transition-all duration-100 min-h-[96px]
    ${alert ? "animate-pulse" : ""}`;
  const inner = (
    <>
      <div className="text-xs font-bold uppercase tracking-wide text-white/85 flex items-center gap-1">
        <span>{icon}</span> {label}
      </div>
      <div className="font-display text-4xl mt-1 drop-shadow-[2px_2px_0_#3E2F23]">
        {value}
      </div>
    </>
  );
  if (!to) return <div className={cls}>{inner}</div>;
  return (
    <a
      href={to}
      className={`${cls} hover:shadow-retro-lg hover:-translate-x-0.5 hover:-translate-y-0.5
        active:shadow-none active:translate-x-1 active:translate-y-1`}
    >
      {inner}
    </a>
  );
}
