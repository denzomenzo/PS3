"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 mb-4">
            Demly POS
          </h1>
          <p className="text-2xl text-gray-300">
            Complete Business Management System
          </p>
          <p className="text-lg text-gray-400 mt-2">
            Perfect for Salons, Barbers, Retailers, Service Businesses & More
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">What's Included</h2>
            <ul className="space-y-4">
              {[
                "Complete POS System",
                "Customer Management",
                "Appointment Booking",
                "Sales Reports & Analytics",
                "Staff/Team Management",
                "Service & Pricing Control",
                "Customer Display Screen",
                "VAT/Tax Management",
                "White-Label Customization",
                "Unlimited Transactions",
                "Unlimited Customers",
                "Unlimited Staff",
                "Works for ANY Business Type",
                "Lifetime Updates",
                "Email Support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Purchase */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-lg mb-2">Lifetime Access</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-6xl font-black text-white">£299</span>
                  <span className="text-xl text-gray-400">one-time</span>
                </div>
                <p className="text-green-400 font-bold mt-2">Save £1,188/year vs monthly plans</p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-white mb-2 text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Your license key will be sent to this email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-bold py-6 rounded-xl transition disabled:opacity-50 text-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Purchase License - £299"
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Secure payment via Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Instant license delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>No monthly fees ever</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-3">Already have an account?</p>
              <Link
                href="/login"
                className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition font-bold text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Questions? Email us at support@demly.com</p>
        </div>
      </div>
    </div>
  );
}