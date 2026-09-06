import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categories
  const elektronik = await prisma.category.upsert({
    where: { name: "Elektronik" },
    update: {},
    create: { name: "Elektronik" },
  });
  const mekanik = await prisma.category.upsert({
    where: { name: "Mekanik" },
    update: {},
    create: { name: "Mekanik" },
  });
  const konsumable = await prisma.category.upsert({
    where: { name: "Konsumable" },
    update: {},
    create: { name: "Konsumable" },
  });

  // Rak A: grid rapi 3 kolom x 4 baris
  const rakA = await prisma.rack.upsert({
    where: { code: "A" },
    update: {},
    create: {
      name: "Rak A - Komponen Kecil",
      code: "A",
      rows: 4,
      cols: 3,
    },
  });

  const binDataA = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      binDataA.push({
        rackId: rakA.id,
        label: `A${r * 3 + c + 1}`,
        row: r,
        col: c,
      });
    }
  }
  for (const b of binDataA) {
    await prisma.bin.upsert({
      where: { rackId_row_col: { rackId: b.rackId, row: b.row, col: b.col } },
      update: {},
      create: b,
    });
  }

  // Rak B: grid 3x3 dengan bin campur ukuran
  const rakB = await prisma.rack.upsert({
    where: { code: "B" },
    update: {},
    create: {
      name: "Rak B - Campuran",
      code: "B",
      rows: 3,
      cols: 3,
    },
  });

  const binsB = [
    { label: "B1 - Drawer Besar", row: 0, col: 0, rowSpan: 1, colSpan: 2, color: "#3b82f6" },
    { label: "B2", row: 0, col: 2, rowSpan: 1, colSpan: 1 },
    { label: "B3", row: 1, col: 0, rowSpan: 1, colSpan: 1 },
    { label: "B4", row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    { label: "B5", row: 1, col: 2, rowSpan: 1, colSpan: 1 },
    { label: "B6 - Full Lebar", row: 2, col: 0, rowSpan: 1, colSpan: 3, color: "#22c55e" },
  ];
  for (const b of binsB) {
    await prisma.bin.upsert({
      where: { rackId_row_col: { rackId: rakB.id, row: b.row, col: b.col } },
      update: {},
      create: { rackId: rakB.id, ...b },
    });
  }

  // Items contoh
  const binA1 = await prisma.bin.findFirst({ where: { label: "A1", rackId: rakA.id } });
  const binA2 = await prisma.bin.findFirst({ where: { label: "A2", rackId: rakA.id } });
  const binB1 = await prisma.bin.findFirst({ where: { label: "B1 - Drawer Besar", rackId: rakB.id } });

  const items = [
    { name: "Resistor 10k 1/4W", categoryId: elektronik.id, binId: binA1?.id, quantity: 2, minStock: 10 },
    { name: "Kapasitor 100uF 25V", categoryId: elektronik.id, binId: binA1?.id, quantity: 3, minStock: 10 },
    { name: "IC NE555", categoryId: elektronik.id, binId: binA2?.id, quantity: 15, minStock: 5 },
    { name: "Baut M3x10", categoryId: mekanik.id, binId: binB1?.id, quantity: 200, minStock: 50 },
    { name: "Mur M3", categoryId: mekanik.id, binId: binB1?.id, quantity: 4, minStock: 50 },
    { name: "Kabel AWG22 Merah (roll)", categoryId: konsumable.id, quantity: 1, minStock: 1 },
  ];

  for (const item of items) {
    const existing = await prisma.item.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.item.create({ data: item });
    }
  }

  console.log("Seed selesai!");
  console.log(`Rak: ${await prisma.rack.count()}, Bin: ${await prisma.bin.count()}, Item: ${await prisma.item.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
