import { useCart } from "@/context/cart-context";
import { useStoreStatus } from "@/context/store-status-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, Truck, Store, User, Phone, MapPin, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

const STORAGE_KEY = "binalzain_customer_info";

function loadSaved(): { name: string; phone: string; address: string; remember: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "", phone: "", address: "", remember: false };
}

export default function Cart() {
  const { items, updateQuantity, updateFlavorBreakdown, removeItem, totalPrice, clearCart } = useCart();
  const { status: storeStatus } = useStoreStatus();

  const saved = loadSaved();
  const [name, setName] = useState(saved.name);
  const [phone, setPhone] = useState(saved.phone);
  const [address, setAddress] = useState(saved.address);
  const [remember, setRemember] = useState(saved.remember);
  const [delivery, setDelivery] = useState<"home" | "pickup">(storeStatus === "pickup_only" ? "pickup" : "home");

  useEffect(() => {
    if (storeStatus === "pickup_only") setDelivery("pickup");
  }, [storeStatus]);

  useEffect(() => {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, phone, address, remember: true }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [name, phone, address, remember]);

  const handleWhatsAppCheckout = () => {
    const phoneNumber = "963962823756";

    let orderItems = "";
    items.forEach((item) => {
      const weightText = item.selectedWeight
        ? item.selectedWeight >= 1000
          ? `${item.selectedWeight / 1000} كيلو`
          : `${item.selectedWeight} غ`
        : null;

      if (item.flavorBreakdown && item.flavorBreakdown.length > 0) {
        const flavorText = item.flavorBreakdown.map(f => `${f.flavor} ×${f.quantity}`).join("، ");
        orderItems += `• ${item.product.nameAr}${weightText ? ` - ${weightText}` : ""} | النكهات: ${flavorText}\n`;
      } else {
        orderItems += `• ${item.product.nameAr}${weightText ? ` - ${weightText}` : ""} (الكمية: ${item.quantity})\n`;
      }
    });

    const deliveryMethod = delivery === "home" ? "توصيل للمنزل 🛵" : "استلام من المحل 🏪";

    let message = `☕ *متجر بن الزين | طلب جديد*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *بيانات الزبون:*\n`;
    message += `الاسم: ${name || "—"}\n`;
    message += `رقم الهاتف: ${phone || "—"}\n`;
    message += `العنوان: ${address || "—"}\n\n`;
    message += `🛒 *تفاصيل الطلب:*\n`;
    message += orderItems;
    message += `\n📦 *طريقة الاستلام:* ${deliveryMethod}\n`;
    message += `💰 *المجموع النهائي:* ${totalPrice.toLocaleString("ar-SY")} ل.س`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">سلة المشتريات فارغة</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          لم تقم بإضافة أي منتجات إلى سلة المشتريات بعد. اكتشف منتجاتنا المميزة.
        </p>
        <Button size="lg" className="font-bold px-8 text-lg" asChild>
          <Link href="/products">تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-4xl font-black text-primary mb-8">سلة المشتريات</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b border-border font-bold text-muted-foreground text-sm">
              <div className="col-span-6">المنتج</div>
              <div className="col-span-3 text-center">الكمية</div>
              <div className="col-span-2 text-left">المجموع</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-border">
              {items.map((item, index) => {
                const unitPrice =
                  item.selectedWeight && item.product.soldByWeight
                    ? (item.selectedWeight / 1000) * item.product.price
                    : item.product.price;
                const itemTotal = unitPrice * item.quantity;
                const hasFlavors = item.flavorBreakdown && item.flavorBreakdown.length > 0;

                return (
                  <div
                    key={`${item.product.id}-${item.selectedWeight}-${index}`}
                    className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-1 md:col-span-6 flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.nameAr} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">صورة</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{item.product.nameAr}</h3>
                        {item.selectedWeight && (
                          <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            الوزن: {item.selectedWeight >= 1000 ? `${item.selectedWeight / 1000} كيلو` : `${item.selectedWeight} غ`}
                          </p>
                        )}
                        {hasFlavors && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.flavorBreakdown!.map(fb => (
                              <div
                                key={fb.flavor}
                                className="flex items-center gap-1 rounded-lg border px-2 py-1"
                                style={{ backgroundColor: "#4A3525", borderColor: "#4A3525" }}
                              >
                                <button
                                  onClick={() => {
                                    const updated = item.flavorBreakdown!.map(f =>
                                      f.flavor === fb.flavor ? { ...f, quantity: Math.max(0, f.quantity - 1) } : f
                                    ).filter(f => f.quantity > 0);
                                    if (updated.length > 0) {
                                      updateFlavorBreakdown(item.product.id, updated, item.selectedWeight);
                                    } else {
                                      removeItem(item.product.id, item.selectedWeight);
                                    }
                                  }}
                                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                  style={{ color: "#F5EDD8" }}
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-xs font-bold min-w-[14px] text-center" style={{ color: "#F5EDD8" }}>{fb.quantity}</span>
                                <button
                                  onClick={() => {
                                    const updated = item.flavorBreakdown!.map(f =>
                                      f.flavor === fb.flavor ? { ...f, quantity: f.quantity + 1 } : f
                                    );
                                    updateFlavorBreakdown(item.product.id, updated, item.selectedWeight);
                                  }}
                                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                  style={{ color: "#F5EDD8" }}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-xs font-semibold mr-0.5" style={{ color: "#F5EDD8" }}>{fb.flavor}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-primary font-bold mt-1 md:hidden">
                          {itemTotal.toLocaleString("ar-SY")} ل.س
                        </p>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 flex items-center md:justify-center">
                      {hasFlavors ? (
                        <span className="text-sm font-bold text-muted-foreground">
                          الإجمالي: {item.quantity}
                        </span>
                      ) : (
                        <div className="flex items-center bg-background border border-border rounded-lg h-10">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedWeight)}
                            className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors rounded-r-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedWeight)}
                            className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors rounded-l-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="hidden md:block col-span-2 text-left font-black text-lg text-primary">
                      {itemTotal.toLocaleString("ar-SY")}{" "}
                      <span className="text-xs text-muted-foreground font-normal">ل.س</span>
                    </div>

                    <div className="col-span-1 text-left md:text-center absolute left-4 md:static">
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedWeight)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={clearCart} className="text-muted-foreground">
              إفراغ السلة
            </Button>
          </div>
        </div>

        {/* Order Summary + Customer Form */}
        <div className="lg:col-span-1 space-y-4">
          {/* Customer Information Form */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              بيانات الزبون
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="الاسم الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="رقم الهاتف"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10 h-11 rounded-xl font-sans"
                    type="tel"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                  عنوان التوصيل
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    placeholder="عنوان التوصيل"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-input bg-background pr-10 pl-3 py-2.5 text-sm font-medium text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  تذكرني (حفظ بياناتي للمرة القادمة)
                </span>
              </label>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-black text-foreground mb-4">طريقة الاستلام:</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => storeStatus !== "pickup_only" && setDelivery("home")}
                disabled={storeStatus === "pickup_only"}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  storeStatus === "pickup_only"
                    ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                    : delivery === "home"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Truck className="w-6 h-6" />
                توصيل للمنزل 🛵
              </button>
              <button
                onClick={() => setDelivery("pickup")}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  delivery === "pickup"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Store className="w-6 h-6" />
                استلام من المحل 🏪
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl shadow-md border border-border p-6 md:p-8 sticky top-28">
            <h2 className="text-2xl font-black border-b border-border pb-4 mb-6">ملخص الطلب</h2>

            <div className="space-y-4 mb-6 text-lg">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">عدد العناصر</span>
                <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-black text-xl text-primary pt-4 border-t border-border">
                <span>المجموع الكلي</span>
                <span>
                  {totalPrice.toLocaleString("ar-SY")}{" "}
                  <span className="text-sm font-medium text-muted-foreground">ل.س</span>
                </span>
              </div>
            </div>

            {storeStatus === "closed" ? (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 p-4 rounded-xl text-sm font-semibold mb-6 border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                المتجر مغلق حالياً، لا يمكن إتمام الطلبات في هذا الوقت.
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 p-4 rounded-xl text-sm font-medium mb-6 border border-green-200 dark:border-green-900/50">
                سيتم إرسال تفاصيل طلبك عبر واتساب لتأكيد العنوان ووقت التوصيل.
              </div>
            )}

            <Button
              size="lg"
              disabled={storeStatus === "closed"}
              className="w-full h-14 text-lg font-bold gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-[#25D366]/20 border-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleWhatsAppCheckout}
            >
              اطلب عبر واتساب
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
