import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { formatToman } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Eye,
  X,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { glass } from "@/lib/glass";
import { AdminEmptyState } from "@/components/admin";

export default function CustomersAdmin() {
  const customers = useQuery(api.admin_orders.listCustomers, {});
  const [needle, setNeedle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = (customers ?? []) as Array<Record<string, unknown>>;
    if (!needle) return list;
    const n = needle.toLowerCase();
    return list.filter((row) => {
      const hay = [row.name, row.fullName, row.email, row.phone]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" ");
      return hay.includes(n);
    });
  }, [customers, needle]);

  return (
    <div className="space-y-6" dir="rtl">
      <header className="space-y-2">
        <p className="type-eyebrow text-ink-muted">مشتریان</p>
        <h1 className="font-display text-4xl text-ink lg:text-5xl">مشتریان</h1>
        <p className="text-sm text-ink-soft">مشاهده مشتریان و تاریخچه سفارش آن‌ها</p>
      </header>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${glass.surface} rounded-2xl`}>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس…"
            className="w-full rounded-xl border border-edge bg-canvas/60 pe-9 ps-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {!customers ? (
        <SkeletonList />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={<User className="h-6 w-6" />}
          title="مشتری یافت نشد"
          body={needle ? "با عبارت جستجو فعلی مشتری پیدا نشد." : "هنوز مشتری ثبت نکرده است."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((row, i) => {
            const id = String(row._id ?? i);
            const name = String(row.name ?? row.fullName ?? "بدون نام");
            const email = row.email ? String(row.email) : "";
            const phone = row.phone ? String(row.phone) : "";
            const createdAt = Number(row._creationTime ?? row.createdAt ?? 0);
            return (
              <button
                key={id}
                onClick={() => setOpenId(id)}
                className={`group flex items-center justify-between gap-4 rounded-2xl border border-edge bg-canvas-soft p-4 text-right transition hover:border-edge-bright hover:bg-canvas/80`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full hairline bg-canvas/60 font-display text-base text-ink-soft">
                    {initials(name)}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-ink">{name}</div>
                    <div className="mt-0.5 space-y-0.5 text-xs text-ink-muted">
                      {email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {email}
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[11px] text-ink-muted">
                    {createdAt ? toFaDate(createdAt) : ""}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg hairline bg-canvas/60 px-2.5 py-1 text-xs text-ink-soft transition group-hover:border-edge-bright group-hover:text-ink">
                    <Eye className="h-3.5 w-3.5" />
                    مشاهده
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {openId && <CustomerDrawer id={openId} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

function toFaDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`h-20 rounded-2xl ${glass.surface} animate-pulse`} />
      ))}
    </div>
  );
}

function CustomerDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useQuery(api.admin_orders.customerDetail, { id: id as any }) as any;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto ${glass.modal} shadow-2xl`}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <h2 className="font-display text-2xl text-ink">پروفایل مشتری</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted transition hover:bg-canvas/60"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!detail ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : !detail.user ? (
          <div className="p-6 text-sm text-ink-muted">مشتری یافت نشد.</div>
        ) : (
          <div className="space-y-6 p-6">
            <section className="flex items-center gap-4 rounded-xl border border-edge bg-canvas-soft p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full hairline bg-canvas/60 font-display text-lg text-ink-soft">
                {initials(String(detail.user.name ?? detail.user.fullName ?? "؟"))}
              </div>
              <div>
                <div className="text-base font-medium text-ink">
                  {String(detail.user.name ?? detail.user.fullName ?? "بدون نام")}
                </div>
                <div className="mt-1 space-y-0.5 text-sm text-ink-soft">
                  {detail.user.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-ink-muted" />
                      {String(detail.user.email)}
                    </div>
                  )}
                  {detail.user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-ink-muted" />
                      {String(detail.user.phone)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                <Receipt className="h-4 w-4 text-ink-muted" />
                تاریخچه سفارش‌ها
              </h3>
              {(detail.orders ?? []).length === 0 ? (
                <div className="rounded-xl border border-edge bg-canvas-soft p-4 text-sm text-ink-muted">
                  هنوز سفارشی ثبت نکرده است.
                </div>
              ) : (
                <ul className="space-y-2">
                  {(detail.orders as any[]).map((o, i) => (
                    <li
                      key={String(o._id ?? i)}
                      className="flex items-center justify-between rounded-xl border border-edge bg-canvas-soft px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-4 w-4 text-ink-muted" />
                        <div>
                          <div className="font-medium text-ink">
                            {String(o.orderNumber ?? o.code ?? `سفارش ${i + 1}`)}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {o.placedAt ? toFaDate(Number(o.placedAt)) : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-ink font-medium">
                        {formatToman(Number(o.totalCents ?? 0))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                <MapPin className="h-4 w-4 text-ink-muted" />
                آدرس‌های ثبت شده
              </h3>
              {(detail.addresses ?? []).length === 0 ? (
                <div className="rounded-xl border border-edge bg-canvas-soft p-4 text-sm text-ink-muted">
                  آدرسی ثبت نشده است.
                </div>
              ) : (
                <ul className="space-y-2">
                  {(detail.addresses as any[]).map((a, i) => (
                    <li
                      key={String(a._id ?? i)}
                      className="rounded-xl border border-edge bg-canvas-soft px-4 py-3 text-sm text-ink-soft"
                    >
                      <div className="font-medium text-ink">{String(a.label ?? a.fullName ?? "آدرس")}</div>
                      <div className="mt-1 text-xs text-ink-soft">
                        {[a.province, a.city, a.address].filter(Boolean).join("، ")}
                      </div>
                      {a.postalCode && (
                        <div className="mt-1 text-xs text-ink-muted">
                          کد پستی: {String(a.postalCode)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
