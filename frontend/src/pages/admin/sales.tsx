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
  Check,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBasket,
  Trash2,
  WalletCards,
  X,
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
    image: "https://picsum.photos/seed/cardamom-beanzayn/500/400",
    shortCode: "هـ",
  },
  {
    id: 2,
    name: "بن كولومبي وسط",
    category: "بن مختص",
    price: 38,
    stock: 2,
    image: "https://picsum.photos/seed/colombian-beanzayn/500/400",
    shortCode: "ك و",
  },
  {
    id: 3,
    name: "قهوة عربية محمصة",
    category: "قهوة",
    price: 24.5,
    stock: 2,
    image: "https://picsum.photos/seed/arabic-coffee-beanzayn/500/400",
    shortCode: "ق ع",
  },
  {
    id: 4,
    name: "تمر سكري فاخر",
    category: "ضيافة",
    price: 18.5,
    stock: 2,
    image: "https://picsum.photos/seed/dates-beanzayn/500/400",
    shortCode: "ت س",
  },
  {
    id: 5,
    name: "بن إثيوبي مزهر",
    category: "بن مختص",
    price: 44.5,
    stock: 2,
    image: "https://picsum.photos/seed/ethiopian-beanzayn/500/400",
    shortCode: "إ",
  },
  {
    id: 6,
    name: "قهوة تركية ناعمة",
    category: "قهوة",
    price: 21.9,
    stock: 1,
    image: "https://picsum.photos/seed/turkish-coffee-beanzayn/500/400",
    shortCode: "ت",
  },
  {
    id: 7,
    name: "عسل السدر",
    category: "ضيافة",
    price: 89,
    stock: 4,
    image: "https://picsum.photos/seed/sidr-honey-beanzayn/500/400",
    shortCode: "ع س",
  },
  {
    id: 8,
    name: "عسل الزهور",
    category: "ضيافة",
    price: 75,
    stock: 5,
    image: "https://picsum.photos/seed/flower-honey-beanzayn/500/400",
    shortCode: "ع ز",
  },
  {
    id: 9,
    name: "بن برازيلي محمصة",
    category: "بن مختص",
    price: 36,
    stock: 3,
    image: "https://picsum.photos/seed/brazilian-beanzayn/500/400",
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

const CATEGORIES = [
  "الكل",
  "قهوة",
  "بن مختص",
  "إضافات",
  "ضيافة",
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
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase("ar");

    return PRODUCTS.filter((product) => {
      const matchesCategory =
        category === "الكل" ||
        product.category === category;

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
    (sum, line) =>
      sum + line.price * line.quantity,
    0,
  );

  const paid =
    paymentMethod === "debt"
      ? Math.max(0, Number(paidAmount) || 0)
      : total;

  const remaining = Math.max(
    0,
    total - paid,
  );

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
              ? Math.min(
                  line.quantity + 1,
                  line.stock,
                )
              : line.quantity - 1;

          return {
            ...line,
            quantity: nextQuantity,
          };
        })
        .filter(
          (line) => line.quantity > 0,
        ),
    );
  };

  const removeLine = (id: number) => {
    setCart((current) =>
      current.filter(
        (line) => line.id !== id,
      ),
    );
  };

  const startNewSale = () => {
    setCart([]);
    setPaymentMethod("cash");
    setCustomerId("");
    setPaidAmount("");
    setSearch("");
    setCategory("الكل");
    setCartOpen(false);
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

    if (
      paymentMethod === "debt" &&
      !customerId
    ) {
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

  /*
   * INVOICE
   */
  const invoicePanel = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#eadfd4] bg-[#fbf6ed] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#3c2921]">
              الفاتورة الحالية
            </h2>

            <p className="mt-1 text-xs text-[#9b8273]">
              {itemCount} قطعة
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCart([])}
              className="rounded-xl p-2 text-[#8c6d5e] hover:bg-[#f1e4d8]"
              aria-label="تفريغ الفاتورة"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setCartOpen(false)
              }
              className="rounded-xl p-2 text-[#8c6d5e] hover:bg-[#f1e4d8] lg:hidden"
              aria-label="إغلاق الفاتورة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5"
        data-testid="cart-lines"
      >
        {cart.length ? (
          <div className="divide-y divide-[#eee5dc]">
            {cart.map((line) => (
              <div
                key={line.id}
                className="py-5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={line.image}
                    alt={line.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#3b2922]">
                      {line.name}
                    </p>

                    <p className="mt-1 text-xs text-[#9a8274]">
                      {formatPrice(line.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeLine(line.id)
                    }
                    className="rounded-lg p-1.5 text-[#a67e6d]"
                    aria-label={`حذف ${line.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex overflow-hidden rounded-xl border border-[#d8c9bc] bg-[#fcf9f5]">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          line.id,
                          "decrease",
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center text-[#71422f]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="flex min-w-9 items-center justify-center text-sm font-black">
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
                      className="flex h-9 w-9 items-center justify-center text-[#71422f]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <strong className="text-sm font-black text-[#713a24]">
                    {formatPrice(
                      line.price *
                        line.quantity,
                    )}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e6da] text-[#a07d6a]">
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

      <div className="border-t border-[#e3d6cb] bg-[#fffdf9] px-5 py-5">
        <div className="flex justify-between text-sm text-[#806e63]">
          <span>عدد القطع</span>
          <strong>{itemCount}</strong>
        </div>

        <div className="mt-3 flex justify-between text-sm text-[#806e63]">
          <span>المجموع الفرعي</span>
          <span>{formatPrice(total)}</span>
        </div>

        <div className="mt-3 flex justify-between text-sm text-[#806e63]">
          <span>الضريبة</span>
          <span>{formatPrice(0)}</span>
        </div>

        <div className="mt-4 border-t border-dashed border-[#d9cbbf] pt-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-[#46342c]">
              الإجمالي
            </span>

            <strong className="text-2xl font-black text-[#713927]">
              {formatPrice(total)}
            </strong>
          </div>
        </div>

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
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black ${
                paymentMethod === "cash"
                  ? "border-[#713a24] bg-[#713a24] text-white"
                  : "border-[#d7c9bf] bg-white text-[#74594c]"
              }`}
            >
              <Banknote className="h-4 w-4" />
              نقدي
            </button>

            <button
              type="button"
              onClick={() =>
                setPaymentMethod("debt")
              }
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black ${
                paymentMethod === "debt"
                  ? "border-[#713a24] bg-[#713a24] text-white"
                  : "border-[#d7c9bf] bg-white text-[#74594c]"
              }`}
            >
              <WalletCards className="h-4 w-4" />
              دين
            </button>
          </div>
        </div>

        {paymentMethod === "debt" && (
          <div className="mt-4 space-y-3 rounded-xl border border-[#e1cbbd] bg-[#fff7f1] p-3">
            <div>
              <label
                className="mb-1.5 block text-xs font-bold text-[#70483b]"
                htmlFor="customer-select"
              >
                الزبون
              </label>

              <Select
                value={customerId}
                onValueChange={
                  setCustomerId
                }
              >
                <SelectTrigger
                  id="customer-select"
                  className="h-10 bg-white"
                >
                  <SelectValue placeholder="اختر حساب الزبون" />
                </SelectTrigger>

                <SelectContent dir="rtl">
                  {CUSTOMERS.map(
                    (customer) => (
                      <SelectItem
                        key={customer.id}
                        value={
                          customer.id
                        }
                      >
                        {customer.name}
                      </SelectItem>
                    ),
                  )}
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
                dir="ltr"
                className="h-10 bg-white text-left font-mono"
              />
            </div>

            <div className="flex justify-between border-t border-[#ecd9cf] pt-3">
              <span className="text-sm font-bold text-[#815446]">
                المتبقي
              </span>

              <strong className="text-[#a34f3c]">
                {formatPrice(remaining)}
              </strong>
            </div>
          </div>
        )}

        <Button
          onClick={completeSale}
          className="mt-5 h-13 w-full rounded-xl bg-[#713a24] text-base font-black text-white hover:bg-[#60301e]"
        >
          <Check className="h-5 w-5" />
          إتمام البيع
          <ArrowLeft className="mr-auto h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f5ecd9] text-[#30231e]"
      data-testid="page-admin-sales"
    >
      {/* MOBILE / DESKTOP HEADER */}

      <div className="mx-auto max-w-[1500px] px-3 pt-4 sm:px-6 lg:pt-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#713a24] text-white shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-[#967866]">
                متجر بن الزين
              </p>

              <h1 className="text-2xl font-black text-[#33251f]">
                نقطة البيع
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewSale}
            className="hidden items-center gap-2 rounded-xl border border-[#d9c9bb] bg-white px-4 py-2.5 text-sm font-bold text-[#74462f] shadow-sm hover:bg-[#f8f0e7] sm:flex"
          >
            <RotateCcw className="h-4 w-4" />
            بيع جديد
          </button>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* PRODUCTS */}

          <main className="min-w-0">
            {/* SEARCH */}

            <div className="relative">
              <Search className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#9a7f70]" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="إبحث عن منتج..."
                className="h-[60px] rounded-[18px] border border-[#d8cab9] bg-white pr-14 text-base text-[#59463c] shadow-[0_2px_7px_rgba(72,45,28,0.08)] placeholder:text-[#9d897c]"
                aria-label="البحث عن منتج"
              />
            </div>

            {/* CATEGORIES */}

            <div className="mt-4 overflow-hidden">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setCategory(
                          item,
                        )
                      }
                      className={`shrink-0 rounded-[18px] px-7 py-3.5 text-base font-black transition-all ${
                        category === item
                          ? "bg-[#743d22] text-white shadow-[0_5px_12px_rgba(115,61,34,0.22)]"
                          : "border border-[#d7c8ba] bg-white text-[#76594a] hover:bg-[#f8f0e7]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-0 h-[6px] w-full bg-[#c9c1b7]" />
            </div>

            {/* TITLE */}

            <div className="mt-7 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#9b7663]">
                  كتالوج المتجر
                </p>

                <h2 className="mt-1 text-[30px] font-black leading-tight text-[#33251f] sm:text-[34px]">
                  اختر المنتجات
                </h2>
              </div>

              <span className="rounded-full bg-[#ead9c9] px-5 py-2.5 text-sm font-black text-[#74462f]">
                {filteredProducts.length} منتجات
              </span>
            </div>

            {/* PRODUCT GRID */}

            {filteredProducts.length >
            0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3">
                {filteredProducts.map(
                  (product) => {
                    const line =
                      cart.find(
                        (item) =>
                          item.id ===
                          product.id,
                      );

                    const soldOut =
                      product.stock <=
                      0;

                    return (
                      <button
                        key={
                          product.id
                        }
                        type="button"
                        disabled={
                          soldOut
                        }
                        onClick={() =>
                          addProduct(
                            product,
                          )
                        }
                        className="group relative overflow-hidden rounded-[25px] border border-[#d8cec4] bg-white p-2.5 text-right shadow-[0_4px_12px_rgba(72,45,28,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(72,45,28,0.13)] active:scale-[0.98]"
                      >
                        {/* IMAGE */}

                        <div className="relative h-[155px] overflow-hidden rounded-[19px] bg-[#e5ddd3] sm:h-[175px]">
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="absolute inset-0 bg-black/5" />

                          {/* CART ICON */}

                          <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffffffdd] text-[#4c3327] shadow-sm backdrop-blur">
                            <ShoppingBasket className="h-5 w-5" />
                          </div>

                          {/* QUANTITY */}

                          {line && (
                            <span className="absolute left-3 top-3 flex h-9 min-w-9 items-center justify-center rounded-full bg-[#fff1d0] px-2 text-sm font-black text-[#6e3d27] shadow-md">
                              {line.quantity}
                            </span>
                          )}
                        </div>

                        {/* INFO */}

                        <div className="px-2 pb-2 pt-3">
                          <p className="line-clamp-1 text-[16px] font-black text-[#392820] sm:text-[17px]">
                            {
                              product.name
                            }
                          </p>

                          <div className="mt-2 flex items-end justify-between gap-2">
                            <strong className="whitespace-nowrap text-[16px] font-black text-[#743d2a] sm:text-[17px]">
                              {formatPrice(
                                product.price,
                              )}
                            </strong>

                            <span className="whitespace-nowrap text-[11px] text-[#927e72]">
                              متوفر{" "}
                              {
                                product.stock
                              }
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#cbb9aa] bg-white py-20 text-center">
                <Search className="mx-auto h-10 w-10 text-[#aa9383]" />

                <p className="mt-3 font-black text-[#594239]">
                  لا توجد منتجات
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory(
                      "الكل",
                    );
                  }}
                  className="mt-2 text-sm font-bold text-[#8b4935] underline"
                >
                  عرض كل المنتجات
                </button>
              </div>
            )}
          </main>

          {/* DESKTOP INVOICE */}

          <aside className="hidden min-h-0 lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[#e2d7cd] lg:bg-white lg:shadow-[0_6px_25px_rgba(65,40,25,0.07)]">
            {invoicePanel}
          </aside>
        </div>
      </div>

      {/* MOBILE FLOATING CART */}

      <button
        type="button"
        onClick={() =>
          setCartOpen(true)
        }
        className="fixed bottom-5 left-1/2 z-30 flex min-w-[235px] -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-[#743d22] px-5 py-3.5 text-white shadow-[0_8px_25px_rgba(105,54,30,0.38)] lg:hidden"
      >
        <div className="flex items-center gap-2">
          <ShoppingBasket className="h-6 w-6" />

          <span className="text-sm font-black">
            السلة
          </span>

          {itemCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ffb454] px-1.5 text-xs font-black text-[#4a2c12]">
              {itemCount}
            </span>
          )}
        </div>

        <strong className="text-base font-black">
          {formatPrice(total)}
        </strong>
      </button>

      {/* MOBILE BACKDROP */}

      {cartOpen && (
        <div
          onClick={() =>
            setCartOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      {/* MOBILE INVOICE */}

      <aside
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-[92%] max-w-[410px] flex-col bg-white shadow-[-8px_0_30px_rgba(45,25,15,0.18)] transition-transform duration-300 lg:hidden ${
          cartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {invoicePanel}
      </aside>
    </div>
  );
}
