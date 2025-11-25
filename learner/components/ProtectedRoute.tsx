"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // "student" | "admin" | "secretary" etc.
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userData");

      let user = null;
      if (stored) {
        user = JSON.parse(stored);
      }

      // If no user → force login
      if (!user) {
        router.replace("/login");
        return;
      }

      // 🔥 Normalize role (studentType comes from your backend)
      const role = user.studentType || user.role;

      // 🔥 Allow secretary to count as student
      if (requiredRole === "student") {
        if (role !== "student" && role !== "secretary") {
          router.replace("/login");
          return;
        }
      } else if (requiredRole && role !== requiredRole) {
        // For any other requiredRole, use strict checking
        router.replace("/login");
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("Auth check error:", err);
      router.replace("/login");
    }
  }, [requiredRole, router]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-10">
        <p className="text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
