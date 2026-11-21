/** Layout for every public page (the route group "(site)" doesn't appear in URLs). */
import SiteChrome from "@/components/layout/SiteChrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
