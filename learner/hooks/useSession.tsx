// hooks/useSession.ts
"use client";
import { useEffect, useState } from "react";

export interface User {
  id: string;
  studentId?: string;
  name: string;
  role: "student" | "secretary" | "admin";
  [key: string]: any;
}

export const useSession = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined); 

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  return { user };
};
