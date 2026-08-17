import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { formatToman } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  MapPin,
  User,
  Hash,
  Receipt,
  Calendar,
  Loader2,
  X,
  CreditCard,
  RotateCcw,
  Landmark,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { glass } from "@/lib/glass";
import { StatusBadge, type StatusKind } from "@/components/admin";
import { useToast } from "@/lib/toast";
import { AdminEmptyState } from "@/components/admin";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returning" | "cancelled";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "جدید",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تکمیل شده",
  returning: "در حال بازگشت",
  cancelled: "لغو شده",
};

const STATUS_TONE: Record<OrderStatus, StatusKind> = {
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  returning: "returning",
  cancelled: "cancelled",
};

const NEXT_VALID: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returning", "cancelled"],
  delivered: ["returning"],
  returning: ["delivered"],
  cancelled: [],
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "returning",
  "cancelled",
];

/* Phase 8.1 — payment lifecycle is separate from order status. */
type PaymentStatus =
  | "pending"
  | "initiated"
  | "redirected"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "در انتظار پرداخت",
  initiated: "در حال پرداخت",
  redirected: "انتقال به درگاه",
  paid: "پرداخت شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
  refunded: "بازگشت وجه",
};

const PAYMENT_TONE: Record<PaymentStatus, StatusKind> = {
  pending: "pending",
  initiated: "pending",
  redirected: "pending",
  paid: "delivered",
  failed: "cancelled",
  cancelled: "cancelled",
  refunded: "returning",
};

function PaymentBadge({ status }: { status: string }) {
  const key = (Object.prototype.hasOwnProperty.call(PAYMENT_LABEL, status)
    ? status
    : "pending") as PaymentStatus;
  return (
    <StatusBadge status={PAYMENT_TONE[key]} label={PAYMENT_LABEL[key]} />
  );
}

