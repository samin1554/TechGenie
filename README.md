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

## Project Structure

```
TechGenie/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/       # Route handlers
│   │   │   │   ├── auth.py      # OAuth login/logout
│   │   │   │   ├── analysis.py  # GitHub profile analysis
│   │   │   │   ├── resume.py    # Resume parsing, scoring, generation
│   │   │   │   ├── cover_letter.py
│   │   │   │   ├── skill_gap.py
│   │   │   │   ├── linkedin.py
│   │   │   │   ├── compare.py
│   │   │   │   ├── jobs.py      # Premium job search
│   │   │   │   ├── billing.py   # Stripe checkout/webhooks
│   │   │   │   ├── news.py      # Tech editorials
│   │   │   │   └── history.py
│   │   │   └── router.py
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Rate limiting, auth
│   │   ├── config.py            # Settings from env vars
│   │   └── main.py              # FastAPI app setup
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   ├── components/          # Shared UI components
│   │   └── lib/
│   │       └── api.ts           # API client with Bearer auth
│   └── package.json
└── docker-compose.yml
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Public (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/news/editorials` | Daily tech editorials |
| `POST` | `/compare` | Compare two GitHub profiles |
| `POST` | `/resume/score` | ATS resume scoring |

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/github` | GitHub OAuth redirect URL |
| `POST` | `/auth/github/callback` | GitHub OAuth callback |
| `GET` | `/auth/google` | Google OAuth redirect URL |
| `POST` | `/auth/google/callback` | Google OAuth callback |
| `GET` | `/auth/me` | Current user profile |
| `POST` | `/auth/logout` | Logout |

### Protected (auth required, costs credits)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze` | Analyze GitHub profile |
| `GET` | `/analysis/{id}` | Retrieve analysis |
| `GET` | `/history` | User's analysis history |
| `DELETE` | `/history/{id}` | Delete analysis |
| `POST` | `/resume/generate` | Generate optimized resume |
| `POST` | `/resume/parse` | Parse PDF resume |
| `GET` | `/resume/list` | List user's resumes |
| `POST` | `/cover-letter/generate` | Generate cover letter |
| `POST` | `/skill-gap/analyze` | Skill gap analysis |
| `POST` | `/linkedin/optimize` | Optimize LinkedIn profile |

### Premium Only
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/jobs/search` | Search job listings |

### Billing
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/billing/checkout` | Create Stripe checkout session |
| `GET` | `/billing/portal` | Stripe billing portal |
| `POST` | `/billing/webhook` | Stripe webhook handler |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- API keys: Groq, GitHub OAuth, Google OAuth

### 1. Clone the repository

```bash
git clone https://github.com/samin1554/TechGenie.git
cd TechGenie
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/techgenie

# Auth
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRY_DAYS=7

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# GitHub API (optional, increases rate limit)
GITHUB_TOKEN=ghp_your_token

# Groq AI (required for AI features)
GROQ_API_KEY=gsk_your_key

# Stripe (required for billing)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_ID=price_your_id

# RapidAPI / JSearch (required for job board)
RAPIDAPI_KEY=your_key

# Frontend
FRONTEND_URL=http://localhost:3000
FREE_CREDITS=2
```

Run migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

### 4. Using Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL, the backend (port 8000), and the frontend (port 3000).

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
