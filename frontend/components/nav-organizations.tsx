import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Check, ChevronDown, Building2 } from "lucide-react";
import { useRouter } from "next/router";
import { useLogger } from '@/hooks/useLogger';

export function NavOrganizations({
  organizations,
  collapsed = false,
  selectedOrgSlug,
}: {
  organizations: {
    name: string
    slug: string
    role?: string
  }[]
  collapsed?: boolean
  selectedOrgSlug?: string | null
}) {
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar()
  
  // Debug logging
  console.log('[NavOrganizations] Render:', {
    organizations,
    collapsed,
    selectedOrgSlug,
    routerPath: router.asPath,
    organizationCount: organizations.length
  });
  
  // Determine current organization by matching current path to org slug, or use selectedOrgSlug
  const currentOrg = organizations.find(org => router.asPath.startsWith(`/orgs/${org.slug}`)) 
    || (selectedOrgSlug ? organizations.find(org => org.slug === selectedOrgSlug) : null)
    || organizations[0];

  console.log('[NavOrganizations] Current org:', currentOrg);

  const handleOrgClick = async (orgSlug: string) => {
    console.log('[NavOrganizations] Org clicked:', orgSlug);
    await router.push(`/orgs/${orgSlug}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (collapsed) {
    // Only show the icon, but still open the dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-accent transition">
            <Building2 className="w-6 h-6" />
            <span className="sr-only">Switch Organization</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-0">
          {organizations.map(org => (
            <DropdownMenuItem
              key={org.slug}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${currentOrg?.slug === org.slug ? "bg-accent font-semibold" : ""}`}
              onClick={() => handleOrgClick(org.slug)}
            >
              <Building2 className="w-4 h-4" />
              <span className="flex-1 truncate text-left">{org.name}</span>
              {org.role && (
                <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                  {org.role === 'org_admin' ? 'Admin' : 'Viewer'}
                </span>
              )}
              {currentOrg?.slug === org.slug && <Check className="w-4 h-4 text-primary ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="px-2 py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-accent transition text-foreground font-medium">
            <Building2 className="w-5 h-5" />
            <span className="flex-1 truncate text-left">{currentOrg ? currentOrg.name : "Select Organization"}</span>
            <ChevronDown className="w-4 h-4 ml-auto opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-0">
          {organizations.map(org => (
            <DropdownMenuItem
              key={org.slug}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${currentOrg?.slug === org.slug ? "bg-accent font-semibold" : ""}`}
              onClick={() => handleOrgClick(org.slug)}
            >
              <Building2 className="w-4 h-4" />
              <span className="flex-1 truncate text-left">{org.name}</span>
              {org.role && (
                <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                  {org.role === 'org_admin' ? 'Admin' : 'Viewer'}
                </span>
              )}
              {currentOrg?.slug === org.slug && <Check className="w-4 h-4 text-primary ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 