export default function OrdersAdmin() {
  const orders = useQuery(api.admin_orders.listAllOrders, {});
  const [needle, setNeedle] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = (orders ?? []) as Array<Record<string, unknown>>;
    return list.filter((row) => {
      const s = String(row.status ?? "") as OrderStatus;
      if (status !== "all" && s !== status) return false;
      if (!needle) return true;
      const hay = [
        row._id,
        row.code,
        row.orderNumber,
        row.customerName,
        row.customerEmail,
        row.shippingName,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" ");
      return hay.includes(needle.toLowerCase());
    });
  }, [orders, needle, status]);

  return (
    <div className="space-y-6" dir="rtl">
      <header className="space-y-2">
        <p className="type-eyebrow text-ink-muted">فروش</p>
        <h1 className="font-display text-4xl text-ink lg:text-5xl">سفارش‌ها</h1>
        <p className="text-sm text-ink-soft">مدیریت سفارش‌های مشتریان و تغییر وضعیت ارسال</p>
      </header>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${glass.surface} rounded-2xl`}>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            value={needle}
            onChange={(e) => setNeed(e.target.value)}
            placeholder="جستجو در سفارش‌ها، نام یا کد…"
            className="w-full rounded-xl border border-edge bg-canvas/60 pe-9 ps-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Filter className="h-4 w-4 text-ink-muted" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
            className="rounded-xl border border-edge bg-canvas/60 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all" className="bg-canvas-soft text-ink">همه وضعیت‌ها</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-canvas-soft text-ink">
                {STATUS_LABEL[opt]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!orders ? (
        <SkeletonTable />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="سفارشی یافت نشد"
          body={
            needle || status !== "all"
              ? "با فیلتر فعلی هیچ سفارشی پیدا نشد. فیلتر را تغییر دهید."
              : "هنوز سفارشی ثبت نشده است."
          }
        />
      ) : (
        <div className={`overflow-hidden rounded-2xl ${glass.surface}`}>
          <table className="w-full text-sm">
            <thead className="bg-canvas-soft text-ink-muted">
              <tr className="text-right">
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">کد سفارش</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">مشتری</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">مبلغ</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">وضعیت</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">پرداخت</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">تاریخ</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60">
              {rows.map((row, i) => {
                const id = String(row._id ?? idx(i));
                // Phase 7.5: map the real order doc fields — `number` (not
                // orderNumber/code), shipping.fullName, no customer email.
                const orderNumber = String(row.number ?? row.code ?? `ORD-${id.slice(-6)}`);
                const shipping = row.shipping as { fullName?: unknown; email?: unknown } | undefined;
                const name = String(row.customerName ?? row.shippingName ?? shipping?.fullName ?? "—");
                const email = String(row.customerEmail ?? shipping?.email ?? "");
                const totalCents = Number(row.totalCents ?? row.subtotalCents ?? 0);
                const s = String(row.status ?? "pending") as OrderStatus;
                const placedAt = Number(row.placedAt ?? row.createdAt ?? row._creationTime ?? 0);
                return (
                  <tr key={id} className="transition hover:bg-canvas/60">
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{name}</div>
                      {email && <div className="text-xs text-ink-muted">{email}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{formatToman(totalCents)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_TONE[s]} label={STATUS_LABEL[s] ?? "—"} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={String(row.paymentStatus ?? "pending")} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted text-xs">
                      {placedAt ? toFaDate(placedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setOpenId(id)}
                          className="inline-flex items-center gap-1.5 rounded-lg hairline bg-canvas/60 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-canvas-soft hover:text-ink"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          مشاهده
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {openId && <OrderDetailDrawer id={openId} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </div>
  );

  function setNeed(v: string) {
    setNeedle(v);
  }
}

function idx(i: number) {
  return `idx-${i}`;
}

function toFaDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function SkeletonTable() {
  return (
    <div className={`overflow-hidden rounded-2xl ${glass.surface}`}>
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-ink-muted/15 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function OrderDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useQuery(api.admin_orders.getOrderWithItems, { id: id as any }) as any;
  const setStatus = useMutation(api.admin_orders.setOrderStatus);
  const confirmPay = useMutation(api.orders.confirmPayment);
  const cancelPay = useMutation(api.orders.cancelPending);
  const refundPay = useMutation(api.orders.refund);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);

  const order = detail?.order;
  const items = (detail?.items ?? []) as any[];
  const history = (detail?.history ?? []) as any[];

  const s: OrderStatus = (order?.status ?? "pending") as OrderStatus;
  const nextOptions = NEXT_VALID[s] ?? [];

  function transition(target: OrderStatus) {
    if (busy) return;
    setBusy(true);
    Promise.resolve(
      setStatus({ id: id as any, status: target, note: undefined as any }),
    )
      .then(() => toast.success(`وضعیت سفارش به «${STATUS_LABEL[target]}» تغییر کرد`))
      .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`))
      .finally(() => setBusy(false));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto ${glass.modal} shadow-2xl`}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <div>
            <div className="text-xs text-ink-muted">سفارش</div>
            <h2 className="font-display text-lg font-semibold text-ink font-mono">
              {order?.number ?? order?.code ?? id.slice(-8)}
            </h2>
          </div>
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
        ) : !order ? (
          <div className="p-6 text-sm text-ink-muted">سفارش یافت نشد.</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={<Hash className="h-4 w-4" />} label="کد سفارش" value={String(order.number ?? order.code ?? "—")} />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="تاریخ ثبت"
                value={order.placedAt ? toFaDate(Number(order.placedAt)) : "—"}
              />
              <InfoRow icon={<User className="h-4 w-4" />} label="مشتری" value={String((order.shipping as any)?.fullName ?? "—")} />
              <div>
                <div className="mb-1 text-xs text-ink-muted">وضعیت</div>
                <StatusBadge status={STATUS_TONE[s] ?? "neutral"} label={STATUS_LABEL[s] ?? "—"} />
              </div>
            </div>

            {/* Phase 8.1 — payment lifecycle block */}
            <section className="rounded-xl border border-edge bg-canvas/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <CreditCard className="h-4 w-4 text-ink-muted" />
                وضعیت پرداخت
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <PaymentBadge status={String(order.paymentStatus ?? "pending")} />
                  <div className="mt-1.5 space-y-0.5 text-xs text-ink-muted">
                    {order.paymentProvider && (
                      <div className="inline-flex items-center gap-1">
                        <Landmark className="h-3 w-3" />
                        درگاه: {String(order.paymentProvider)}
                      </div>
                    )}
                    {order.paymentReference && (
                      <div className="font-mono text-[11px] text-ink-muted" dir="ltr">
                        Authority: {String(order.paymentReference)}
                      </div>
                    )}
                    {order.paymentTransactionId && (
                      <div className="font-mono text-[11px] text-ink-muted" dir="ltr">
                        RefId: {String(order.paymentTransactionId)}
                      </div>
                    )}
                    {order.paidAt && (
                      <div>پرداخت در {toFaDate(Number(order.paidAt))}</div>
                    )}
                  </div>
                </div>
                {order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" &&
                  order.paymentStatus !== "cancelled" && order.paymentStatus !== "failed" && s === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (payBusy) return;
                          setPayBusy(true);
                          confirmPay({ orderId: id as any })
                            .then(() => toast.success("پرداخت تأیید شد — سفارش وارد مرحله پردازش شد"))
                            .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`))
                            .finally(() => setPayBusy(false));
                        }}
                        disabled={payBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-canvas hover:bg-emerald-400 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تأیید پرداخت
                      </button>
                      <button
                        onClick={() => {
                          if (payBusy) return;
                          setPayBusy(true);
                          cancelPay({
                            orderId: id as any,
                            paymentStatus: "cancelled",
                            note: "لغو از پنل مدیریت",
                          })
                            .then(() => toast.success("پرداخت لغو شد — موجودی رزرو شده آزاد شد"))
                            .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`))
                            .finally(() => setPayBusy(false));
                        }}
                        disabled={payBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg hairline bg-canvas/60 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-canvas-soft hover:text-ink disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        لغو پرداخت
                      </button>
                    </div>
                  )}
                {order.paymentStatus === "paid" && (
                  <button
                    onClick={() => {
                      if (refundBusy) return;
                      setRefundBusy(true);
                      refundPay({ orderId: id as any, note: "بازگشت وجه از پنل مدیریت" })
                        .then(() => toast.success("بازگشت وجه ثبت شد — موجودی به انبار برگشت"))
                        .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`))
                        .finally(() => setRefundBusy(false));
                    }}
                    disabled={refundBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    بازگشت وجه
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-edge bg-canvas/60 p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">اقلام سفارش</h3>
              {items.length === 0 ? (
                <div className="text-sm text-ink-muted">اقلامی یافت نشد.</div>
              ) : (
                <ul className="space-y-2">
                  {items.map((it, i) => (
                    <li key={String(it._id ?? i)} className="flex items-center justify-between text-sm">
                      <div className="flex-1 text-ink">
                        <div className="font-medium">
                          {String(it.productNameSnapshot ?? it.title ?? it.name ?? "محصول")}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {[it.color, it.size, it.quantity ? `${Number(it.quantity).toLocaleString("fa-IR")} عدد` : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <div className="text-ink-soft">
                        {formatToman(Number(it.lineTotalCents ?? it.totalCents ?? 0))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-edge/60 pt-3 text-sm font-semibold text-ink">
                <span>جمع کل</span>
                <span>{formatToman(Number(order.totalCents ?? 0))}</span>
              </div>
            </section>

            <section className="rounded-xl border border-edge bg-canvas/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="h-4 w-4 text-ink-muted" />
                آدرس ارسال
              </h3>
              <AddressBody order={order} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink">تغییر وضعیت</h3>
              {nextOptions.length === 0 ? (
                <div className="text-sm text-ink-muted">
                  در وضعیت فعلی امکان تغییر خودکار وجود ندارد.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {nextOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => transition(opt)}
                      disabled={busy}
                      className="flex items-center justify-between rounded-xl border border-edge bg-canvas/60 px-4 py-3 text-sm font-medium text-ink transition hover:bg-canvas-soft disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <StatusIcon s={opt} />
                        {STATUS_LABEL[opt]}
                      </span>
                      <ChevronDown className="h-4 w-4 -rotate-90 text-ink-muted" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {history.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-ink">تاریخچه وضعیت</h3>
                <ol className="space-y-2 border-r border-edge pe-4">
                  {history.map((h, i) => (
                    <li key={String(h._id ?? i)} className="text-sm">
                      <div className="text-ink">{String(h.label ?? STATUS_LABEL[(h.status as OrderStatus)] ?? h.status ?? "—")}</div>
                      <div className="text-xs text-ink-muted">{h.at ? toFaDate(Number(h.at)) : ""}</div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-edge bg-canvas/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-muted">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function AddressBody({ order }: { order: any }) {
  const shipping = order?.shipping ?? {};
  const lines = [
    shipping.fullName,
    shipping.phone,
    [shipping.province, shipping.city].filter(Boolean).join("، "),
    shipping.address,
    shipping.postalCode ? `کد پستی: ${shipping.postalCode}` : "",
  ].filter(Boolean);
  if (lines.length === 0) {
    return <div className="text-sm text-ink-muted">آدرس ثبت نشده است.</div>;
  }
  return (
    <div className="space-y-1 text-sm text-ink">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

function StatusIcon({ s }: { s: OrderStatus }) {
  switch (s) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "processing":
      return <Package className="h-4 w-4 text-sky-500" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-indigo-500" />;
    case "delivered":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "returning":
      return <Truck className="h-4 w-4 text-amber-500" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-rose-500" />;
    default:
      return <Clock className="h-4 w-4 text-ink-muted" />;
  }
}
