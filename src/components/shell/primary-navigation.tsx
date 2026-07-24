import type { ElementType } from "react";

import { cn } from "@/lib/utils";
import {
  NAV_GROUPS,
  type NavGroupId,
} from "./nav-items";

export function PrimaryNavigation({
  activeId,
  LinkComponent,
}: {
  activeId: NavGroupId;
  LinkComponent: ElementType;
}) {
  return (
    <nav
      aria-label="Primary"
      role="tablist"
      className="-mb-px flex min-w-0 flex-1 items-stretch gap-0 self-stretch overflow-x-auto sm:gap-1"
    >
      {NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const sectionActive = group.id === activeId;
        return (
          <LinkComponent
            key={group.id}
            href={group.href}
            role="tab"
            aria-label={group.label}
            aria-selected={sectionActive}
            aria-current={sectionActive ? "page" : undefined}
            className={cn(
              "flex min-w-9 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-sm font-medium transition-colors sm:min-w-0 sm:justify-start sm:px-2.5",
              sectionActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <GroupIcon
              className={cn(
                "h-4 w-4 shrink-0",
                sectionActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="hidden sm:inline">{group.label}</span>
          </LinkComponent>
        );
      })}
    </nav>
  );
}
