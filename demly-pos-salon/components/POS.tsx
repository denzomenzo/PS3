"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserId } from "@/hooks/useUserId";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import {
  Trash2,
  Loader2,
  Search,
  ShoppingCart,
  CreditCard,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  icon: string;
  barcode?: string | null;
  sku?: string | null;
  track_inventory: boolean;
  stock_quantity: number;
}

interface Staff {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
}

interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

interface ParkedSale {
  id: string;
  cart: CartItem[];
  staffId: string;
  customerId: string;
  paymentMethod: PaymentMethod;
}

type PaymentMethod =
  | "cash"
  | "card"
  | "card_terminal"
  | "contactless"
  | "mobile"
  | "other";

export default function POS() {
  const userId = useUserId();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [staffId, setStaffId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  // ✅ PARKED SALES
  const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const product = products.find(
        (p) => p.barcode === barcode || p.sku === barcode
      );
      if (product) addToCart(product);
    },
    [products]
  );

  useBarcodeScanner({
    enabled: true,
    onScan: handleBarcodeScan,
  });

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  useEffect(() => {
    if (!searchQuery.trim()) return setFilteredProducts(products);
    const q = searchQuery.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, products]);

  const loadData = async () => {
    setLoading(true);

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId);

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", userId);

    const { data: customersData } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId);

    setProducts(productsData || []);
    setFilteredProducts(productsData || []);
    setStaff(staffData || []);
    setCustomers(customersData || []);
    setLoading(false);
  };

  // ✅ CART
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );

      return [
        ...prev,
        {
          ...product,
          cartId: `${product.id}-${Date.now()}`,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (cartId: string, q: number) => {
    if (q <= 0)
      return setCart((p) => p.filter((i) => i.cartId !== cartId));
    setCart((p) =>
      p.map((i) => (i.cartId === cartId ? { ...i, quantity: q } : i))
    );
  };

  const subtotal = cart.reduce(
    (a, b) => a + b.price * b.quantity,
    0
  );
  const vat = vatEnabled ? subtotal * 0.2 : 0;
  const total = subtotal + vat;

  const resetSale = () => {
    setCart([]);
    setStaffId("");
    setCustomerId("");
    setPaymentMethod("cash");
    setActiveSaleId(null);
  };

  // ✅ PARK SALE
  const parkSale = () => {
    if (!cart.length) return alert("Nothing to park.");

    const id = `sale-${Date.now()}`;

    setParkedSales((p) => [
      ...p,
      {
        id,
        cart,
        staffId,
        customerId,
        paymentMethod,
      },
    ]);

    resetSale();
  };

  // ✅ RESUME SALE
  const resumeSale = (sale: ParkedSale) => {
    setCart(sale.cart);
    setStaffId(sale.staffId);
    setCustomerId(sale.customerId);
    setPaymentMethod(sale.paymentMethod);
    setActiveSaleId(sale.id);

    setParkedSales((p) => p.filter((s) => s.id !== sale.id));
  };

  // ✅ DISCARD
  const discardSale = (id: string) => {
    setParkedSales((p) => p.filter((s) => s.id !== id));
  };

  // ✅ CHECKOUT
  const handleCheckout = async () => {
    if (!cart.length) return alert("Cart is empty");

    setCheckingOut(true);

    const productsPayload = cart.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      staff_id: staffId ? Number(staffId) : null,
      customer_id: customerId ? Number(customerId) : null,
      products: productsPayload,
      subtotal,
      vat,
      total,
      payment_method: paymentMethod,
    });

    if (error) {
      setCheckingOut(false);
      return alert(error.message);
    }

    // ✅ STOCK DECREMENT
    const updates = cart
      .filter((i) => i.track_inventory)
      .map((i) =>
        supabase
          .from("products")
          .update({ stock_quantity: i.stock_quantity - i.quantity })
          .eq("id", i.id)
      );

    await Promise.all(updates);

    alert("✅ Payment successful");

    resetSale();
    await loadData();
    setCheckingOut(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  return (
    <div className="p-6 text-white grid grid-cols-[3fr,1.2fr] gap-6">

      {/* PRODUCTS */}
      <div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full mb-4 p-3 rounded bg-slate-800"
        />

        <div className="grid grid-cols-4 gap-3">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.track_inventory && p.stock_quantity <= 0}
              className="p-4 bg-slate-800 rounded"
            >
              <div>{p.icon}</div>
              <div>{p.name}</div>
              <div>£{p.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CART */}
      <div className="bg-slate-900 p-4 rounded flex flex-col">
        <h2 className="mb-3 flex justify-between">
          Cart
          <button onClick={parkSale} className="text-yellow-400">
            <PauseCircle />
          </button>
        </h2>

        <div className="flex-1 overflow-y-auto">
          {cart.map((i) => (
            <div key={i.cartId} className="flex justify-between mb-2">
              <span>{i.name}</span>
              <div className="flex gap-2">
                <button onClick={() => updateQuantity(i.cartId, i.quantity - 1)}>
                  <Minus />
                </button>
                {i.quantity}
                <button onClick={() => updateQuantity(i.cartId, i.quantity + 1)}>
                  <Plus />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div>Subtotal: £{subtotal.toFixed(2)}</div>
          <div>VAT: £{vat.toFixed(2)}</div>
          <div className="font-bold">Total: £{total.toFixed(2)}</div>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
            className="w-full mt-2 bg-slate-800 p-2 rounded"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="card_terminal">Terminal</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="mt-3 p-3 w-full bg-emerald-600 rounded"
          >
            {checkingOut ? "Processing..." : "Checkout"}
          </button>
        </div>
      </div>

      {/* ✅ PARKED SALES PANEL */}
      {parkedSales.length > 0 && (
        <div className="fixed bottom-4 right-6 bg-slate-900 p-4 rounded-xl w-64">
          <h3 className="font-bold mb-2">Parked Sales</h3>
          {parkedSales.map((s) => (
            <div key={s.id} className="flex justify-between mb-2">
              <span>£{s.cart.reduce((a, b) => a + b.price * b.quantity, 0)}</span>
              <div className="flex gap-2">
                <button onClick={() => resumeSale(s)}>
                  <PlayCircle />
                </button>
                <button onClick={() => discardSale(s.id)}>
                  <XCircle />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
