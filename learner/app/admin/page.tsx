"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from '@/components/ProtectedRoute';

type UserRole = "student" | "admin" | "secretary";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <ProtectedRoute requiredRole={"admin" as UserRole}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
