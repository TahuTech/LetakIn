# LetakIn

**English** | [Bahasa Indonesia](./README.md)

An inventory application for workspace shelves that tracks items, bin locations, and low stock using a customizable shelf grid.

## Running the application

```bash
npm install
npm run db:push   # set up the SQLite database
npm run db:seed   # load sample data (optional)
npm run dev       # start the frontend (5173) and backend API (3001)
```

Open `http://localhost:5173` in a browser.

To access it from a phone or tablet on the same network, find the computer's IP address (`hostname -I` or `ip addr`), then open `http://<computer-ip>:5173` from another device connected to the same Wi-Fi.

## Architecture

- **Frontend**: Vite, React, TanStack Router, and TanStack Query (`src/`)
- **Backend API**: Express and Prisma with SQLite (`server/`, port 3001)
- **Database**: SQLite through Prisma (`prisma/dev.db`)

## Features

- **Dashboard**: total-item summary, low-stock list, and recent transactions.
- **Visual shelves**: an interactive grid that represents the physical shelf layout:
  - Each shelf has its own grid dimensions (rows x columns).
  - Bins can span multiple cells, allowing differently sized bins on one shelf.
  - Edit mode supports adding bins to empty cells, editing, moving, deleting, and assigning custom colors.
- **Items**: complete item list with search, category filtering, and low-stock filtering.
- **Transactions**: record incoming and outgoing items with notes; stock is updated automatically.
- **Low stock**: items are automatically marked red when `quantity <= minStock`.

## Project structure

```text
src/
  main.tsx              Entry point (QueryClient + RouterProvider)
  router.tsx            TanStack Router route tree
  index.css             Tailwind CSS
  lib/
    api.ts              Fetch helpers for /api/*
    utils.ts            isLowStock and other utilities
  hooks/
    api.ts              TanStack Query hooks (useRacks, useItems, useTransactions, etc.)
  components/
    RackGrid.tsx        Grid renderer (view mode + mini preview)
    RackGridEditor.tsx  Interactive grid editor
    BinEditDialog.tsx   Add/edit bin dialog
    ItemForm.tsx        Add-item form
    TransactionForm.tsx Quick transaction form
  routes/
    __root.tsx          Root layout (navbar)
    index.tsx           Dashboard
    racks.index.tsx     Shelf list
    racks.$rackId.tsx   Shelf details
    racks.$rackId.edit.tsx Shelf-layout editor
    items.index.tsx     Item list
    items.$itemId.tsx   Item details
    transactions.index.tsx Transaction history
server/
  index.ts              Express app entry point
  db.ts                 Prisma client singleton
  routes/
    racks.ts            CRUD /api/racks
    bins.ts             CRUD /api/bins
    items.ts            CRUD /api/items
    transactions.ts     CRUD /api/transactions
    categories.ts       CRUD /api/categories
prisma/
  schema.prisma         Data models
  seed.mjs              Sample data
```

## Resetting the database

```bash
rm prisma/dev.db && npm run db:push && npm run db:seed
```
