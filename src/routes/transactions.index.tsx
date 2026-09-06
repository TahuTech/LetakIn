import { Link } from "@tanstack/react-router";
import { useTransactions } from "../hooks/api";
import { useState } from "react";

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"in" | "out" | "adjust" | "">("");
  const { data: transactionPage } = useTransactions({ page, type: type || undefined });
  const transactions = transactionPage?.items ?? [];
  const totalPages = transactionPage?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl">🧾 Riwayat Transaksi</h1>

      <div className="card-retro p-4">
        <label className="flex items-center gap-3 font-bold">
          Tipe
          <select
            value={type}
            onChange={(event) => {
              const selectedType = event.target.value;
              setType(
                selectedType === "in" || selectedType === "out" || selectedType === "adjust"
                  ? selectedType
                  : ""
              );
              setPage(1);
            }}
            className="input-retro w-auto"
          >
            <option value="">Semua transaksi</option>
            <option value="in">IN</option>
            <option value="out">OUT</option>
            <option value="adjust">ADJUST</option>
          </select>
        </label>
      </div>

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
      <p className="text-xs text-ink/40 font-semibold">
        Menampilkan {transactions.length} dari {transactionPage?.total ?? 0} transaksi
      </p>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Sebelumnya
          </button>
          <span className="text-sm font-bold">
            Halaman {page} dari {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
