// app/student/components/app-sidebar.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  FlagIcon,
  LibraryBig,
  NotebookIcon,
  UserIcon,
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

const getNavItems = (role: string): NavItem[] => {
  const baseNav: NavItem[] = [
    { title: "Dashboard", url: "/student/dashboard", icon: BarChart3Icon },
    { title: "Payment", url: "/student/payments", icon: NotebookIcon },
    { title: "Attendance", url: "/student/attendance", icon: FlagIcon },
    { title: "Personal Information", url: "/student/personal-info", icon: UserIcon },
  ];

  if (role === "secretary") {
    return [
      ...baseNav.slice(0, 3),
      { title: "Attendance Console", url: "/student/attendance-management", icon: FlagIcon },
      ...baseNav.slice(3),
    ];
  }

  return baseNav;
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
