import { useState } from "react";
import { useCreateTransaction } from "../hooks/api";

type ItemOption = { id: string; name: string; quantity: number; unit: string };

export default function TransactionForm({
  items,
  onDone,
}: {
  items: ItemOption[];
  onDone?: () => void;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [type, setType] = useState<"in" | "out">("out");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const createTx = useCreateTransaction();

  if (items.length === 0)
    return <p className="text-xs text-ink/40 mt-2 font-semibold">Tidak ada barang di bin ini.</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createTx.mutateAsync({ itemId, type, quantity, note });
      setNote("");
      setQuantity(1);
      onDone?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      <select
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className="input-retro !py-1.5"
      >
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} ({i.quantity} {i.unit})
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("in")}
          className={`flex-1 !px-2 !py-1.5 !min-h-[36px] ${
            type === "in" ? "btn-teal" : "btn-ghost"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setType("out")}
          className={`flex-1 !px-2 !py-1.5 !min-h-[36px] ${
            type === "out" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Keluar
        </button>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="input-retro !py-1.5 w-20"
        />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan (opsional)"
        className="input-retro !py-1.5"
      />
      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Menyimpan..." : "Simpan Transaksi"}
      </button>
      {error && <p className="badge-retro bg-retro-pink text-white">{error}</p>}
    </form>
  );
}
