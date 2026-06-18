import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator as CalcIcon, Scale } from "lucide-react";

export default function Calculator() {
  const [pricePerKg, setPricePerKg] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [unit, setUnit] = useState<"g" | "kg">("g");

  const calculateTotal = () => {
    if (pricePerKg === "" || weight === "") return 0;
    const w = unit === "g" ? weight / 1000 : weight;
    return w * pricePerKg;
  };

  const presetWeights = [
    { label: "250 غ", value: 250, unit: "g" as const },
    { label: "500 غ", value: 500, unit: "g" as const },
    { label: "1 كيلو", value: 1, unit: "kg" as const },
    { label: "2 كيلو", value: 2, unit: "kg" as const },
  ];

  return (
    <div className="container mx-auto px-4 py-16 min-h-[80vh] flex justify-center items-center">
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
        <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 40 40\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M20 20.5V18H0v-2h20v-2.5L22.5 16 25 13.5V0h2v13.5L29.5 16 32 18.5V20h8v2H32v2.5L29.5 27 27 29.5V40h-2V29.5L22.5 27 20 24.5V22H0v-2h20z\\' fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')]"></div>
          <CalcIcon className="w-16 h-16 mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-black relative z-10">حاسبة الوزن والأسعار</h1>
          <p className="text-primary-foreground/80 mt-2 relative z-10 font-medium">
            أداة سريعة لحساب سعر المنتجات المباعة بالوزن
          </p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          <div className="space-y-3">
            <label className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">1.</span> سعر الكيلو (ل.س)
            </label>
            <Input 
              type="number" 
              placeholder="مثال: 50000" 
              className="h-14 text-xl font-bold bg-background"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value ? Number(e.target.value) : "")}
            />
          </div>

          <div className="space-y-3">
            <label className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">2.</span> الوزن المطلوب
            </label>
            
            <div className="flex gap-4">
              <Input 
                type="number" 
                placeholder="أدخل الوزن" 
                className="h-14 text-xl font-bold bg-background flex-grow"
                value={weight}
                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
              />
              <div className="flex bg-muted p-1 rounded-lg border border-border shrink-0">
                <button
                  className={`px-4 font-bold rounded-md transition-colors ${unit === 'g' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setUnit("g")}
                >
                  غرام
                </button>
                <button
                  className={`px-4 font-bold rounded-md transition-colors ${unit === 'kg' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setUnit("kg")}
                >
                  كيلو
                </button>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm font-semibold text-muted-foreground mb-3">أوزان شائعة:</p>
              <div className="flex flex-wrap gap-2">
                {presetWeights.map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setWeight(p.value);
                      setUnit(p.unit);
                    }}
                    className="px-4 py-2 bg-background border border-border hover:border-primary hover:text-primary text-foreground font-bold rounded-xl transition-all hover:shadow-sm"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t-2 border-dashed border-border text-center">
            <h3 className="text-xl font-bold text-muted-foreground mb-2">السعر الإجمالي</h3>
            <div className="text-5xl font-black text-primary flex items-center justify-center gap-3">
              {calculateTotal().toLocaleString('ar-SY')} 
              <span className="text-2xl font-bold text-muted-foreground">ل.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
