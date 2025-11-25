"use client"

import { Fragment, useMemo,useState } from "react"
import { usePathname,useRouter } from "next/navigation"
import { SidebarIcon,LogOut } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
   const router = useRouter()
  // Faux breadcrumbs for demo.
  const breadcrumbs = useMemo(() => {
    return pathname
      .split("/")
      .filter((path) => path !== "")
      .map((path, index, array) => ({
        label: path,
        href: `/${array.slice(0, index + 1).join("/")}`,
      }))
  }, [pathname])
  const handleLogout = () => {
    const itemsToRemove = [
      "userRole",
      "userEmail", 
      "studentId",
      "studentName",
      "userData",
      "authToken",
      "sessionId"
    ];
    
    itemsToRemove.forEach(item => localStorage.removeItem(item));
    
    console.log("✅ Logged out successfully, localStorage cleared")
    
 
    setLogoutDialogOpen(false)
    
    router.push("/login")
  }

  return (
    <header
      data-slot="site-header"
      className="bg-background sticky top-0 z-50 flex w-full items-center border-b"
    >
      <div className="flex h-(--header-height) w-full items-center gap-2 px-2 pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="gap-2.5 has-[>svg]:px-2"
        >
          <SidebarIcon />
          <span className="truncate font-medium">Learner</span>
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="capitalize">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.map((breadcrumb, index) =>
              index === breadcrumbs.length - 1 ? (
                <BreadcrumbItem key={index}>
                  <BreadcrumbPage className="capitalize">
                    {breadcrumb.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <Fragment key={index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={breadcrumb.href}
                      className="capitalize"
                    >
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              )
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to the login page and need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
       
        </div>
      </div>
    </header>
  )
}