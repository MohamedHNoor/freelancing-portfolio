# Project management prototypes

Approved five-screen refinement, 6 October 2026. Plain HTML/CSS with small theme and state switches. No dependencies, application changes, data persistence or payment calls.

Open `overview.html` in a browser and use the Design Preview navigation to visit:
- `overview.html`: admin overview, next actions, projects and per-currency totals.
- `project.html`: milestone work/payment status, blocked completion, request and activity.
- `client.html`: client project/payment view, with active and empty states.
- `create.html`: manual client/project details and milestone editor, with balanced and unallocated states.
- `pay.html`: requested, cancelled, failed, processing and paid views; Checkout is disabled.

`theme.css` is the shared token source. `components.css` holds prototype layout styles. Use Light theme on every screen to review both palettes. Form inputs are illustrative and do not recalculate totals. All client/project names and records are fictional fixtures. Navigation links preview the flow; they do not mutate records.

`import.html` is the older plan-import exploration, preserved for reference and outside this approved pass.

Next: review the look, then spec the first dashboard UI feature with these files as its design reference. Port only the necessary new theme tokens into the application's CSS-first Tailwind theme.
