"use client";

import { ResumeResult } from "@/types/resume";

interface ResumePreviewProps {
  resume: ResumeResult;
  editable?: boolean;
  onUpdate?: (field: string, value: any) => void;
}

export default function ResumePreview({ resume, editable = false, onUpdate }: ResumePreviewProps) {
  const { header, summary, skills, projects, experience, education } = resume;

  const handleBlur = (field: string, value: string) => {
    if (editable && onUpdate) {
      onUpdate(field, value);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .resume-container, .resume-container * { visibility: visible; }
          .resume-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0.5in 0.6in;
            border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="resume-container bg-surface border border-foreground mx-auto" style={{
        maxWidth: "8.5in",
        minHeight: "11in",
        padding: "0.5in 0.6in",
        fontFamily: "'Times New Roman', 'Georgia', serif",
        fontSize: "10.5pt",
        lineHeight: "1.3",
        color: "#000",
      }}>
        {/* Header */}
        <div className="text-center mb-1">
          <h1
            className="font-bold tracking-wide"
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur("header", JSON.stringify({ ...header, name: e.currentTarget.textContent }))}
            style={{ fontSize: "22pt", marginBottom: "2px" }}
          >
            {header.name}
          </h1>
          <div style={{ fontSize: "9.5pt" }}>
            {[
              header.email,
              header.phone,
              header.location,
              header.github_url ? (
                <a key="gh" href={header.github_url} className="underline">
                  {header.github_url.replace("https://", "")}
                </a>
              ) : null,
              header.linkedin ? (
                <a key="li" href={header.linkedin} className="underline">
                  {header.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              ) : null,
              header.website ? (
                <a key="web" href={header.website} className="underline">
                  {header.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null,
            ]
              .filter(Boolean)
              .map((item, i, arr) => (
                <span key={i}>
                  {item}
                  {i < arr.length - 1 && <span className="mx-1.5">|</span>}
                </span>
              ))}
          </div>
        </div>

        {/* Summary */}
        <SectionHeader title="Summary" />
        <p
          className="mb-2"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur("summary", e.currentTarget.textContent || "")}
        >
          {summary}
        </p>

        {/* Technical Skills */}
        <SectionHeader title="Technical Skills" />
        <div className="mb-2">
          {skills.languages.length > 0 && (
            <SkillRow label="Languages" items={skills.languages} />
          )}
          {skills.frameworks.length > 0 && (
            <SkillRow label="Frameworks" items={skills.frameworks} />
          )}
          {skills.tools.length > 0 && (
            <SkillRow label="Tools" items={skills.tools} />
          )}
          {skills.other.length > 0 && (
            <SkillRow label="Other" items={skills.other} />
          )}
        </div>

        {/* Projects */}
        <SectionHeader title="Projects" />
        <div className="mb-2">
          {projects.map((project, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-bold">{project.name}</span>
                  {project.tech_stack && (
                    <span className="italic ml-1">| {project.tech_stack}</span>
                  )}
                </div>
                {project.url && (
                  <a
                    href={project.url}
                    className="underline text-xs ml-2 shrink-0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                )}
              </div>
              <ul className="list-disc ml-5 mt-0.5">
                {project.bullets.map((bullet, j) => (
                  <li
                    key={j}
                    contentEditable={editable}
                    suppressContentEditableWarning
                    className="leading-snug"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Experience */}
        {experience.length > 0 && (
          <>
            <SectionHeader title="Experience" />
            <div className="mb-2">
              {experience.map((exp, i) => (
                <div key={i} className="mb-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold">{exp.title}</span>
                      <span className="italic ml-1">| {exp.org}</span>
                    </div>
                    {exp.date_range && (
                      <span className="text-xs italic shrink-0">{exp.date_range}</span>
                    )}
                  </div>
                  <ul className="list-disc ml-5 mt-0.5">
                    {exp.bullets.map((bullet, j) => (
                      <li
                        key={j}
                        contentEditable={editable}
                        suppressContentEditableWarning
                        className="leading-snug"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Education */}
        <SectionHeader title="Education" />
        <div className="mb-2">
          {education.map((edu, i) => (
            <div key={i} className="mb-1">
              <div className="flex items-baseline justify-between">
                <div>
                  <span
                    className="font-bold"
                    contentEditable={editable}
                    suppressContentEditableWarning
                  >
                    {edu.school}
                  </span>
                  <span
                    className="italic ml-1"
                    contentEditable={editable}
                    suppressContentEditableWarning
                  >
                    | {edu.degree}
                  </span>
                </div>
                {edu.date_range && (
                  <span
                    className="text-xs italic shrink-0"
                    contentEditable={editable}
                    suppressContentEditableWarning
                  >
                    {edu.date_range}
                  </span>
                )}
              </div>
              {edu.details && (
                <p
                  className="ml-5 text-sm"
                  contentEditable={editable}
                  suppressContentEditableWarning
                >
                  {edu.details}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-1">
      <h2
        className="font-bold uppercase tracking-wider"
        style={{ fontSize: "11pt", borderBottom: "1.5px solid #000", paddingBottom: "1px" }}
      >
        {title}
      </h2>
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex">
      <span className="font-bold mr-1 shrink-0">{label}:</span>
      <span>{items.join(", ")}</span>
    </div>
  );
}
