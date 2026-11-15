import { Suspense, ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { MobileNav } from "@/components/mobile-nav";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import UserProfile from "@/components/molecules/user-profile";
import { requireUser } from "@/lib/dal";

// Every dashboard route is authenticated (reads cookies) and must render per-request.
export const dynamic = "force-dynamic";

export default async function layout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Phones: compact top bar + bottom tabs. Tablet/desktop: sidebar. */}
        <MobileTopBar name={user.name} email={user.email} />
        <header className="hidden h-16 shrink-0 items-center gap-2 border-b px-4 md:flex">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <DynamicBreadcrumb />
          <div className="ml-auto flex items-center gap-4">
            <Suspense fallback={<Skeleton className="h-8 w-28" />}>
              <UserProfile />
            </Suspense>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
