"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
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
  category?: string | null;
}

interface Staff {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
}

interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

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
  const [hardwareSettings, setHardwareSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const product = products.find(
        (p) => p.barcode === barcode || p.sku === barcode
      );
      if (product) addToCart(product);
    },
    [products]
  );

  const { isScanning } = useBarcodeScanner({
    enabled: hardwareSettings?.barcode_scanner_enabled !== false,
    onScan: handleBarcodeScan,
    playSoundOnScan: hardwareSettings?.scanner_sound_enabled !== false,
  });

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadData = async () => {
    setLoading(true);

    const { data: settingsData } = await supabase
      .from("settings")
      .select("vat_enabled")
      .single();
    if (settingsData?.vat_enabled !== undefined)
      setVatEnabled(settingsData.vat_enabled);

    const { data: hardwareData } = await supabase
      .from("hardware_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (hardwareData) setHardwareSettings(hardwareData);

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (productsData) {
      setProducts(productsData);
      setFilteredProducts(productsData);
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (staffData) setStaff(staffData);

    const { data: customersData } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (customersData) setCustomers(customersData);

    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        { ...product, cartId: `${product.id}-${Date.now()}`, quantity: 1 },
      ]);
    }
  };

  const removeFromCart = (cartId: string) =>
    setCart(cart.filter((item) => item.cartId !== cartId));

  const updateQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(
        cart.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const vat = vatEnabled ? total * 0.2 : 0;
  const grandTotal = total + vat;

  const checkout = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    setCheckingOut(true);

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        staff_id: staffId ? parseInt(staffId) : null,
        customer_id: customerId ? parseInt(customerId) : null,
        services: [],
        products: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          icon: item.icon,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal: total,
        vat: vat,
        total: grandTotal,
      });

      if (error) throw error;

      alert(`✅ £${grandTotal.toFixed(2)} charged successfully!`);
      setCart([]);
      setStaffId("");
      setCustomerId("");
      loadData();
    } catch {
      alert("❌ Error processing transaction");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!userId) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-14 h-14 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Point of Sale</h1>
        </div>

        <div className="flex items-center gap-4">
          {staff.length > 0 && (
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="bg-slate-800/60 border border-slate-700/50 text-white px-4 py-3 rounded-xl"
            >
              <option value="">Staff</option>
              {staff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setCart([])}
            className="px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold"
          >
            New Sale
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 p-6">
        {/* PRODUCTS */}
        <div className="flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKU, or barcode..."
              className="w-full bg-slate-900/60 border border-slate-700/50 pl-14 pr-6 py-5 rounded-2xl text-white"
            />
            {isScanning && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">
                Scanner Active
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.track_inventory && product.stock_quantity <= 0}
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/40 transition-all text-left"
              >
                <div className="text-4xl mb-3">{product.icon}</div>
                <div className="font-bold text-white mb-1">
                  {product.name}
                </div>
                <div className="font-black text-emerald-400">
                  £{product.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="sticky top-28 h-fit bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl flex flex-col">
          <div className="p-6 border-b border-slate-800/50">
            <h2 className="text-2xl font-black text-white">Cart</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
            {cart.length === 0 ? (
              <p className="text-slate-500 text-center mt-10">
                Cart is empty
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl"
                >
                  <div>
                    <div className="text-white font-bold">{item.name}</div>
                    <div className="text-slate-400 text-sm">
                      £{item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.cartId, item.quantity - 1)
                      }
                      className="px-3 py-1 bg-slate-700 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.cartId, item.quantity + 1)
                      }
                      className="px-3 py-1 bg-slate-700 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="ml-2 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-slate-800/50 space-y-4">
            <div className="flex justify-between text-white font-bold">
              <span>Total</span>
              <span>£{grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={checkout}
              disabled={checkingOut || cart.length === 0}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 font-black text-white"
            >
              {checkingOut ? "Processing..." : `Charge £${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
