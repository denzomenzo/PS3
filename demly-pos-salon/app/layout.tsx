"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  TrendingUp,
  Monitor,
  Package,
  CreditCard,
  RotateCcw,
  Printer,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const navigation = [
  { name: "POS", href: "/", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Returns", href: "/returns", icon: RotateCcw },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Display", href: "/display", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Hardware", href: "/hardware", icon: Printer },
  { name: "Card Terminal", href: "/card-terminal", icon: CreditCard },
];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const publicPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/pay",
    "/success",
    "/activate",
  ];

  const isPublicPage = publicPages.includes(pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isPublicPage) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      
      {/* SIDEBAR - DARK GLASS-MORPHISM */}
      <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col shadow-2xl">
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            <h1 className="text-4xl font-black tracking-tight">
              Demly POS
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-2 font-medium">Point of Sale System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 font-semibold group ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border hover:border-slate-700/50"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"} transition-colors`} />
                <span className="text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border hover:border-red-500/30 transition-all duration-200 font-semibold group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - DARK WITH SUBTLE GRADIENT */}
      <main className="flex-1 overflow-auto bg-slate-950/50">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}