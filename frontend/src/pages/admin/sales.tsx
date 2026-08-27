import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Banknote,
  Calculator,
  Check,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBasket,
  Trash2,
  WalletCards,
} from "lucide-react";

type PaymentMethod = "cash" | "debt";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  tone: string;
  shortCode: string;
};

type CartLine = Product & {
  quantity: number;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "قهوة عربية محمصة",
    category: "قهوة",
    price: 24.5,
    stock: 18,
    tone: "from-[#dca66e] to-[#a65335]",
    shortCode: "ق ع",
  },
  {
    id: 2,
    name: "بن كولومبي وسط",
    category: "بن مختص",
    price: 38,
    stock: 12,
    tone: "from-[#8d6a51] to-[#41312d]",
    shortCode: "ك و",
  },
  {
    id: 3,
    name: "هيل أخضر فاخر",
    category: "إضافات",
    price: 16,
    stock: 26,
    tone: "from-[#9ba86d] to-[#4d6451]",
    shortCode: "هـ",
  },
  {
    id: 4,
    name: "قهوة تركية ناعمة",
    category: "قهوة",
    price: 21.75,
    stock: 9,
    tone: "from-[#c36e50] to-[#6d3431]",
    shortCode: "ت",
  },
  {
    id: 5,
    name: "بن إثيوبي مزهر",
    category: "بن مختص",
    price: 42.5,
    stock: 7,
    tone: "from-[#dfc58c] to-[#8b5b3c]",
    shortCode: "إ",
  },
  {
    id: 6,
    name: "تمر سكري فاخر",
    category: "ضيافة",
    price: 18,
    stock: 31,
    tone: "from-[#9a6c4f] to-[#58352e]",
    shortCode: "ت س",
  },
];

const CUSTOMERS = [
  { id: "saleh", name: "صالح العتيبي", detail: "حساب نشط" },
  { id: "mona", name: "منى القحطاني", detail: "آخر شراء منذ ٤ أيام" },
  { id: "fahad", name: "فهد الزهراني", detail: "حساب نشط" },
];

const formatPrice = (value: number) =>
  `${value.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`;

const formatTime = () =>
  new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

