import type { Request } from "express";

export type Page = {
  page: number;
  pageSize: number;
  skip: number;
};

export function getPage(req: Request): Page {
  const page = Math.max(1, Number.parseInt(String(req.query.page), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(String(req.query.pageSize), 10) || 25)
  );

  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginated<T>(items: T[], total: number, page: Page) {
  return {
    items,
    total,
    page: page.page,
    pageSize: page.pageSize,
    totalPages: Math.ceil(total / page.pageSize),
  };
}
