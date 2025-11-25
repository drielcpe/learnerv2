// app/student/components/app-sidebar.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  FlagIcon,
  LibraryBig,
  NotebookIcon,
  HomeIcon,
} from "lucide-react";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
  items?: NavItem[];
  disabled?: boolean;
}
const getNavItems = (studentType?: string): NavItem[] => {
  const baseNavItems: NavItem[] = [
    { title: "Dashboard", url: "/admin/dashboard", icon: HomeIcon },
    { title: "Payment Management", url: "/admin/payments", icon: NotebookIcon },
      { title: "Payment Methods", url: "/admin/payment-methods", icon: FlagIcon },
    { title: "Attendance Management", url: "/admin/attendance-management", icon: FlagIcon },
      { title: "Student Management", url: "/admin//student-management", icon: FlagIcon }
  ];

  return baseNavItems;
};


const secondaryNav = [
  { title: "Learner", url: "#", icon: LibraryBig },
];

export const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = (props) => {
  const [navMain, setNavMain] = React.useState<NavItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const pathname = usePathname();

  React.useEffect(() => {
    const role = (() => {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.studentType || parsed.role || "student";
        }
        return localStorage.getItem("userRole") || "student";
      } catch (err) {
        console.error("Failed to read user role:", err);
        return "student";
      }
    })();

    setNavMain(getNavItems(role));
    setLoading(false);
  }, []);

  return (
    <Sidebar className="top-[var(--header-height)] h-[calc(100svh-var(--header-height))]" {...props}>
      <SidebarContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <NavMain items={navMain} currentPath={pathname} />
            <NavSecondary items={secondaryNav} className="mt-auto" />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
