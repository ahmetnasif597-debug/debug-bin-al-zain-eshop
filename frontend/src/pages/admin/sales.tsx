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
  Bell,
  Check,
  Grid3x3,
  LayoutDashboard,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  TrendingUp,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";

type PaymentMethod = "cash" | "debt";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  shortCode: string;
};

type CartLine = Product & {
  quantity: number;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "هيل أخضر فاخر",
    category: "إضافات",
    price: 24.5,
    stock: 11,
    image:
      "https://picsum.photos/seed/cardamom-beanzayn/500/400",
    shortCode: "هـ",
  },
  {
    id: 2,
    name: "بن كولومبي وسط",
    category: "بن مختص",
    price: 38,
    stock: 2,
    image:
      "https://picsum.photos/seed/colombian-beanzayn/500/400",
    shortCode: "ك و",
  },
  {
    id: 3,
    name: "قهوة عربية محمصة",
    category: "قهوة",
    price: 24.5,
    stock: 2,
    image:
      "https://picsum.photos/seed/arabic-coffee-beanzayn/500/400",
    shortCode: "ق ع",
  },
  {
    id: 4,
    name: "تمر سكري فاخر",
    category: "ضيافة",
    price: 18.5,
    stock: 2,
    image:
      "https://picsum.photos/seed/dates-beanzayn/500/400",
    shortCode: "ت س",
  },
  {
    id: 5,
    name: "بن إثيوبي مزهر",
    category: "بن مختص",
    price: 44.5,
    stock: 2,
    image:
      "https://picsum.photos/seed/ethiopian-beanzayn/500/400",
    shortCode: "إ",
  },
  {
    id: 6,
    name: "قهوة تركية ناعمة",
    category: "قهوة",
    price: 21.9,
    stock: 1,
    image:
      "https://picsum.photos/seed/turkish-coffee-beanzayn/500/400",
    shortCode: "ت",
  },
  {
    id: 7,
    name: "عسل السدر",
    category: "ضيافة",
    price: 89,
    stock: 4,
    image:
      "https://picsum.photos/seed/sidr-honey-beanzayn/500/400",
    shortCode: "ع س",
  },
  {
    id: 8,
    name: "عسل الزهور",
    category: "ضيافة",
    price: 75,
    stock: 5,
    image:
      "https://picsum.photos/seed/flower-honey-beanzayn/500/400",
    shortCode: "ع ز",
  },
  {
    id: 9,
    name: "بن برازيلي محمصة",
    category: "بن مختص",
    price: 36,
    stock: 3,
    image:
      "https://picsum.photos/seed/brazilian-beanzayn/500/400",
    shortCode: "ب ب",
  },
];

const CUSTOMERS = [
  {
    id: "saleh",
    name: "صالح العتيبي",
    detail: "حساب نشط",
  },
  {
    id: "mona",
    name: "منى القحطاني",
    detail: "آخر شراء منذ ٤ أيام",
  },
  {
    id: "fahad",
    name: "فهد الزهراني",
    detail: "حساب نشط",
  },
];

const CATEGORIES = ["الكل", "قهوة", "بن مختص", "إضافات", "ضيافة"];

const NAV_ITEMS = [
  { label: "لوحة التحكم", icon: LayoutDashboard },
  { label: "المنتجات", icon: Package },
  { label: "الفئات", icon: Tag },
  { label: "الطلبات", icon: ShoppingCart },
  { label: "المبيعات", icon: Receipt, active: true },
  { label: "التقارير", icon: TrendingUp },
  { label: "العملاء", icon: Users },
  { label: "الإشعارات", icon: Bell, badge: 3 },
  { label: "إعدادات المتجر", icon: Settings },
];

const formatPrice = (value: number) =>
  `${value.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`;

