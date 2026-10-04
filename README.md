# Mohamed Noor — Freelance Developer Portfolio

A modern, production-ready portfolio for **Mohamed Noor, a Full-Stack Web Developer based in Wellington, New Zealand**.

The website is designed to attract businesses, startups, and digital agencies looking for help with:

* Business websites
* Custom web applications
* SaaS products
* Booking and management systems
* Figma → Next.js development
* White-label development for agencies

Projects are presented as **case studies**, focusing on the problem, solution, engineering approach, technology, and outcome rather than simply showcasing screenshots.

🌐 **Live:** [mohamedhnoor.com](https://www.mohamedhnoor.com/)

---

## ✨ Features

* Modern responsive portfolio
* Project case studies
* Services and capabilities
* Technology stack
* Client-focused positioning
* Contact form with email delivery
* SEO metadata
* Open Graph images
* XML sitemap
* Robots.txt
* Accessible UI
* Dark/light theme
* Responsive navigation
* Custom 404 page
* Resume/CV page
* Production security headers
* Automated tests
* Deployment readiness checks

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Motion

### Tooling

* Vitest
* ESLint
* TypeScript
* GitHub
* Vercel

---

## 📁 Project Structure

Site content is separated from the UI so content can be updated without modifying components.

```text
src/
├── actions/
│   └── contact.ts
├── app/
│   ├── contact/
│   ├── projects/
│   ├── resume/
│   └── ...
├── components/
├── content/
│   ├── experience.ts
│   ├── profile.ts
│   ├── projects.ts
│   └── skills.ts
└── lib/
    └── deploy-readiness.ts
```

### Content

All portfolio content lives in typed modules under:

```text
src/content/
```

This includes:

* Profile information
* Projects
* Skills
* Experience
* Proof points

This makes it possible to update the portfolio's content without changing presentation components.

---

## 🚀 Getting Started

### Requirements

* Node.js
* npm

### Install

```bash
npm install
```

### Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then configure the required variables.

### Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📋 Available Commands

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npx tsc --noEmit     # Run TypeScript checks
npm run preflight    # Run production deployment checks
```

---

## 📧 Contact Form

The contact form uses **Resend** to deliver enquiries by email.

Production requires:

```text
RESEND_API_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
```

If the email service is unavailable or incorrectly configured, the contact flow fails safely and provides a direct email fallback.

---

## 🔍 SEO & Performance

The site includes:

* Canonical URLs
* Dynamic sitemap
* Robots configuration
* Open Graph metadata
* Social sharing images
* Semantic HTML
* Accessibility considerations
* Optimized images
* Responsive layouts
* Performance-focused rendering

The portfolio itself is also used as a demonstration of production frontend engineering.

Current measured results include:

* **100/100 Lighthouse Accessibility**
* **0 axe accessibility violations**
* **88 ms LCP**

---

## 🔐 Security

Production security headers are configured through `next.config.ts`.

The application includes protections such as:

* Content Security Policy
* Strict Transport Security
* X-Content-Type-Options
* Referrer Policy
* X-Frame-Options
* Permissions Policy

The project does not require a database, background workers, storage, or cron jobs.

---

## ☁️ Deployment

The application is designed for deployment on **Vercel**.

Import the repository into Vercel and use the standard Next.js configuration:

```text
Framework: Next.js
Install: npm install
Build: npm run build
```

Set the required environment variables before the production build.

### Production URL

Set:

```text
NEXT_PUBLIC_SITE_URL=https://www.mohamedhnoor.com
```

The value should contain only the final origin — no path, query string, or trailing slash.

Because canonical URLs, the sitemap, and social metadata depend on this value, changing it requires a new production build.

---

## ✅ Deployment Readiness

Before deploying production:

```bash
npm run preflight
```

The deployment check verifies that production content is ready and prevents placeholder projects from being shipped.

Preview deployments can still be used for reviewing work in progress.

---

## 🧪 Production Checklist

After deployment, verify:

* [ ] Homepage loads correctly
* [ ] All project pages load
* [ ] Sitemap is available
* [ ] Robots.txt references the production sitemap
* [ ] Canonical URLs use the production domain
* [ ] Open Graph images render
* [ ] Contact form sends successfully
* [ ] Email fallback works
* [ ] Dark/light theme works
* [ ] No browser console errors
* [ ] Security headers are present
* [ ] 404 page works
* [ ] Resume page renders correctly
* [ ] CV download works if available
* [ ] Lighthouse performance/accessibility checked

---

## 👨‍💻 About

**Mohamed Noor** is a Full-Stack Web Developer based in Wellington, New Zealand.

I build modern websites and web applications for:

* Businesses
* Startups
* Entrepreneurs
* Digital agencies

Primary stack:

**Next.js · React · TypeScript · Node.js · PostgreSQL**

🌐 [Portfolio](https://www.mohamedhnoor.com/)
💼 [LinkedIn](https://www.linkedin.com/in/mohamedhnoor/)
🐙 [GitHub](https://github.com/MohamedHNoor)

---

## 📄 License

This repository contains the source code for a personal portfolio website.

The portfolio content, branding, project descriptions, and personal information are not intended for reuse.
