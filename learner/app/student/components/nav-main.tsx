// app/student/components/nav-main.tsx
"use client";

import * as React from "react";
import { ChevronRight} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NavItem } from "./app-sidebar";

interface NavMainProps {
  items: NavItem[];
  currentPath: string;
}

export const NavMain: React.FC<NavMainProps> = ({ items, currentPath }) => {
  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.items ? item.items.some(sub => isActive(sub.url)) : isActive(item.url)}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(item.url)} disabled={item.disabled}>
                <a
                  href={item.disabled ? "#" : item.url}
                  data-disabled={item.disabled}
                  className="data-[disabled=true]:opacity-50 flex items-center gap-2"
                >
                  <item.icon className="text-muted-foreground" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>

              {item.items && item.items.length > 0 && (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>{subItem.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
