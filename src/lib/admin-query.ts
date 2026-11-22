import { z } from "zod";

const iso = z.string().datetime();
const schema = z.object({
  from: iso.optional(),
  to: iso.optional(),
  q: z.string().trim().max(80).optional(),
  status: z.string().max(20).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

/** Reads ?from&to&q&status&page&pageSize from a request URL. */
export function parseList(req: Request) {
  const r = schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  return r.success ? r.data : null;
}
export type ListQuery = z.infer<typeof schema>;

/** createdAt window; the browser sends its own start and end of day, so "today" matches the admin's timezone. */
export function dateFilter(q: { from?: string; to?: string }) {
  if (!q.from && !q.to) return {};
  return { createdAt: { ...(q.from && { $gte: new Date(q.from) }), ...(q.to && { $lte: new Date(q.to) }) } };
}

export const rx = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
export const pageOf = (q: ListQuery) => ({ skip: (q.page - 1) * q.pageSize, limit: q.pageSize });
