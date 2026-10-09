import { ProgressMeter } from "@/components/dashboard/shared/ProgressMeter";

/** Development and payment progress side by side, kept apart because work and payment are separate. */
export function ProgressPair({ development, payment }: { development: number; payment: number }) {
  return (
    <section aria-label="Progress" className="grid gap-4 sm:grid-cols-2">
      <div className="workspace-surface rounded-2xl border border-border bg-card px-5 py-5 sm:px-6">
        <ProgressMeter id="development-progress" label="Development" value={development}
          detail="Completed work, weighted by milestone amount. The deposit is not counted." />
      </div>
      <div className="workspace-surface rounded-2xl border border-border bg-card px-5 py-5 sm:px-6">
        <ProgressMeter id="payment-progress" label="Payments" value={payment} detail="Share of the total received." />
      </div>
    </section>
  );
}
