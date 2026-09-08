# Build Plan

The features that make up this project, in build order. Detail lives in each feature spec,
not here. Completed items get checked off, so this doubles as the progress tracker.

Two setup steps sit between features rather than being features themselves: run `/tests`
before feature 9 so contact validation ships behind a real gate, and `/ci` before feature
12 so a `Verify` command exists for automatic checks.

## MVP

- [x] 1. **Design system and app shell** - brand tokens over the shadcn base, font trio,
  header with navigation, mobile menu, footer, theme toggle, and the animation provider
- [x] 2. **Content layer** - typed profile, services, skills, experience, and project data
  with lookup helpers, seeded with clearly flagged placeholder content
- [x] 3. **Hero and about** - dual-track positioning with the Figma track first, availability
  status, credibility strip, and the about narrative
- [x] 4. **Services** - the two engagement tracks with scope, deliverables, timeline, and
  how a project actually runs
- [x] 5. **Skills and experience** - technology stack grouped by role with usage context,
  and the dated experience timeline
- [x] 6. **Selected projects and index** - outcome-framed project cards on the home page
  plus a filterable project index route
- [x] 7. **Case study pages** - a static page per project covering problem, approach,
  architecture, stack, and outcome, with previous and next navigation
- [ ] 8. **Resume** - print-optimized resume route rendered from the content layer, plus a
  downloadable CV
- [ ] 9. **Contact** - qualifying enquiry form with shared client and server validation,
  Server Action, Resend delivery, and a mailto fallback
- [ ] 10. **SEO and social sharing** - per-route metadata and canonicals, sitemap, robots,
  generated social images, and structured data
- [ ] 11. **Accessibility and performance pass** - keyboard and screen reader pass, axe
  clean, reduced-motion pass, Lighthouse at or above 95, bundle and image budget
- [ ] 12. **Deployment readiness** - Vercel configuration, environment variables, production
  build verification, and a smoke test list

## Post-MVP

Candidates once the site is live and the first reviews are in: real client case studies
replacing every placeholder, a writing section if there is something worth publishing, and
testimonial quotes once there are genuine ones to quote.
