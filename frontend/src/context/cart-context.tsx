import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/lib/api-client";

export interface FlavorQty {
  flavor: string;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight?: number;
  flavorBreakdown?: FlavorQty[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedWeight?: number, flavorBreakdown?: FlavorQty[]) => void;
  removeItem: (productId: number, selectedWeight?: number) => void;
  updateQuantity: (productId: number, quantity: number, selectedWeight?: number) => void;
  updateFlavorBreakdown: (productId: number, flavorBreakdown: FlavorQty[], selectedWeight?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("binalzain_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("binalzain_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number, selectedWeight?: number, flavorBreakdown?: FlavorQty[]) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedWeight === selectedWeight
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        if (flavorBreakdown && flavorBreakdown.length > 0) {
          const merged = [...(next[existingIndex].flavorBreakdown || [])];
          flavorBreakdown.forEach(fb => {
            const idx = merged.findIndex(m => m.flavor === fb.flavor);
            if (idx >= 0) merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + fb.quantity };
            else merged.push({ ...fb });
          });
          const totalQty = merged.reduce((s, f) => s + f.quantity, 0);
          next[existingIndex] = { ...next[existingIndex], flavorBreakdown: merged, quantity: totalQty };
        } else {
          next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        }
        return next;
      }
      const totalQty = flavorBreakdown && flavorBreakdown.length > 0
        ? flavorBreakdown.reduce((s, f) => s + f.quantity, 0)
        : quantity;
      return [...prev, { product, quantity: totalQty, selectedWeight, flavorBreakdown }];
    });
  };

  const removeItem = (productId: number, selectedWeight?: number) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.selectedWeight === selectedWeight))
    );
  };

  const updateQuantity = (productId: number, quantity: number, selectedWeight?: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedWeight === selectedWeight
          ? { ...i, quantity }
          : i
      )
    );
  };

  const updateFlavorBreakdown = (productId: number, flavorBreakdown: FlavorQty[], selectedWeight?: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId && i.selectedWeight === selectedWeight) {
          const totalQty = flavorBreakdown.reduce((s, f) => s + f.quantity, 0);
          return { ...i, flavorBreakdown, quantity: totalQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const unitPrice = i.selectedWeight && i.product.soldByWeight
      ? (i.selectedWeight / 1000) * i.product.price
      : i.product.price;
    return sum + unitPrice * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateFlavorBreakdown,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
