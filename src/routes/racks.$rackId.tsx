import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import RackGrid, { type GridBin } from "../components/RackGrid";
import TransactionForm from "../components/TransactionForm";
import { useRack } from "../hooks/api";

type Item = {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: string;
  category?: { name: string } | null;
};

export function RackDetailPage() {
  const { rackId } = useParams({ from: "/racks/$rackId" });
  const { data: rack, isLoading } = useRack(rackId);
  const [selectedBin, setSelectedBin] = useState<GridBin | null>(null);

  if (isLoading)
    return <p className="text-ink/50 py-12 text-center font-bold">Memuat... ⏳</p>;
  if (!rack)
    return (
      <div className="text-center py-12">
        <p className="badge-retro bg-retro-pink text-white mb-4">Rak tidak ditemukan</p>
        <div>
          <Link to="/racks" className="link-retro">
            ← Kembali ke daftar rak
          </Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/racks" className="link-retro text-sm">
            ← Semua Rak
          </Link>
          <h1 className="text-3xl">{rack.name}</h1>
          <p className="text-sm text-ink/50 font-semibold">
            Grid {rack.rows}×{rack.cols} · {rack.bins.length} bin
          </p>
        </div>
        <Link
          to="/racks/$rackId/edit"
          params={{ rackId: rack.id }}
          className="btn-teal no-underline"
        >
          ✏️ Edit Layout
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 card-retro p-4">
          {rack.bins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink/50 mb-3">Rak ini belum punya bin.</p>
              <Link
                to="/racks/$rackId/edit"
                params={{ rackId: rack.id }}
                className="link-retro text-sm"
              >
                Atur layout sekarang →
              </Link>
            </div>
          ) : (
            <RackGrid
              rack={rack}
              selectedBinId={selectedBin?.id}
              onBinClick={(bin) =>
                setSelectedBin(selectedBin?.id === bin.id ? null : bin)
              }
            />
          )}
        </div>

        <div className="card-retro p-4">
          {!selectedBin ? (
            <p className="text-ink/50 text-sm">
              👆 Klik bin di grid untuk melihat isinya.
            </p>
          ) : (
            <BinPanel bin={selectedBin} onChanged={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
}

function BinPanel({ bin, onChanged }: { bin: GridBin; onChanged: () => void }) {
  const items = (bin.items ?? []) as Item[];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">{bin.label}</h2>
        {bin.color && (
          <span
            className="w-5 h-5 rounded-lg border-2 border-ink shadow-retro-sm"
            style={{ backgroundColor: bin.color }}
          />
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-ink/50 text-sm">Bin kosong.</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {items.map((item) => {
            const low = item.quantity <= item.minStock;
            return (
              <li key={item.id} className="py-2">
                <Link
                  to="/items/$itemId"
                  params={{ itemId: item.id }}
                  className="flex justify-between items-center hover:bg-retro-yellow/20 rounded-lg px-2 transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold">{item.name}</div>
                    {item.category && (
                      <div className="text-xs text-ink/40">{item.category.name}</div>
                    )}
                  </div>
                  <span
                    className={`badge-retro ${low ? "bg-retro-pink text-white" : "bg-paper text-ink"}`}
                  >
                    {item.quantity} {item.unit}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <details className="border-t-2 border-ink/10 pt-3">
        <summary className="text-sm link-retro cursor-pointer font-bold">
          + Transaksi cepat (in/out)
        </summary>
        <TransactionForm items={items} onDone={onChanged} />
      </details>
    </div>
  );
}
