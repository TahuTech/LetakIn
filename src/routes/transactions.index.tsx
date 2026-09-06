import { Link } from "@tanstack/react-router";
import { useTransactions } from "../hooks/api";

export function TransactionsPage() {
  const { data: transactions = [] } = useTransactions();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl">🧾 Riwayat Transaksi</h1>

      <div className="card-retro overflow-hidden overflow-x-auto">
        <table className="table-retro">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Tipe</th>
              <th>Barang</th>
              <th>Lokasi</th>
              <th className="!text-right">Jumlah</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="!py-8 text-center text-ink/40 font-semibold">
                  Belum ada transaksi. 🤷
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-ink/50 whitespace-nowrap font-semibold">
                    {new Date(tx.createdAt).toLocaleString("id-ID", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <span
                      className={`badge-retro ${
                        tx.type === "in"
                          ? "bg-retro-teal text-white"
                          : tx.type === "out"
                            ? "bg-retro-orange text-white"
                            : "bg-retro-sky text-white"
                      }`}
                    >
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: tx.item.id }}
                      className="link-retro"
                    >
                      {tx.item.name}
                    </Link>
                  </td>
                  <td className="text-ink/60 font-semibold">
                    {tx.item.bin
                      ? `${tx.item.bin.rack.name} → ${tx.item.bin.label}`
                      : "-"}
                  </td>
                  <td className="text-right font-display">
                    {tx.type === "out" ? "−" : "+"}
                    {tx.quantity}
                  </td>
                  <td className="text-ink/50">{tx.note ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
