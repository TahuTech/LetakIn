import { useState } from "react";
import { useCreateCategory, type Category } from "../hooks/api";

/**
 * Select kategori dengan tombol "＋" untuk menambah kategori baru secara inline.
 * Drop-in replacement untuk <select> kategori biasa.
 */
export default function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (id: string) => void;
  categories: Category[];
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const createCategory = useCreateCategory();

  async function handleAdd(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError("");
    try {
      const created = await createCategory.mutateAsync(name);
      onChange(created.id); // otomatis pilih kategori baru
      setAdding(false);
      setNewName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambah kategori");
    }
  }

  if (adding) {
    return (
      <div className="space-y-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd(e);
            if (e.key === "Escape") {
              setAdding(false);
              setNewName("");
              setError("");
            }
          }}
          autoFocus
          placeholder="Ketik nama kategori baru..."
          className="input-retro"
          disabled={createCategory.isPending}
        />
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={handleAdd}
            disabled={createCategory.isPending || !newName.trim()}
            className="btn-teal !min-h-[36px] !py-1"
          >
            {createCategory.isPending ? "Menyimpan..." : "Tambah"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewName("");
              setError("");
            }}
            className="btn-ghost !min-h-[36px] !py-1"
          >
            Batal
          </button>
          {error && (
            <span className="badge-retro bg-retro-pink text-white">{error}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-retro flex-1"
      >
        <option value="">— Tanpa kategori —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title="Tambah kategori baru"
        aria-label="Tambah kategori baru"
        className="btn-yellow !px-3 shrink-0"
      >
        ＋
      </button>
    </div>
  );
}
