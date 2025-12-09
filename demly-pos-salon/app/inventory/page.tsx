"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserId } from "@/hooks/useUserId";
import { Plus, Edit2, Trash2, X, Loader2, ArrowLeft, Package, Search } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  is_service: boolean;
  icon: string;
  supplier: string | null;
}

export default function Inventory() {
  const userId = useUserId();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSKU, setFormSKU] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formThreshold, setFormThreshold] = useState("10");
  const [formTrackInventory, setFormTrackInventory] = useState(true);
  const [formIsService, setFormIsService] = useState(false);
  const [formIcon, setFormIcon] = useState("");
  const [formSupplier, setFormSupplier] = useState("");

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (data) setProducts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormSKU("");
    setFormBarcode("");
    setFormCategory("");
    setFormPrice("");
    setFormCost("");
    setFormStock("");
    setFormThreshold("10");
    setFormTrackInventory(true);
    setFormIsService(false);
    setFormIcon("");
    setFormSupplier("");
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormSKU(product.sku || "");
    setFormBarcode(product.barcode || "");
    setFormCategory(product.category || "");
    setFormPrice(product.price.toString());
    setFormCost(product.cost.toString());
    setFormStock(product.stock_quantity.toString());
    setFormThreshold(product.low_stock_threshold.toString());
    setFormTrackInventory(product.track_inventory);
    setFormIsService(product.is_service);
    setFormIcon(product.icon || "");
    setFormSupplier(product.supplier || "");
    setShowEditModal(true);
  };

  const addProduct = async () => {
    if (!formName || !formPrice) {
      alert("Name and Price are required");
      return;
    }

    const { error } = await supabase.from("products").insert({
      user_id: userId,
      name: formName,
      description: formDescription || null,
      sku: formSKU || null,
      barcode: formBarcode || null,
      category: formCategory || null,
      price: parseFloat(formPrice),
      cost: parseFloat(formCost) || 0,
      stock_quantity: parseInt(formStock) || 0,
      low_stock_threshold: parseInt(formThreshold),
      track_inventory: formTrackInventory,
      is_service: formIsService,
      icon: formIcon || null,
      supplier: formSupplier || null,
    });

    if (error) {
      alert("Error adding product: " + error.message);
      return;
    }

    setShowAddModal(false);
    loadData();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: formName,
        description: formDescription || null,
        sku: formSKU || null,
        barcode: formBarcode || null,
        category: formCategory || null,
        price: parseFloat(formPrice),
        cost: parseFloat(formCost) || 0,
        stock_quantity: parseInt(formStock) || 0,
        low_stock_threshold: parseInt(formThreshold),
        track_inventory: formTrackInventory,
        is_service: formIsService,
        icon: formIcon || null,
        supplier: formSupplier || null,
      })
      .eq("id", editingProduct.id);

    if (error) {
      alert("Error updating product");
      return;
    }

    setShowEditModal(false);
    loadData();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Error deleting product");
      return;
    }

    loadData();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-xl text-slate-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            Inventory
          </h1>
          <Link href="/" className="flex items-center gap-2 text-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
            Back to POS
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 pl-14 pr-4 py-4 rounded-xl text-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-xl"
            />
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <Package className="w-6 h-6 text-cyan-400" />
            {filteredProducts.length} Products & Services
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Package className="w-24 h-24 mx-auto mb-6 opacity-30" />
              <p className="text-2xl mb-2">No products yet</p>
              <p className="text-slate-500 mb-6">Add your first product to get started</p>
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Icon</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Name</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">SKU/Barcode</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Category</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Price</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Stock</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Type</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-4 text-3xl">{product.icon || "📦"}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-slate-400 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-slate-300">
                        {product.sku && <div>SKU: {product.sku}</div>}
                        {product.barcode && <div className="text-slate-400">{product.barcode}</div>}
                      </td>
                      <td className="py-4 px-4 text-slate-300">{product.category || "-"}</td>
                      <td className="py-4 px-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        £{product.price.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        {product.track_inventory ? (
                          <div>
                            <div className={`font-bold ${product.stock_quantity <= product.low_stock_threshold ? "text-red-400" : "text-emerald-400"}`}>
                              {product.stock_quantity}
                            </div>
                            <div className="text-xs text-slate-400">Min: {product.low_stock_threshold}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          product.is_service 
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}>
                          {product.is_service ? "Service" : "Product"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full border border-slate-700/50 max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">
                {showAddModal ? "Add Product/Service" : "Edit Product/Service"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-lg mb-2 font-medium text-slate-300">Name *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl text-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Product/Service name"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-lg mb-2 font-medium text-slate-300">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl text-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-lg mb-2 font-medium text-slate-300">Price * (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl text-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="19.99"
                />
              </div>

              <div>
                <label className="block text-lg mb-2 font-medium text-slate-300">Icon/Emoji</label>
                <input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl text-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="📦 or ✂️"
                />
              </div>

              <div className="col-span-2 flex items-center gap-6 bg-slate-800/30 p-4 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formTrackInventory}
                    onChange={(e) => setFormTrackInventory(e.target.checked)}
                    className="w-6 h-6 accent-cyan-500"
                  />
                  <span className="text-lg text-slate-300">Track Inventory</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsService}
                    onChange={(e) => setFormIsService(e.target.checked)}
                    className="w-6 h-6 accent-cyan-500"
                  />
                  <span className="text-lg text-slate-300">Is Service</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-4 rounded-xl text-lg font-bold text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? addProduct : updateProduct}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 py-4 rounded-xl text-lg font-bold text-white transition-all shadow-xl shadow-cyan-500/20"
              >
                {showAddModal ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}