"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  Shield,
  LogOut,
  FileCheck,
  Flag,
  UserCheck,
  AlertCircle,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { isAuthenticated, user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  if (!mounted || !isAuthenticated || !pathname?.startsWith("/dashboard")) {
    return null;
  }

  const getUserMenuItems = () => {
    const commonItems = [
      {
        icon: <Home />,
        label: "Home",
        href: "/",
      },
      {
        icon: <LayoutDashboard />,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: <Users />,
        label: "Profile",
        href: "/dashboard/profile",
      },
      {
        icon: <Settings />,
        label: "Settings",
        href: "/dashboard/settings",
      },
      {
        icon: <AlertCircle />,
        label: "Support",
        href: "/dashboard/support",
      },
    ];

    const userItems = [
      {
        icon: <FileText />,
        label: "My Affidavits",
        href: "/dashboard/affidavits",
      },
    ];

    const issuerItems = [
      {
        icon: <FileText />,
        label: "Affidavit Requests",
        href: "/dashboard/affidavit-requests",
      },
      {
        icon: <FileCheck />,
        label: "Issued Affidavits",
        href: "/dashboard/issued-affidavits",
      },
      {
        icon: <Flag />,
        label: "Flagged Witnesses",
        href: "/dashboard/flagged-witnesses",
      },
    ];

    const adminItems = [
      {
        icon: <FileText />,
        label: "All Affidavits",
        href: "/dashboard/all-affidavits",
      },
      {
        icon: <Users />,
        label: "User Management",
        href: "/dashboard/users",
      },
      {
        icon: <UserCheck />,
        label: "Create User",
        href: "/dashboard/users/new",
      },
      {
        icon: <Shield />,
        label: "Issuer Requests",
        href: "/dashboard/issuer-requests",
      },
      {
        icon: <Flag />,
        label: "Flagged Witnesses",
        href: "/dashboard/flagged-witnesses",
      },
      {
        icon: <Users />,
        label: "Banned Users",
        href: "/dashboard/banned-users",
      },
    ];

    switch (user?.activeRole) {
      case "Admin":
        return [...commonItems, ...adminItems];
      case "Issuer":
        return [...commonItems, ...issuerItems];
      default:
        return [...commonItems, ...userItems];
    }
  };

  const menuItems = getUserMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        {open && (
          <div className="flex items-center gap-2 px-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AffidBlock</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => logout()}>
                  <button className="w-full flex items-center">
                    <LogOut />
                    <span>Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}