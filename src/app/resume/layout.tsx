import { SkipLink } from "@/components/layout/SkipLink";

export default function ResumeLayout({ children }: LayoutProps<"/resume">) {
  return (
    <>
      <SkipLink />
      {children}
    </>
  );
}
