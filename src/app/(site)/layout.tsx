import { SiteChrome } from "@/components/layout/SiteChrome";

/* Every public page except `/resume`. A route group adds no URL segment, so
   the paths are unchanged; it only decides which pages get the header and
   footer. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
