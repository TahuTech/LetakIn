import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { DashboardPage } from "./routes/index";
import { RacksPage } from "./routes/racks.index";
import { RackDetailPage } from "./routes/racks.$rackId";
import { RackEditPage } from "./routes/racks.$rackId.edit";
import { ItemsPage } from "./routes/items.index";
import { ItemDetailPage } from "./routes/items.$itemId";
import { TransactionsPage } from "./routes/transactions.index";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const racksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/racks",
  component: RacksPage,
});

const rackDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/racks/$rackId",
  component: RackDetailPage,
});

const rackEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/racks/$rackId/edit",
  component: RackEditPage,
});

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items",
  component: ItemsPage,
});

const itemDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/$itemId",
  component: ItemDetailPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  racksRoute,
  rackDetailRoute,
  rackEditRoute,
  itemsRoute,
  itemDetailRoute,
  transactionsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
