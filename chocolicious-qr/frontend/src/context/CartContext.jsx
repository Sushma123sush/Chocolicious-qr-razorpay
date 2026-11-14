import { createContext, useContext, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

// A cart line is keyed by product id + variant id (or "base" when the
// product has no variants), so single/double or no-bake/baked options
// on the same product are tracked as separate lines.
function makeKey(productId, variantId) {
  return `${productId}:${variantId ?? "base"}`;
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState({}); // key -> line

  const setQuantity = useCallback((lineInfo, quantity) => {
    setLines((prev) => {
      const key = makeKey(lineInfo.productId, lineInfo.variantId);
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { ...lineInfo, key, quantity },
      };
    });
  }, []);

  const getQuantity = useCallback(
    (productId, variantId) => lines[makeKey(productId, variantId)]?.quantity ?? 0,
    [lines]
  );

  const clearCart = useCallback(() => setLines({}), []);

  const value = useMemo(() => {
    const items = Object.values(lines).sort((a, b) => a.productName.localeCompare(b.productName));
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { items, totalItems, totalPrice, setQuantity, getQuantity, clearCart };
  }, [lines, setQuantity, getQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
