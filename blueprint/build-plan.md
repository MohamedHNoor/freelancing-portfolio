# Build Plan

The features that make up this project, in build order. Detail lives in each feature spec,
not here. Completed items get checked off, so this doubles as the progress tracker.

Two setup steps sit between features rather than being features themselves. `/tests` is
done: Vitest runs from feature 5 onward and the gate is on. `/ci` still needs running
before feature 13, so a `Verify` command exists for automatic checks.

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
- [x] 8. **Resume** - print-optimized resume route rendered from the content layer, plus a
  downloadable CV
- [x] 9. **Section detail pages** - /about, /services, /skills and /experience as
  standalone routes carrying the full content, with each home section reduced to a
  scannable summary that links to its page, and primary navigation pointing at the
  routes rather than at home page anchors
- [x] 10. **Contact** - qualifying enquiry form with shared client and server validation,
  Server Action, Resend delivery, and a mailto fallback
- [ ] 11. **SEO and social sharing** - per-route metadata and canonicals, sitemap, robots,
  generated social images, and structured data
- [ ] 12. **Accessibility and performance pass** - keyboard and screen reader pass, axe
  clean, reduced-motion pass, Lighthouse at or above 95, bundle and image budget
- [ ] 13. **Deployment readiness** - Vercel configuration, environment variables, production
  build verification, and a smoke test list

## Post-MVP

Candidates once the site is live and the first reviews are in: real client case studies
replacing every placeholder, a writing section if there is something worth publishing, and
testimonial quotes once there are genuine ones to quote.