export default function AdminSales() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");

  const [cart, setCart] = useState<CartLine[]>([
    {
      ...PRODUCTS[2],
      quantity: 1,
    },
  ]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");

    return PRODUCTS.filter((product) => {
      const matchesCategory =
        category === "الكل" || product.category === category;

      const matchesSearch =
        !term ||
        `${product.name} ${product.category}`
          .toLocaleLowerCase("ar")
          .includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

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
    setCategory("الكل");
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
      className="min-h-full bg-[#f5f0e6] text-[#30231e]"
      data-testid="page-admin-sales"
    >
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#70452e] bg-[#713b20] text-white shadow-md">
        <div className="flex h-[70px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Receipt className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-black sm:text-2xl">
                نقطة البيع | بن الزين
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewSale}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white hover:bg-white/10 sm:flex"
              data-testid="button-new-sale"
            >
              <RotateCcw className="h-4 w-4" />
              بيع جديد
            </button>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
              aria-label="الرسائل"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ffb454] text-[10px] font-black text-[#4a2c12]">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT: sidebar (right) | invoice (middle) | products (left) */}
      <div className="mx-auto grid max-w-[1800px] gap-0 xl:grid-cols-[230px_410px_minmax(0,1fr)]">
        {/* ADMIN SIDEBAR */}
        <nav className="hidden flex-col justify-between bg-gradient-to-b from-[#3c2013] to-[#241207] text-white xl:sticky xl:top-[70px] xl:flex xl:h-[calc(100vh-70px)]">
          <div>
            <div className="flex flex-col items-center gap-2 border-b border-white/10 px-5 py-7 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Receipt className="h-7 w-7 text-[#ffcf9c]" />
              </div>
              <strong className="text-lg font-black">
                بن الزين
              </strong>
              <span className="text-[11px] text-[#c9a98d]">
                لوحة الإدارة
              </span>
            </div>

            <ul className="flex flex-col gap-1 px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                        item.active
                          ? "bg-[#8a4b2c] text-white shadow-md"
                          : "text-[#d8c3b3] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>

                      {item.badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ffb454] px-1.5 text-[10px] font-black text-[#4a2c12]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffcf9c]/20 text-[#ffcf9c]">
                👑
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  المدير
                </p>
                <p className="truncate text-[11px] text-[#c9a98d]">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* INVOICE */}
        <aside className="flex min-h-[calc(100vh-70px)] flex-col border-l border-[#e4d9d0] bg-white shadow-[-5px_0_20px_rgba(65,40,25,0.08)] xl:sticky xl:top-[70px] xl:h-[calc(100vh-70px)]">
          {/* INVOICE HEADER */}
          <div className="border-b border-[#e4d9d0] bg-[#fbf7f1] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#33251f]">
                  الفاتورة الحالية
                </h2>

                <p className="mt-1 text-xs text-[#927d70]">
                  {itemCount} قطعة
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCart([])}
                className="rounded-lg p-2 text-[#9a7665] hover:bg-[#f4e7dd] hover:text-[#813e2d]"
                aria-label="تفريغ الفاتورة"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* CART */}
          <div
            className="flex-1 overflow-y-auto px-5"
            data-testid="cart-lines"
          >
            {cart.length ? (
              <div className="divide-y divide-[#eee6df]">
                {cart.map((line) => (
                  <div
                    key={line.id}
                    className="py-5"
                    data-testid={`row-cart-product-${line.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={line.image}
                        alt={line.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#352721]">
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
                        className="rounded-lg p-1.5 text-[#ae8071] hover:bg-[#f7e8e1]"
                        aria-label={`حذف ${line.name}`}
                        data-testid={`button-remove-product-${line.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-[#d9ccc2] bg-[#fbf8f4]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              line.id,
                              "decrease",
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-[#744532] hover:bg-[#eee2d8]"
                          aria-label={`إنقاص كمية ${line.name}`}
                          data-testid={`button-decrease-quantity-${line.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span
                          className="min-w-9 text-center text-sm font-black"
                          data-testid={`text-quantity-${line.id}`}
                        >
                          {line.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              line.id,
                              "increase",
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-[#744532] hover:bg-[#eee2d8]"
                          aria-label={`زيادة كمية ${line.name}`}
                          data-testid={`button-increase-quantity-${line.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <strong
                        className="text-sm font-black text-[#713927]"
                        data-testid={`text-line-total-${line.id}`}
                      >
                        {formatPrice(
                          line.price * line.quantity,
                        )}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex h-full min-h-[300px] flex-col items-center justify-center text-center"
                data-testid="empty-cart"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1e6dd] text-[#a47c69]">
                  <ShoppingBasket className="h-8 w-8" />
                </div>

                <p className="mt-4 font-black text-[#594239]">
                  الفاتورة فارغة
                </p>

                <p className="mt-1 text-xs text-[#9b887d]">
                  اختر منتجاً لإضافته إلى الفاتورة
                </p>
              </div>
            )}
          </div>

          {/* TOTAL */}
          <div className="border-t border-[#dfd4cc] bg-[#fffdf9] px-5 py-5">
            <div className="flex items-center justify-between text-sm text-[#806e63]">
              <span>عدد القطع</span>
              <strong>{itemCount}</strong>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-[#806e63]">
              <span>المجموع الفرعي</span>

              <span data-testid="text-subtotal">
                {formatPrice(total)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-[#806e63]">
              <span>الضريبة</span>
              <span>{formatPrice(0)}</span>
            </div>

            <div className="mt-4 border-t border-dashed border-[#d8cbc1] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-[#46342c]">
                  الإجمالي
                </span>

                <strong
                  className="text-2xl font-black text-[#713927]"
                  data-testid="text-invoice-total"
                >
                  {formatPrice(total)}
                </strong>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-black text-[#684a3e]">
                طريقة الدفع
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black transition-all ${
                    paymentMethod === "cash"
                      ? "border-[#713a24] bg-[#713a24] text-white shadow-md"
                      : "border-[#d7c9bf] bg-white text-[#74594c] hover:bg-[#f6eee8]"
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
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black transition-all ${
                    paymentMethod === "debt"
                      ? "border-[#713a24] bg-[#713a24] text-white shadow-md"
                      : "border-[#d7c9bf] bg-white text-[#74594c] hover:bg-[#f6eee8]"
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
                className="mt-4 space-y-3 rounded-xl border border-[#e1cbbd] bg-[#fff7f1] p-3"
                data-testid="debt-fields"
              >
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-[#70483b]"
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
                      className="h-10 border-[#d9bbae] bg-white"
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
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-[#70483b]"
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
                      className="h-10 border-[#d9bbae] bg-white pl-12 text-left font-mono"
                      dir="ltr"
                      data-testid="input-paid-amount"
                    />

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a18172]">
                      ر.س
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#ecd9cf] pt-3">
                  <span className="text-sm font-bold text-[#815446]">
                    المتبقي
                  </span>

                  <strong
                    className="text-[#a34f3c]"
                    data-testid="text-remaining-amount"
                  >
                    {formatPrice(remaining)}
                  </strong>
                </div>
              </div>
            )}

            {/* COMPLETE */}
            <Button
              onClick={completeSale}
              className="mt-5 h-13 w-full rounded-xl bg-[#713a24] text-base font-black text-white shadow-[0_7px_18px_rgba(113,58,36,0.22)] hover:bg-[#60301e]"
              data-testid="button-complete-sale"
            >
              <Check className="h-5 w-5" />
              إتمام البيع
              <ArrowLeft className="mr-auto h-4 w-4" />
            </Button>

            <p className="mt-3 text-center text-[10px] text-[#a18c81]">
              المبالغ محسوبة فورياً
            </p>
          </div>
        </aside>

        {/* PRODUCTS SIDE */}
        <main className="min-w-0 bg-[#f7f2e8] p-4 sm:p-6">
          {/* SEARCH + CATEGORIES */}
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#987a69]" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث عن منتج..."
                className="h-12 rounded-xl border-[#d5c6b8] bg-white pr-12 text-sm shadow-sm"
                aria-label="البحث عن منتج"
                data-testid="input-product-search"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-black transition-all ${
                    category === item
                      ? "bg-[#743d22] text-white shadow-md"
                      : "border border-[#d7c8ba] bg-white text-[#795646] hover:bg-[#f1e7dc]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#9b7663]">
                كتالوج المتجر
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#33251f]">
                اختر المنتجات
              </h2>
            </div>

            <span className="rounded-full bg-[#ead9c9] px-3 py-1.5 text-xs font-black text-[#74462f]">
              {filteredProducts.length} منتجات
            </span>
          </div>

          {/* PRODUCTS */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredProducts.map((product) => {
                const line = cart.find(
                  (item) => item.id === product.id,
                );

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="group relative overflow-hidden rounded-2xl border border-[#d8ccc0] bg-white text-right shadow-[0_4px_12px_rgba(75,45,29,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(75,45,29,0.13)] active:scale-[0.98]"
                    data-testid={`button-add-product-${product.id}`}
                  >
                    {/* IMAGE */}
                    <div className="relative m-2 h-[125px] overflow-hidden rounded-xl bg-[#e7dbcd]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-black/10" />

                      <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/25 text-white backdrop-blur-sm">
                        <ShoppingBasket className="h-4 w-4" />
                      </div>

                      {line && (
                        <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#fff3d2] px-2 text-xs font-black text-[#70412c] shadow">
                          {line.quantity}
                        </span>
                      )}
                    </div>

                    {/* NAME */}
                    <div className="px-3 pb-3">
                      <p className="line-clamp-1 text-sm font-black text-[#30241f]">
                        {product.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <strong className="text-sm font-black text-[#783d2b]">
                          {formatPrice(product.price)}
                        </strong>

                        <span className="text-[10px] text-[#927e72]">
                          متوفر {product.stock}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border border-dashed border-[#cbb9aa] bg-white py-20 text-center"
              data-testid="empty-product-results"
            >
              <Search className="mx-auto h-10 w-10 text-[#aa9383]" />

              <p className="mt-3 font-black text-[#594239]">
                لا توجد منتجات
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("الكل");
                }}
                className="mt-2 text-sm font-bold text-[#8b4935] underline"
                data-testid="button-clear-product-search"
              >
                عرض كل المنتجات
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d7c8ba] bg-white text-[#795646]"
              aria-label="تصغير"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d7c8ba] bg-white text-[#795646]"
              aria-label="تكبير"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d7c8ba] bg-white text-[#795646]"
              aria-label="عرض شبكي"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}
