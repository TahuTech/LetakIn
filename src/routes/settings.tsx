import { useRef, useState } from "react";
import { useExportJson, useExportCsv, useImportData } from "../hooks/api";

type ParsedBackup = {
  version: number;
  racks: unknown[];
  bins: unknown[];
  categories: unknown[];
  items: unknown[];
  transactions: unknown[];
};

export function SettingsPage() {
  const exportJson = useExportJson();
  const exportCsv = useExportCsv();
  const importData = useImportData();

  const fileRef = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<ParsedBackup | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    setBackup(null);
    setDoneMsg("");
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = JSON.parse(await file.text());
      if (
        parsed.version !== 1 ||
        !Array.isArray(parsed.racks) ||
        !Array.isArray(parsed.items)
      ) {
        throw new Error("Bukan file backup LetakIN yang valid");
      }
      setBackup(parsed);
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : "File tidak bisa dibaca"
      );
      setFileName("");
    }
  }

  async function handleImport() {
    if (!backup) return;
    const yakin = confirm(
      "⚠️ SEMUA data saat ini akan DIGANTI dengan isi backup.\n\nLanjutkan?"
    );
    if (!yakin) return;
    setDoneMsg("");
    try {
      const res = await importData.mutateAsync(backup);
      setDoneMsg(
        `✓ Data dipulihkan: ${res.restored.racks} rak, ${res.restored.bins} bin, ${res.restored.categories} kategori, ${res.restored.items} barang, ${res.restored.transactions} transaksi`
      );
      setBackup(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Import gagal");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-3xl">⚙️ Pengaturan</h1>

      {/* ===== Ekspor ===== */}
      <section className="card-retro p-4 space-y-3">
        <h2 className="text-lg">📤 Ekspor Data</h2>
        <p className="text-sm text-ink/60 font-semibold">
          Unduh data untuk backup atau dibuka di spreadsheet.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportJson.mutate()}
            disabled={exportJson.isPending}
            className="btn-primary"
          >
            {exportJson.isPending ? "Mengunduh..." : "💾 Backup JSON (semua data)"}
          </button>
          <button
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
            className="btn-teal"
          >
            {exportCsv.isPending ? "Mengunduh..." : "📊 Barang CSV (Excel)"}
          </button>
        </div>
        {(exportJson.isError || exportCsv.isError) && (
          <p className="badge-retro bg-retro-pink text-white">
            Gagal mengunduh — coba lagi
          </p>
        )}
      </section>

      {/* ===== Impor ===== */}
      <section className="card-retro p-4 space-y-3">
        <h2 className="text-lg">📥 Impor Data</h2>
        <p className="text-sm text-ink/60 font-semibold">
          Pulihkan dari file backup JSON LetakIN.{" "}
          <span className="text-retro-pink">
            Semua data saat ini akan DIGANTI.
          </span>{" "}
          Disarankan ekspor dulu sebelum impor.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="input-retro file:mr-3 file:border-2 file:border-ink file:rounded-lg
            file:bg-retro-yellow file:px-3 file:py-1 file:font-bold file:cursor-pointer"
        />

        {fileError && (
          <p className="badge-retro bg-retro-pink text-white">⚠️ {fileError}</p>
        )}

        {backup && (
          <div className="border-2 border-ink rounded-xl bg-cream p-3 space-y-2">
            <p className="text-sm font-bold">📄 {fileName}</p>
            <ul className="text-xs text-ink/70 font-semibold grid grid-cols-2 sm:grid-cols-5 gap-1">
              <li>🗄️ {backup.racks.length} rak</li>
              <li>🗃️ {backup.bins.length} bin</li>
              <li>🏷️ {backup.categories.length} kategori</li>
              <li>📦 {backup.items.length} barang</li>
              <li>🧾 {backup.transactions.length} transaksi</li>
            </ul>
            <button
              onClick={handleImport}
              disabled={importData.isPending}
              className="btn-danger"
            >
              {importData.isPending
                ? "Mengimpor..."
                : "⚠️ Impor & Ganti Semua Data"}
            </button>
          </div>
        )}

        {doneMsg && (
          <p className="badge-retro bg-retro-teal text-white">{doneMsg}</p>
        )}
      </section>

      {/* ===== Tentang ===== */}
      <section className="card-retro p-4">
        <h2 className="text-lg mb-1">ℹ️ Tentang</h2>
        <p className="text-sm text-ink/60 font-semibold">
          📦 LetakIN v1.0 — aplikasi inventory rak kerja. Dibuat oleh{" "}
          <a
            href="https://github.com/TahuTech"
            target="_blank"
            rel="noopener noreferrer"
            className="link-retro"
          >
            TahuTech
          </a>
          .
        </p>
      </section>
    </div>
  );
}
