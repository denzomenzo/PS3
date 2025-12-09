"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import POS from "@/components/POS";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLicense, setHasLicense] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLicense();
  }, []);

  const checkAuthAndLicense = async () => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      setUserId(session.user.id);

      // Check if user has an active license
      const { data: license, error } = await supabase
        .from("licenses")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .single();

      if (error || !license) {
        // No active license found
        router.push("/activate");
        return;
      }

      setHasLicense(true);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
            <Loader2 className="w-20 h-20 animate-spin mx-auto text-cyan-400 relative z-10" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Demly POS
          </h2>
          <p className="text-slate-400 text-lg font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasLicense) {
    return null; // Router will redirect
  }

  // Return ONLY POS component, MainLayout is in layout.tsx
  return <POS />;
}