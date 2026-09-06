# LetakIn Design System — Retrofun

Acuan desain untuk semua tampilan LetakIn. Gaya: **neo-brutalist retro** — playful, warna cerah, border tebal, hard shadow — tapi tetap **UI/UX friendly**.

---

## 1. Prinsip

1. **Fun tapi usable** — estetika tidak boleh mengorbankan kejelasan. Warna status tetap semantik.
2. **Kontras dulu** — semua teks memenuhi rasio kontras WCAG AA (≥ 4.5:1 untuk teks normal).
3. **Target sentuh besar** — minimal 40px tinggi untuk tombol (app dipakai di HP/tablet).
4. **Umpan balik fisik** — setiap elemen interaktif punya state hover, active (efek tekan), dan focus yang jelas.
5. **Konsisten** — pakai token & kelas komponen yang sudah ada. Jangan improvisasi warna/bentuk baru tanpa mengubah dokumen ini.

---

## 2. Palet Warna

| Token | Hex | Class Tailwind | Pemakaian |
|---|---|---|---|
| **Cream** | `#FFF6E5` | `bg-cream` | Background halaman (dengan pola polka dot) |
| **Paper** | `#FFFDF8` | `bg-paper` | Surface kartu, tabel, modal |
| **Ink** | `#3E2F23` | `text-ink`, `border-ink` | Teks utama, border, hard shadow |
| **Retro Orange** | `#FF6B35` | `bg-retro-orange` | Navbar, tombol primer, aksen utama |
| **Retro Teal** | `#2EC4B6` | `bg-retro-teal` | Tombol sekunder, status **masuk/in**, hover |
| **Retro Yellow** | `#FFD23F` | `bg-retro-yellow` | Highlight, header tabel, mode khusus, focus ring |
| **Retro Pink** | `#EF476F` | `bg-retro-pink` | Danger, **stok menipis**, hapus |
| **Retro Sky** | `#4D96FF` | `text-retro-sky` | Link, status **adjust**, info |

### Warna status (semantik — jangan ditukar!)

| Status | Warna | Contoh |
|---|---|---|
| Stok menipis / error / hapus | Pink `#EF476F` | Badge MENIPIS, banner error, tombol Hapus |
| Barang masuk (`in`) | Teal `#2EC4B6` | Badge IN, tombol Masuk |
| Barang keluar (`out`) | Orange `#FF6B35` | Badge OUT, tombol Keluar |
| Penyesuaian (`adjust`) | Sky `#4D96FF` | Badge ADJUST |
| Mode pindah bin / info aktif | Kuning `#FFD23F` | Banner mode pindah |

---

## 3. Tipografi

| Font | Class | Pemakaian |
|---|---|---|
| **Bungee** | `font-display` | Logo, judul halaman (h1–h3), angka besar statistik |
| **Space Grotesk** | `font-body` | Semua teks body, tabel, form, tombol |

**Aturan:**
- `h1`, `h2`, `h3` otomatis pakai Bungee (di-set di base layer `index.css`).
- **Jangan** pakai Bungee untuk teks panjang/paragraf — sulit dibaca.
- Angka besar pada kartu statistik: `font-display` agar berkarakter.

### Skala ukuran

| Elemen | Class |
|---|---|
| Judul halaman (h1) | `text-2xl` (atau `text-3xl` untuk dashboard) |
| Judul section (h2) | `text-lg` |
| Body | `text-sm` – `text-base` |
| Small/meta | `text-xs` |
| Label form | `.label-retro` (uppercase, bold, xs) |

---

## 4. Design Tokens (`tailwind.config.ts`)

```ts
colors: {
  cream: "#FFF6E5", paper: "#FFFDF8", ink: "#3E2F23",
  retro: { orange: "#FF6B35", teal: "#2EC4B6", yellow: "#FFD23F", pink: "#EF476F", sky: "#4D96FF" }
}
boxShadow: {
  "retro-sm": "2px 2px 0 #3E2F23",
  retro: "4px 4px 0 #3E2F23",
  "retro-lg": "6px 6px 0 #3E2F23",
}
fontFamily: { display: ["Bungee", "cursive"], body: ["Space Grotesk", ...] }
```

Shadow **selalu solid tanpa blur** — inilah ciri khas neo-brutalism. Jangan pakai `shadow-md`/`shadow-lg` bawaan Tailwind.

---

## 5. Resep Komponen

Semua kelas ini sudah tersedia di `src/index.css` (`@layer components`). **Pakai apa adanya.**

### Tombol

