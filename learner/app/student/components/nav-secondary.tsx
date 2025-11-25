// app/student/components/nav-secondary.tsx
"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface NavSecondaryProps {
  items: { title: string; url: string; icon: LucideIcon }[];
}

export const NavSecondary: React.FC<NavSecondaryProps & React.ComponentPropsWithoutRef<typeof SidebarGroup>> = ({
  items,
  ...props
}) => (
  <SidebarGroup {...props}>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild size="sm">
              <a href={item.url} className="flex items-center gap-2">
                <item.icon className="text-muted-foreground" />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);
