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
  const [cart, setCart] = useState<CartLine[]>([{
    ...PRODUCTS[0],
    quantity: 1,
  }]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");
    if (!term) return PRODUCTS;
    return PRODUCTS.filter((product) =>
      `${product.name} ${product.category}`.toLocaleLowerCase("ar").includes(term),
    );
  }, [search]);

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const paid = paymentMethod === "debt" ? Math.max(0, Number(paidAmount) || 0) : total;
  const remaining = Math.max(0, total - paid);

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.id === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, line.stock) }
            : line,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, direction: "increase" | "decrease") => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.id !== id) return line;
          const nextQuantity =
            direction === "increase"
              ? Math.min(line.quantity + 1, line.stock)
              : line.quantity - 1;
          return { ...line, quantity: nextQuantity };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (id: number) => {
    setCart((current) => current.filter((line) => line.id !== id));
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
        description: "أضف منتجاً واحداً على الأقل قبل إتمام البيع.",
        variant: "destructive",
      });
      return;
    }
    if (paymentMethod === "debt" && !customerId) {
      toast({
        title: "اختر الزبون أولاً",
        description: "الفاتورة الآجلة تحتاج إلى ربطها بحساب زبون.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "تم تسجيل البيع تجريبياً",
      description: "لم يتم الحفظ في قاعدة البيانات. هذه الفاتورة محلية للمعاينة فقط.",
    });
    startNewSale();
  };

  return (
    <section dir="rtl" className="space-y-6 pb-10" data-testid="page-admin-sales">
      <header className="flex flex-col gap-4 border-b border-[#dbcdbd] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#a0563e]">
            <span className="h-2 w-2 rounded-full bg-[#c56648]" />
            نقطة البيع / وردية الصباح
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#2e211e] md:text-4xl">
            مبيعات اليوم
          </h1>
          <p className="mt-2 text-sm text-[#76645b]">{formatTime()} · سجل البيع السريع</p>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#b99583] bg-[#fbf4e9] text-[#6e372d] hover:bg-[#f4e5d5] sm:w-auto"
          onClick={startNewSale}
          data-testid="button-new-sale"
        >
          <RotateCcw className="h-4 w-4" />
          بيع جديد
        </Button>
      </header>

      <div
        className="flex items-start gap-3 rounded-xl border border-[#e2c59f] bg-[#fff7df] px-4 py-3 text-sm text-[#704d2b]"
        role="status"
        data-testid="status-local-mode"
      >
        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e4b66e] text-[11px] font-black text-[#54351e]">
          !
        </span>
        <p>
          <strong className="font-extrabold">وضع التجربة:</strong> المبيعات الحالية محفوظة
          محلياً داخل الشاشة فقط، ولن تُرسل إلى النظام.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9c7467]">
                كتالوج المتجر
              </p>
              <h2 className="mt-1 text-xl font-black text-[#342420]">اختر المنتجات</h2>
            </div>
            <span className="rounded-full bg-[#ead7c8] px-3 py-1.5 text-xs font-bold text-[#744636]">
              {filteredProducts.length} منتجات
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a27b6b]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن منتج بالاسم..."
              className="h-12 rounded-xl border-[#d8c4b4] bg-[#fcf8f1] pr-12 text-base shadow-[0_5px_16px_rgba(92,51,23,0.04)] placeholder:text-[#aa978b]"
              aria-label="البحث عن منتج"
              data-testid="input-product-search"
            />
          </div>

          {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredProducts.map((product) => {
                const line = cart.find((item) => item.id === product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    className="group relative overflow-hidden rounded-2xl border border-[#e3d5c7] bg-[#fcf8f1] p-3 text-right shadow-[0_6px_18px_rgba(74,42,29,0.05)] transition-transform hover:-translate-y-0.5 hover:border-[#bb836d] active:translate-y-0"
                    onClick={() => addProduct(product)}
                    data-testid={`button-add-product-${product.id}`}
                  >
                    <div className={`mb-3 flex h-20 items-end justify-between rounded-xl bg-gradient-to-br ${product.tone} p-3 text-[#fff3df]`}>
                      <span className="text-2xl font-black tracking-tight">{product.shortCode}</span>
                      <ShoppingBasket className="h-5 w-5 opacity-75" />
                    </div>
                    <p className="line-clamp-1 text-sm font-extrabold text-[#382824]">{product.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-[#9c4e3b]">{formatPrice(product.price)}</span>
                      <span className="text-[11px] text-[#8c786d]">متوفر {product.stock}</span>
                    </div>
                    {line && (
                      <span className="absolute left-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f7e8bd] px-1.5 text-xs font-black text-[#76432e]">
                        {line.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#cdb6a5] bg-[#fbf5ec] px-6 py-14 text-center" data-testid="empty-product-results">
              <Search className="mx-auto h-8 w-8 text-[#b39483]" />
              <p className="mt-3 font-bold text-[#543c34]">لا توجد منتجات بهذا الاسم</p>
              <button
                type="button"
                className="mt-2 text-sm font-bold text-[#a2513f] underline underline-offset-4"
                onClick={() => setSearch("")}
                data-testid="button-clear-product-search"
              >
                عرض كامل الكتالوج
              </button>
            </div>
          )}
        </div>

        <aside className="overflow-hidden rounded-2xl border border-[#d8c4b4] bg-[#fcf8f1] shadow-[0_14px_32px_rgba(74,42,29,0.08)]">
          <div className="border-b border-[#e3d5c7] bg-[#f5eadc] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#704033] text-[#fff3e1]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-[#342420]">الفاتورة الحالية</h2>
                  <p className="text-xs text-[#8c6f62]">{itemCount} أصناف · محلية</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#9c7467]">#LOCAL-024</span>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto px-5" data-testid="cart-lines">
            {cart.length ? (
              <div className="divide-y divide-[#eadfd4]">
                {cart.map((line) => (
                  <div className="py-4" key={line.id} data-testid={`row-cart-product-${line.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#382824]">{line.name}</p>
                        <p className="mt-1 text-xs text-[#967e72]">{formatPrice(line.price)} للوحدة</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-[#b27a6b] transition-colors hover:bg-[#f5e0d8] hover:text-[#9e4637]"
                        onClick={() => removeLine(line.id)}
                        aria-label={`حذف ${line.name}`}
                        data-testid={`button-remove-product-${line.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-[#d9c7b9] bg-[#fffaf3]">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center text-[#77483b] hover:bg-[#f3e4d7]"
                          onClick={() => updateQuantity(line.id, "decrease")}
                          aria-label={`إنقاص كمية ${line.name}`}
                          data-testid={`button-decrease-quantity-${line.id}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-black text-[#3b2924]" data-testid={`text-quantity-${line.id}`}>
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center text-[#77483b] hover:bg-[#f3e4d7]"
                          onClick={() => updateQuantity(line.id, "increase")}
                          aria-label={`زيادة كمية ${line.name}`}
                          data-testid={`button-increase-quantity-${line.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-[#6f372d]" data-testid={`text-line-total-${line.id}`}>
                        {formatPrice(line.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-14 text-center" data-testid="empty-cart">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e2d3] text-[#a77d6b]">
                  <ShoppingBasket className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-[#654a40]">الفاتورة جاهزة</p>
                <p className="mt-1 text-xs text-[#998278]">اختر منتجاً من الكتالوج لإضافته</p>
              </div>
            )}
          </div>

          <div className="border-t border-[#e3d5c7] bg-[#fffaf3] px-5 py-4">
            <div className="flex items-center justify-between text-sm text-[#806b60]">
              <span>المجموع الفرعي</span>
              <span data-testid="text-subtotal">{formatPrice(total)}</span>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-dashed border-[#dfcfc0] pt-3">
              <span className="font-bold text-[#503a32]">إجمالي الفاتورة</span>
              <strong className="text-2xl font-black tracking-tight text-[#6f372d]" data-testid="text-invoice-total">
                {formatPrice(total)}
              </strong>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-extrabold text-[#684b40]">طريقة الدفع</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-extrabold transition-colors ${
                    paymentMethod === "cash"
                      ? "border-[#87503e] bg-[#87503e] text-[#fff6e8]"
                      : "border-[#d9c7b9] bg-[#fdf8f0] text-[#76584b] hover:bg-[#f5e7da]"
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="h-4 w-4" />
                  نقدي
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-extrabold transition-colors ${
                    paymentMethod === "debt"
                      ? "border-[#87503e] bg-[#87503e] text-[#fff6e8]"
                      : "border-[#d9c7b9] bg-[#fdf8f0] text-[#76584b] hover:bg-[#f5e7da]"
                  }`}
                  onClick={() => setPaymentMethod("debt")}
                  data-testid="button-payment-debt"
                >
                  <WalletCards className="h-4 w-4" />
                  دين
                </button>
              </div>
            </div>

            {paymentMethod === "debt" && (
              <div className="mt-4 space-y-3 rounded-xl border border-[#e2c8b8] bg-[#fff5ef] p-3" data-testid="debt-fields">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#70473b]" htmlFor="customer-select">
                    الزبون
                  </label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger id="customer-select" className="h-10 border-[#d9b9a8] bg-[#fffaf5]" data-testid="select-debt-customer">
                      <SelectValue placeholder="اختر حساب الزبون" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {CUSTOMERS.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <span>{customer.name}</span>
                          <span className="mr-2 text-xs text-[#a18172]">· {customer.detail}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#70473b]" htmlFor="paid-amount">
                    المدفوع الآن
                  </label>
                  <div className="relative">
                    <Input
                      id="paid-amount"
                      type="number"
                      min="0"
                      step="0.25"
                      value={paidAmount}
                      onChange={(event) => setPaidAmount(event.target.value)}
                      placeholder="0.00"
                      className="h-10 border-[#d9b9a8] bg-[#fffaf5] pl-12 text-left font-mono"
                      dir="ltr"
                      data-testid="input-paid-amount"
                    />
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a18172]">ر.س</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#ecd8cc] pt-3 text-sm">
                  <span className="font-bold text-[#845648]">المتبقي</span>
                  <span className="font-black text-[#a34f3c]" data-testid="text-remaining-amount">{formatPrice(remaining)}</span>
                </div>
              </div>
            )}

            <Button
              className="mt-5 h-12 w-full rounded-xl bg-[#6e382f] text-base font-black text-[#fff7e9] shadow-[0_8px_18px_rgba(110,56,47,0.2)] hover:bg-[#5e2d27]"
              onClick={completeSale}
              data-testid="button-complete-sale"
            >
              <Check className="h-5 w-5" />
              إتمام البيع
              <ArrowLeft className="mr-auto h-4 w-4" />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#a08779]">
              <Calculator className="h-3.5 w-3.5" />
              المبالغ محسوبة محلياً بشكل فوري
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}