```html
<button class="btn-primary">Simpan</button>     <!-- oranye, aksi utama -->
<button class="btn-teal">Edit Layout</button>   <!-- teal, aksi sekunder -->
<button class="btn-yellow">Buat & Atur</button> <!-- kuning, aksi highlight -->
<button class="btn-danger">Hapus</button>       <!-- pink, aksi destruktif -->
<button class="btn-ghost">Batal</button>        <!-- netral paper -->
```

Perilaku bawaan: hover → shadow membesar + naik 2px; active → shadow hilang + tombol "tertekan"; disabled → pudar, tanpa efek.

### Kartu

```html
<div class="card-retro p-4">…</div>
```

Dipakai untuk: section dashboard, panel, form container, kartu rak, modal.

### Form

```html
<label>
  <span class="label-retro">Nama Barang</span>
  <input class="input-retro" placeholder="cth: Resistor 10k" />
</label>
```

`input-retro` berlaku juga untuk `<select>` dan `<textarea>`. Focus → ring kuning.

### Badge

```html
<span class="badge-retro bg-retro-teal text-white">IN</span>
<span class="badge-retro bg-retro-orange text-white">OUT</span>
<span class="badge-retro bg-retro-sky text-white">ADJUST</span>
<span class="badge-retro bg-retro-pink text-white">Menipis</span>
```

### Tabel

```html
<div class="card-retro overflow-hidden">
  <table class="table-retro">
    <thead><tr><th>Nama</th>…</tr></thead>
    <tbody><tr><td>…</td></tr></tbody>
  </table>
</div>
```

Header kuning dengan garis bawah tebal; baris zebra krem; hover kuning transparan.

### Link

```html
<a class="link-retro">Lihat detail</a>
```

### Navbar

Oranye (`bg-retro-orange`), border bawah 4px ink, logo Bungee, nav link berbentuk pill dengan hover kuning.

### Toast / notifikasi

Tiket kuning: `bg-retro-yellow border-2 border-ink rounded-xl shadow-retro px-4 py-2 font-bold`.

### Grid rak (sel bin)

- **Bin terisi**: `border-2 border-ink rounded-lg bg-paper shadow-retro-sm`, hover → `-translate-y-0.5 shadow-retro`
- **Bin warna custom**: border & tint dari `bin.color`
- **Bin terpilih**: `ring-4 ring-retro-yellow`
- **Sel kosong (editor)**: `border-2 border-dashed border-ink/30`, hover → kuning
- **Mode pindah**: border teal + `animate-pulse`
- **Indikator stok menipis**: badge bulat pink dengan "!" di pojok kanan atas

---

## 6. Pola Interaksi

| State | Efek |
|---|---|
| Hover tombol/kartu | Shadow membesar (`shadow-retro-lg`), elemen naik `-translate 0.5` |
| Active/press tombol | Shadow hilang, elemen turun `translate 1` — terasa seperti tombol fisik |
| Focus keyboard | Ring kuning tebal `ring-4 ring-retro-yellow` (otomatis via `focus-visible`) |
| Disabled | `opacity-50`, tanpa efek hover/active |

---

## 7. Do & Don't

### ✅ Do
- Selalu pakai token warna (`bg-retro-orange`), bukan hex manual di komponen
- Pakai kelas komponen (`.btn-retro`, `.card-retro`) untuk pola berulang
- Pertahankan warna status semantik (pink = menipis, teal = masuk, dst.)
- Border 2px `border-ink` pada elemen yang "bisa disentuh"
- Emoji dekoratif (📦 ⚠️ ✏️ ✦) boleh — bagian dari karakter retro

### ❌ Don't
- Jangan pakai `shadow`/`shadow-md`/`shadow-lg` bawaan Tailwind (blur shadow merusak gaya)
- Jangan pakai warna Tailwind default (`bg-blue-600`, `text-red-600`) — migrasikan ke token retro
- Jangan pakai Bungee untuk paragraf atau teks kecil
- Jangan buat tombol tanpa state active (press effect wajib ada)
- Jangan kurangi kontras demi estetika (mis. teks kuning di atas cream)

---

## 8. Checklist Aksesibilitas & Mobile

Saat menambah komponen/halaman baru, pastikan:

- [ ] Kontras teks ≥ 4.5:1 (teks `ink` di `cream`/`paper` ≈ 10:1 ✓)
- [ ] Tombol/touch target tinggi ≥ 40px (`min-h-[40px]` sudah ada di `.btn-retro`)
- [ ] Semua interaksi bisa diakses keyboard (focus ring kuning terlihat)
- [ ] Status tidak hanya bergantung pada warna — ada ikon/teks (mis. "!", "MENIPIS")
- [ ] Tabel bisa di-scroll horizontal di layar kecil (bungkus dengan `overflow-x-auto` jika perlu)
- [ ] Uji di viewport ~375px (HP) — layout grid/flex existing sudah responsif
