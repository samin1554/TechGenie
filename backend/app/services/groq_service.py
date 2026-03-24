import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class GroqService:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODEL = "llama-3.3-70b-versatile"

    @staticmethod
    async def generate_feedback(
        username: str,
        scores: dict,
        top_repos: list[dict],
        top_languages: list[str],
        account_age_days: int,
    ) -> dict | None:
        if not settings.groq_api_key:
            return None

        repos_summary = ", ".join(
            f"{r['name']} ({r.get('language', 'N/A')}, {r.get('stars', 0)} stars)"
            for r in top_repos[:5]
        )

        prompt = f"""You are a GitHub profile coach for CS students and developers.
Analyze this GitHub profile and provide actionable feedback.

Profile data:
- Username: {username}
- Overall Score: {scores.get('overall', 0)}/100
- Project Diversity: {scores.get('project_diversity', 0)}/100
- Language Breadth: {scores.get('language_breadth', 0)}/100
- Commit Consistency: {scores.get('commit_consistency', 0)}/100
- README Quality: {scores.get('readme_quality', 0)}/100
- Community Engagement: {scores.get('community_engagement', 0)}/100
- Originality: {scores.get('originality', 0)}/100
- Top Languages: {', '.join(top_languages)}
- Top Repos: {repos_summary}
- Account Age: {account_age_days} days

Provide:
1. A 3-sentence summary of their strengths and areas for improvement
2. Exactly 3 specific, actionable suggestions to improve their GitHub profile

Be encouraging but honest. Reference specific repos by name when relevant.
Respond in JSON format: {{"feedback": "...", "suggestions": ["...", "...", "..."]}}
Only respond with valid JSON, no other text."""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 500,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            logger.exception("Groq API call failed")
            return None

    @staticmethod
    async def optimize_resume(
        resume_text: str,
        role: str,
        tone: str,
        job_description: str | None = None,
        github_context: str | None = None,
    ) -> dict | None:
        """Optimize an existing resume using AI."""
        if not settings.groq_api_key:
            return None

        role_label = role.replace("_", " ").title()

        tone_instructions = {
            "conservative": "Keep language professional, concise, and traditional. Stick closely to the original content. Minimal embellishment.",
            "balanced": "Improve clarity and impact while staying truthful. Add quantification where reasonable. Professional but engaging.",
            "creative": "Rewrite bullets for maximum impact. Use powerful action verbs, quantify aggressively, highlight achievements. Bold and compelling language.",
        }
        tone_guide = tone_instructions.get(tone, tone_instructions["balanced"])

        jd_section = ""
        if job_description:
            jd_section = f"""
Target Job Description:
{job_description[:1500]}

IMPORTANT: Tailor the resume to match this job description. Emphasize relevant skills, use matching keywords, and align experience bullets with the JD requirements.
"""

        github_section = ""
        if github_context:
            github_section = f"""
GitHub Profile Data (use to enhance skills and projects sections):
{github_context[:1000]}
"""

        prompt = f"""You are an expert resume writer specializing in {role_label} roles.
Optimize the following resume for ATS compatibility and maximum interview impact.

ORIGINAL RESUME:
{resume_text[:3000]}
{jd_section}
{github_section}

ROLE TARGET: {role_label}
TONE: {tone_guide}

INSTRUCTIONS:
1. header: Extract the person's name, email, phone, location, GitHub URL, LinkedIn, and website from the resume. Keep ALL existing contact info. Set missing fields to null.
2. summary: Write a 2-3 sentence professional summary tailored to {role_label} roles. Highlight strongest skills and experience from the resume.
3. skills: Categorize ALL technical skills from the resume into languages, frameworks, tools, and other. Be specific (e.g., "React" not "frontend"). If GitHub data is provided, merge in additional skills found there.
4. projects: Extract projects from the resume. For each:
   - name: project name
   - tech_stack: technologies used (comma-separated)
   - url: project URL if mentioned, otherwise null
   - bullets: 2-3 impact-driven bullet points starting with action verbs (Built, Implemented, Designed, Developed, Engineered, Optimized, Reduced, Increased). Quantify results where possible.
5. experience: Extract work experience. For each:
   - title: job title
   - org: company name
   - date_range: date range as written
   - bullets: 2-4 bullet points rewritten per the tone guide. Start with action verbs, quantify impact.
6. education: Extract education entries. Keep as-is but clean up formatting.

CRITICAL RULES:
- Do NOT invent experience, companies, or degrees that aren't in the original
- DO improve bullet point language, add quantification, and use stronger verbs
- DO reorder skills by relevance to the target role
- Keep the resume to 1 page worth of content (be concise)

Respond ONLY with valid JSON:
{{
  "header": {{"name": "", "email": null, "phone": null, "github_url": null, "location": null, "linkedin": null, "website": null}},
  "summary": "",
  "skills": {{"languages": [], "frameworks": [], "tools": [], "other": []}},
  "projects": [{{"name": "", "tech_stack": "", "url": null, "bullets": []}}],
  "experience": [{{"title": "", "org": "", "date_range": null, "bullets": []}}],
  "education": [{{"school": "", "degree": "", "date_range": null, "details": null}}]
}}"""

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.4 if tone == "conservative" else 0.6 if tone == "balanced" else 0.8,
                        "max_tokens": 3000,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            logger.exception("Groq resume optimization failed")
            return None

    @staticmethod
    async def score_resume_ats(
        resume_text: str,
        role: str | None = None,
    ) -> dict | None:
        """Score a resume across 5 ATS categories. Returns structured scores."""
        if not settings.groq_api_key:
            return None

        role_context = ""
        if role:
            role_label = role.replace("_", " ").title()
            role_context = f"\nThe candidate is targeting {role_label} roles. Score job optimization relative to this role."

        prompt = f"""You are an expert ATS (Applicant Tracking System) resume evaluator.
Analyze the following resume and score it across 5 categories.
{role_context}

RESUME:
{resume_text[:3000]}

Score each category precisely. Be honest — most resumes score 50-75 overall.

CATEGORIES:
1. Content Quality (max 35 points): Does the resume have strong action verbs, quantified achievements, relevant technical skills, and well-structured bullet points? Deduct for vague descriptions, missing metrics, or generic language.

2. ATS & Structure (max 25 points): Is the format ATS-parseable? Check for: clear section headers (Education, Experience, Skills, Projects), consistent date formatting, no tables/columns/graphics that break ATS parsers, standard fonts, proper hierarchy.

3. Job Optimization (max 25 points): Does the resume include industry-relevant keywords? Are skills aligned with current job market demands? Are technologies and frameworks current? {"Score relative to " + role.replace("_", " ").title() + " roles." if role else "Score for general tech roles."}

4. Writing Quality (max 10 points): Grammar, spelling, conciseness. Are bullets parallel in structure? Is tense consistent (past tense for past roles, present for current)?

5. Application Ready (max 5 points): Is contact info complete (email, phone, GitHub/LinkedIn)? Is the resume 1 page? Does it have a professional appearance?

Respond ONLY with valid JSON:
{{
  "overall": <sum of all category scores>,
  "categories": [
    {{"name": "Content Quality", "score": <0-35>, "max_score": 35, "feedback": "<1-2 sentence assessment>"}},
    {{"name": "ATS & Structure", "score": <0-25>, "max_score": 25, "feedback": "<1-2 sentence assessment>"}},
    {{"name": "Job Optimization", "score": <0-25>, "max_score": 25, "feedback": "<1-2 sentence assessment>"}},
    {{"name": "Writing Quality", "score": <0-10>, "max_score": 10, "feedback": "<1-2 sentence assessment>"}},
    {{"name": "Application Ready", "score": <0-5>, "max_score": 5, "feedback": "<1-2 sentence assessment>"}}
  ],
  "summary": "<2-3 sentence overall assessment>",
  "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}}"""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 1000,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            logger.exception("Groq ATS scoring failed")
            return None

    @staticmethod
    async def generate_cover_letter(
        job_description: str,
        resume_text: str | None = None,
        github_context: str | None = None,
    ) -> str | None:
        """Generate a tailored cover letter."""
        if not settings.groq_api_key:
            return None

        resume_section = ""
        if resume_text:
            resume_section = f"""
CANDIDATE'S RESUME:
{resume_text[:2000]}
"""

        github_section = ""
        if github_context:
            github_section = f"""
CANDIDATE'S GITHUB PROFILE:
{github_context[:1000]}
"""

        prompt = f"""You are an expert cover letter writer for tech roles.
Write a compelling, tailored cover letter for the following job.

JOB DESCRIPTION:
{job_description[:2000]}
{resume_section}
{github_section}

INSTRUCTIONS:
1. Write 3-4 paragraphs in a professional but personable tone
2. Opening: Express genuine interest in the specific role and company. Mention the company by name if identifiable from the JD.
3. Body (1-2 paragraphs): Highlight the candidate's most relevant skills, experience, and projects that align with the JD requirements. If GitHub projects are provided, reference specific projects by name.
4. Closing: Express enthusiasm, mention availability, and include a call to action.
5. Keep it under 400 words — concise and impactful.
6. Do NOT use generic filler phrases like "I am writing to express my interest" — be specific and authentic.
7. Do NOT include placeholders like [Company Name] — use real names from the JD or omit.

Respond ONLY with valid JSON:
{{"cover_letter": "<the full cover letter text with proper paragraph breaks using \\n\\n>"}}"""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 1500,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return parsed.get("cover_letter", "")
        except Exception:
            logger.exception("Groq cover letter generation failed")
            return None

    @staticmethod
    async def optimize_linkedin(
        headline: str,
        about: str,
        target_role: str | None = None,
        github_context: str | None = None,
    ) -> dict | None:
        """Optimize a LinkedIn headline and about section."""
        if not settings.groq_api_key:
            return None

        role_target = target_role or "software engineering"

        github_section = ""
        if github_context:
            github_section = f"""
CANDIDATE'S GITHUB PROFILE (use to enhance suggestions with real project data):
{github_context[:1000]}
"""

        prompt = f"""You are an expert LinkedIn profile optimizer for software engineers and tech professionals.

CURRENT LINKEDIN PROFILE:
- Headline: {headline}
- About/Summary:
{about[:2000]}
{github_section}

TARGET ROLE: {role_target}

INSTRUCTIONS:
1. optimized_headline: Rewrite the headline to be punchy, keyword-rich, and under 120 characters. Include the target role, key technologies, and a value proposition. Avoid buzzwords like "passionate" or "driven" — focus on concrete skills and impact.

2. optimized_about: Rewrite the about section to be 150-300 words. Structure it as:
   - Opening hook (1 sentence that captures attention)
   - Core expertise and years of experience
   - Key technologies and domains
   - Notable achievements or impact (quantified if possible)
   - What they're looking for / call to action
   If GitHub data is provided, reference specific projects and contributions.

3. keywords: List 8-12 industry keywords and technologies that should appear on their profile for maximum recruiter visibility. Include both technical skills and industry terms.

4. strength_score: Rate the CURRENT profile (before optimization) from 0-100 based on:
   - Headline effectiveness (is it keyword-rich and specific?)
   - About section quality (is it compelling, structured, quantified?)
   - Overall professional positioning
   Be honest — most LinkedIn profiles score 30-60.

5. suggestions: Provide 3-5 specific, actionable tips to improve their LinkedIn beyond headline/about (e.g., "Add a featured section showcasing your top 3 GitHub projects", "Request recommendations from past colleagues", etc.)

Respond ONLY with valid JSON:
{{
  "optimized_headline": "...",
  "optimized_about": "...",
  "keywords": ["...", "..."],
  "strength_score": 45,
  "suggestions": ["...", "..."]
}}"""

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 2000,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            logger.exception("Groq LinkedIn optimization failed")
            return None

    @staticmethod
    async def analyze_skill_gap(
        job_description: str,
        user_skills_context: str,
    ) -> dict | None:
        """Analyze skill gap between user's skills and job requirements."""
        if not settings.groq_api_key:
            return None

        prompt = f"""You are a technical career advisor analyzing the skill gap between a candidate and a job posting.

JOB DESCRIPTION:
{job_description[:2000]}

CANDIDATE'S SKILLS & EXPERIENCE:
{user_skills_context[:2500]}

INSTRUCTIONS:
1. Extract ALL technical skills, tools, frameworks, and technologies required by the job description.
2. For each required skill, classify it as:
   - "match": The candidate clearly has this skill (found in GitHub projects or resume)
   - "partial": The candidate has a related skill but not an exact match (e.g., JD wants React, candidate knows Vue)
   - "missing": The candidate shows no evidence of this skill
3. For "match" and "partial" skills, specify the source: "github", "resume", or "both"
4. Calculate match_percentage: (matching + partial*0.5) / total_skills * 100
5. Provide 3-5 specific, actionable recommendations for closing the skill gaps

Respond ONLY with valid JSON:
{{
  "matching": [{{"skill": "Python", "status": "match", "source": "both"}}],
  "partial": [{{"skill": "React", "status": "partial", "source": "github"}}],
  "missing": [{{"skill": "Kubernetes", "status": "missing", "source": null}}],
  "recommendations": ["Learn X by doing Y", "..."],
  "match_percentage": 72.5
}}"""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    GroqService.API_URL,
                    json={
                        "model": GroqService.MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 1500,
                        "response_format": {"type": "json_object"},
                    },
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            logger.exception("Groq skill gap analysis failed")
            return None
