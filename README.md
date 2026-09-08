# LetakIn

[English](./README.en.md) | **Bahasa Indonesia**

Aplikasi inventory untuk rak kerja — tracking barang, lokasi bin, dan stok menipis dengan visual grid rak yang bisa dikustomisasi.

## Menjalankan

```bash
npm install
npm run db:push   # setup database SQLite
npm run db:seed   # isi data contoh (opsional)
npm run dev       # jalankan frontend (5173) + backend API (3001) sekaligus
```

Buka `http://localhost:5173` di browser.

Akses dari HP/tablet di jaringan yang sama: `npm run dev:client -- --host` lalu buka `http://<ip-komputer>:5173`.

## Arsitektur

- **Frontend**: Vite + React + TanStack Router + TanStack Query (`src/`)
- **Backend API**: Express + Prisma + SQLite (`server/`, port 3001)
- **Database**: SQLite via Prisma (`prisma/dev.db`)

## Fitur

- **Dashboard** — ringkasan total barang, daftar stok menipis, transaksi terakhir
- **Visual Rak** — grid interaktif yang mencerminkan susunan fisik rak:
  - Setiap rak punya ukuran grid sendiri (baris × kolom)
  - Bin bisa span multi-sel (bin besar/kecil campur dalam satu rak)
  - Mode Edit: klik sel kosong untuk tambah bin, klik bin untuk edit/pindah/hapus, warna custom
- **Barang** — daftar lengkap dengan search, filter kategori, filter stok menipis, pagination
- **Tambah Banyak** — input multi-baris untuk menambah banyak barang sekaligus
- **Kategori** — tambah kategori baru langsung dari dropdown form barang
- **Transaksi** — catat barang masuk/keluar dengan catatan; stok ter-update otomatis
- **Stok menipis** — otomatis ditandai merah saat `quantity <= minStock`
- **Pengaturan** (`/settings`) — ekspor backup JSON (semua data) & CSV barang, impor backup (ganti semua data)

## Struktur

```
src/
  main.tsx              Entry point (QueryClient + RouterProvider)
  router.tsx            Route tree TanStack Router
  index.css             Tailwind CSS
  lib/
    api.ts              Fetch helpers ke /api/*
    utils.ts            isLowStock, dll
  hooks/
    api.ts              TanStack Query hooks (useRacks, useItems, useTransactions, dll)
  components/
    RackGrid.tsx        Renderer grid (mode lihat + mini preview)
    RackGridEditor.tsx  Editor grid interaktif (mode edit)
    BinEditDialog.tsx   Dialog tambah/edit bin
    ItemForm.tsx        Form tambah barang
    TransactionForm.tsx Form transaksi cepat
  routes/
    __root.tsx          Layout root (navbar)
    index.tsx           Dashboard
    racks.index.tsx     Daftar rak
    racks.$rackId.tsx   Detail rak
    racks.$rackId.edit.tsx  Editor layout rak
    items.index.tsx     Daftar barang
    items.$itemId.tsx   Detail barang
    transactions.index.tsx  Riwayat transaksi
server/
  index.ts              Express app entry
  db.ts                 Prisma client singleton
  routes/
    racks.ts            CRUD /api/racks
    bins.ts             CRUD /api/bins
    items.ts            CRUD /api/items
    transactions.ts     CRUD /api/transactions
    categories.ts       CRUD /api/categories
prisma/
  schema.prisma         Model data
  seed.mjs              Data contoh
```

## Reset Database

```bash
rm prisma/dev.db && npm run db:push && npm run db:seed
```