export default function AdminSales() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartLine[]>([
    {
      ...PRODUCTS[0],
      quantity: 1,
    },
  ]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");

    if (!term) return PRODUCTS;

    return PRODUCTS.filter((product) =>
      `${product.name} ${product.category}`
        .toLocaleLowerCase("ar")
        .includes(term),
    );
  }, [search]);

  const itemCount = cart.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );

  const total = cart.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  const paid =
    paymentMethod === "debt"
      ? Math.max(0, Number(paidAmount) || 0)
      : total;

  const remaining = Math.max(0, total - paid);

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find(
        (line) => line.id === product.id,
      );

      if (existing) {
        return current.map((line) =>
          line.id === product.id
            ? {
                ...line,
                quantity: Math.min(
                  line.quantity + 1,
                  line.stock,
                ),
              }
            : line,
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (
    id: number,
    direction: "increase" | "decrease",
  ) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.id !== id) return line;

          const nextQuantity =
            direction === "increase"
              ? Math.min(line.quantity + 1, line.stock)
              : line.quantity - 1;

          return {
            ...line,
            quantity: nextQuantity,
          };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (id: number) => {
    setCart((current) =>
      current.filter((line) => line.id !== id),
    );
  };

  const startNewSale = () => {
    setCart([]);
    setPaymentMethod("cash");
    setCustomerId("");
    setPaidAmount("");
    setSearch("");
  };

  const completeSale = () => {
    if (!cart.length) {
      toast({
        title: "الفاتورة فارغة",
        description:
          "أضف منتجاً واحداً على الأقل قبل إتمام البيع.",
        variant: "destructive",
      });

      return;
    }

    if (paymentMethod === "debt" && !customerId) {
      toast({
        title: "اختر الزبون أولاً",
        description:
          "الفاتورة الآجلة تحتاج إلى ربطها بحساب زبون.",
        variant: "destructive",
      });

      return;
    }

    toast({
      title: "تم تسجيل البيع تجريبياً",
      description:
        "لم يتم الحفظ في قاعدة البيانات. هذه الفاتورة محلية للمعاينة فقط.",
    });

    startNewSale();
  };

  return (
    <section
      dir="rtl"
      className="min-h-full space-y-5 bg-[#f6f2ec] pb-8"
      data-testid="page-admin-sales"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#ded3c8] bg-[#f6f2ec]/95 px-1 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold text-[#9a5b45]">
              <span className="h-2 w-2 rounded-full bg-[#a95b42]" />
              نقطة البيع
            </div>

            <h1 className="text-2xl font-black text-[#2f2521] sm:text-3xl">
              مبيعات اليوم
            </h1>

            <p className="mt-1 text-xs text-[#85756c] sm:text-sm">
              {formatTime()} · البيع السريع
            </p>
          </div>

          <Button
            variant="outline"
            onClick={startNewSale}
            className="h-11 w-full rounded-xl border-[#cdbbad] bg-white text-[#704033] hover:bg-[#f5ebe2] lg:w-auto"
            data-testid="button-new-sale"
          >
            <RotateCcw className="h-4 w-4" />
            بيع جديد
          </Button>
        </div>
      </header>

      {/* LOCAL MODE */}
      <div
        className="rounded-xl border border-[#e3cda8] bg-[#fff8e7] px-4 py-3 text-xs text-[#75552e] sm:text-sm"
        role="status"
        data-testid="status-local-mode"
      >
        <strong>وضع التجربة:</strong>{" "}
        المبيعات الحالية محفوظة محلياً داخل الشاشة فقط.
      </div>

      {/* POS */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* PRODUCTS */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-[#a47767]">
                الكتالوج
              </p>

              <h2 className="text-xl font-black text-[#332621]">
                اختر المنتجات
              </h2>
            </div>

            <span className="rounded-full bg-[#eadbcf] px-3 py-1.5 text-xs font-bold text-[#70483b]">
              {filteredProducts.length} منتجات
            </span>
          </div>

          {/* SEARCH */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a58a7d]" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث عن منتج..."
              className="h-12 rounded-2xl border-[#d9c9bd] bg-white pr-12 text-sm shadow-sm placeholder:text-[#a7978d]"
              aria-label="البحث عن منتج"
              data-testid="input-product-search"
            />
          </div>

          {/* PRODUCTS GRID */}
          {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const line = cart.find(
                  (item) => item.id === product.id,
                );

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="group relative overflow-hidden rounded-2xl border border-[#dfd2c8] bg-white p-2.5 text-right shadow-[0_4px_14px_rgba(65,42,29,0.05)] transition-all hover:-translate-y-1 hover:border-[#ad765f] hover:shadow-[0_8px_22px_rgba(65,42,29,0.1)] active:scale-[0.98]"
                    data-testid={`button-add-product-${product.id}`}
                  >
                    {/* PRODUCT IMAGE PLACEHOLDER */}
                    <div
                      className={`relative mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${product.tone}`}
                    >
                      <div className="absolute inset-0 bg-black/5" />

                      <span className="relative text-3xl font-black text-white drop-shadow-md">
                        {product.shortCode}
                      </span>

                      <div className="absolute bottom-2 left-2 rounded-lg bg-black/20 p-1.5 text-white backdrop-blur-sm">
                        <ShoppingBasket className="h-4 w-4" />
                      </div>
                    </div>

                    <p className="line-clamp-2 min-h-[40px] text-sm font-extrabold leading-5 text-[#362a25]">
                      {product.name}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="text-sm font-black text-[#9b4f3b]">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-[#97847a]">
                      متوفر {product.stock}
                    </p>

                    {line && (
                      <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#fff1c9] px-2 text-xs font-black text-[#75432f] shadow-sm">
                        {line.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border border-dashed border-[#cdb9ab] bg-white px-6 py-16 text-center"
              data-testid="empty-product-results"
            >
              <Search className="mx-auto h-9 w-9 text-[#ad9386]" />

              <p className="mt-3 font-bold text-[#574239]">
                لا توجد منتجات بهذا الاسم
              </p>

              <button
                type="button"
                className="mt-2 text-sm font-bold text-[#9d513e] underline"
                onClick={() => setSearch("")}
                data-testid="button-clear-product-search"
              >
                عرض كل المنتجات
              </button>
            </div>
          )}
        </div>

        {/* INVOICE */}
        <aside className="overflow-hidden rounded-2xl border border-[#d8c8bc] bg-white shadow-[0_10px_30px_rgba(62,40,29,0.08)] xl:sticky xl:top-24 xl:self-start">
          {/* INVOICE HEADER */}
          <div className="border-b border-[#e6dcd4] bg-[#f8eee5] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#704033] text-white shadow-sm">
                  <Receipt className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-black text-[#30231f]">
                    الفاتورة الحالية
                  </h2>

                  <p className="text-xs text-[#8d766a]">
                    {itemCount} قطعة
                  </p>
                </div>
              </div>

              <span className="rounded-lg bg-white px-2 py-1 font-mono text-[10px] font-bold text-[#9b7667]">
                #LOCAL-024
              </span>
            </div>
          </div>

          {/* CART */}
          <div
            className="max-h-[380px] overflow-y-auto px-5"
            data-testid="cart-lines"
          >
            {cart.length ? (
              <div className="divide-y divide-[#eee4dc]">
                {cart.map((line) => (
                  <div
                    key={line.id}
                    className="py-4"
                    data-testid={`row-cart-product-${line.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#382924]">
                          {line.name}
                        </p>

                        <p className="mt-1 text-xs text-[#988278]">
                          {formatPrice(line.price)} للوحدة
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeLine(line.id)
                        }
                        className="rounded-lg p-2 text-[#b47d70] hover:bg-[#f8e8e3] hover:text-[#9c4435]"
                        aria-label={`حذف ${line.name}`}
                        data-testid={`button-remove-product-${line.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center overflow-hidden rounded-xl border border-[#d8c8bd] bg-[#faf7f3]">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center text-[#74473a] hover:bg-[#f0e2d8]"
                          onClick={() =>
                            updateQuantity(
                              line.id,
                              "decrease",
                            )
                          }
                          aria-label={`إنقاص كمية ${line.name}`}
                          data-testid={`button-decrease-quantity-${line.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span
                          className="min-w-9 text-center text-sm font-black text-[#342620]"
                          data-testid={`text-quantity-${line.id}`}
                        >
                          {line.quantity}
                        </span>

                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center text-[#74473a] hover:bg-[#f0e2d8]"
                          onClick={() =>
                            updateQuantity(
                              line.id,
                              "increase",
                            )
                          }
                          aria-label={`زيادة كمية ${line.name}`}
                          data-testid={`button-increase-quantity-${line.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <p
                        className="text-sm font-black text-[#713b30]"
                        data-testid={`text-line-total-${line.id}`}
                      >
                        {formatPrice(
                          line.price * line.quantity,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="py-16 text-center"
                data-testid="empty-cart"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e5dc] text-[#a78272]">
                  <ShoppingBasket className="h-7 w-7" />
                </div>

                <p className="mt-3 text-sm font-bold text-[#62483d]">
                  الفاتورة فارغة
                </p>

                <p className="mt-1 text-xs text-[#9c877c]">
                  اضغط على أي منتج لإضافته
                </p>
              </div>
            )}
          </div>

          {/* TOTAL */}
          <div className="border-t border-[#e5dad1] bg-[#fffdf9] px-5 py-5">
            <div className="flex items-center justify-between text-sm text-[#806c61]">
              <span>عدد القطع</span>
              <span className="font-bold">
                {itemCount}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-[#806c61]">
              <span>المجموع الفرعي</span>

              <span
                className="font-bold"
                data-testid="text-subtotal"
              >
                {formatPrice(total)}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-dashed border-[#daccc2] pt-4">
              <span className="font-black text-[#48352d]">
                الإجمالي
              </span>

              <strong
                className="text-2xl font-black tracking-tight text-[#70392f]"
                data-testid="text-invoice-total"
              >
                {formatPrice(total)}
              </strong>
            </div>

            {/* PAYMENT */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-black text-[#684c40]">
                طريقة الدفع
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black transition-all ${
                    paymentMethod === "cash"
                      ? "border-[#754236] bg-[#754236] text-white shadow-sm"
                      : "border-[#d8c8bd] bg-white text-[#76584b] hover:bg-[#f7eee8]"
                  }`}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="h-4 w-4" />
                  نقدي
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("debt")
                  }
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black transition-all ${
                    paymentMethod === "debt"
                      ? "border-[#754236] bg-[#754236] text-white shadow-sm"
                      : "border-[#d8c8bd] bg-white text-[#76584b] hover:bg-[#f7eee8]"
                  }`}
                  data-testid="button-payment-debt"
                >
                  <WalletCards className="h-4 w-4" />
                  دين
                </button>
              </div>
            </div>

            {/* DEBT */}
            {paymentMethod === "debt" && (
              <div
                className="mt-4 space-y-3 rounded-xl border border-[#e2c9bb] bg-[#fff7f2] p-3"
                data-testid="debt-fields"
              >
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-[#70473b]"
                    htmlFor="customer-select"
                  >
                    الزبون
                  </label>

                  <Select
                    value={customerId}
                    onValueChange={setCustomerId}
                  >
                    <SelectTrigger
                      id="customer-select"
                      className="h-10 border-[#d9b9a8] bg-white"
                      data-testid="select-debt-customer"
                    >
                      <SelectValue placeholder="اختر حساب الزبون" />
                    </SelectTrigger>

                    <SelectContent dir="rtl">
                      {CUSTOMERS.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id}
                        >
                          <span>{customer.name}</span>

                          <span className="mr-2 text-xs text-[#a18172]">
                            · {customer.detail}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-[#70473b]"
                    htmlFor="paid-amount"
                  >
                    المدفوع الآن
                  </label>

                  <div className="relative">
                    <Input
                      id="paid-amount"
                      type="number"
                      min="0"
                      step="0.25"
                      value={paidAmount}
                      onChange={(event) =>
                        setPaidAmount(
                          event.target.value,
                        )
                      }
                      placeholder="0.00"
                      className="h-10 border-[#d9b9a8] bg-white pl-12 text-left font-mono"
                      dir="ltr"
                      data-testid="input-paid-amount"
                    />

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a18172]">
                      ر.س
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#ecd8cc] pt-3">
                  <span className="text-sm font-bold text-[#845648]">
                    المتبقي
                  </span>

                  <span
                    className="font-black text-[#a34f3c]"
                    data-testid="text-remaining-amount"
                  >
                    {formatPrice(remaining)}
                  </span>
                </div>
              </div>
            )}

            {/* COMPLETE */}
            <Button
              className="mt-5 h-12 w-full rounded-xl bg-[#70392f] text-base font-black text-white shadow-[0_8px_18px_rgba(112,57,47,0.2)] hover:bg-[#5f2e27]"
              onClick={completeSale}
              data-testid="button-complete-sale"
            >
              <Check className="h-5 w-5" />

              إتمام البيع

              <ArrowLeft className="mr-auto h-4 w-4" />
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#a08779]">
              <Calculator className="h-3.5 w-3.5" />
              المبالغ محسوبة فورياً
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
