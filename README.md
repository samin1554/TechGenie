# TechGenie

**AI-powered career toolkit for developers.** Analyze your GitHub profile, generate optimized resumes, craft cover letters, identify skill gaps, optimize your LinkedIn, and browse job listings — all in one newspaper-themed platform.

**Live:** [techgenie.cc](https://techgenie.cc)

---

## Features

| Feature | Description | Credits |
|---------|-------------|---------|
| **GitHub Profile Analysis** | 7-dimension scoring (project diversity, language breadth, commit consistency, README quality, community engagement, originality) with AI feedback | 1 |
| **Resume Builder** | Upload PDF → ATS score → AI-generated optimized resume with multiple templates | 1 (scoring is free) |
| **Cover Letter Generator** | Tailored cover letters from job descriptions with optional GitHub/resume context | 1 |
| **Skill Gap Analysis** | Compare your profile against a job description to identify missing skills | 1 |
| **LinkedIn Optimizer** | Rewrite your headline and about section with keyword optimization and strength scoring | 1 |
| **Profile Comparison** | Side-by-side comparison of two GitHub profiles across 7 dimensions | Free |
| **Job Board** | Search real listings from LinkedIn, Indeed, Glassdoor via JSearch API | Premium only |
| **Tech Editorials** | Daily curated tech news on the login page | Free |

**Free tier:** 2 credits on signup. **Premium:** $5/month for unlimited credits + job board access.

---

## Tech Stack

### Backend
- **Framework:** FastAPI + Uvicorn
- **Database:** PostgreSQL + SQLAlchemy 2.0 (async) + Alembic migrations
- **AI:** Groq (`llama-3.3-70b-versatile`)
- **Auth:** GitHub & Google OAuth2, JWT (PyJWT)
- **Payments:** Stripe (subscriptions + webhooks)
- **PDF Parsing:** PyMuPDF
- **HTTP:** httpx (async)

### Frontend
- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Export:** html2canvas

### Infrastructure
- **Backend hosting:** Railway (Docker)
- **Frontend hosting:** Vercel
- **DNS:** Cloudflare
- **Database:** Railway PostgreSQL

---

## Database Models

### User
- OAuth identity (GitHub/Google), email, display name, avatar
- Credit system: `credits_remaining` (default 2)
- Stripe integration: `stripe_customer_id`, `stripe_sub_id`, `is_premium`

### GitHubAnalysis
- Cached daily per username (unique constraint: username + date)
- 7 dimension scores + top languages/repos (JSONB)
- LLM-generated feedback and suggestions
- Auto-expires for daily refresh

### Resume
- Structured JSONB content (header, summary, skills, projects, experience, education)
- Template selection, edit tracking

---

## Rate Limiting

In-memory per-IP rate limiting:

| Endpoint Category | Limit |
|-------------------|-------|
| Auth endpoints | 10/min |
| AI features (analyze, resume, cover letter, skill gap, LinkedIn) | 10/min |
| Job search | 20/min |
| News, health | 60/min |
| Everything else | 30/min |

---

## License

MIT
