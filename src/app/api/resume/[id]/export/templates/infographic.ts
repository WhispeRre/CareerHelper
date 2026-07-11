import type {
  SummaryContent,
  WorkExperienceContent,
  EducationContent,
  SkillsContent,
  ProjectsContent,
  CertificationsContent,
  LanguagesContent,
  CustomContent,
  GitHubContent,
} from '@/types/resume';
import { esc, md, degreeField, getPersonalInfo, visibleSections, buildHighlights, buildQrCodesHtml, type ResumeWithSections, type Section } from '../utils';

function buildInfographicSectionContent(section: Section, color: string, colorIndex: number, lang: string): string {
  const c = section.content as any;
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
  if (section.type === 'summary') return `<div class="rounded-lg border-l-4 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600" style="border-color:${color}">${md((c as SummaryContent).text)}</div>`;
  if (section.type === 'work_experience') {
    return `<div class="space-y-4">${((c as WorkExperienceContent).items || []).map((it: any) => `<div class="rounded-lg border border-zinc-100 p-4">
      <div class="flex items-baseline justify-between"><h3 class="text-sm font-bold text-zinc-800">${esc(it.position)}</h3><span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style="background:${color}">${esc(it.startDate)} – ${esc(it.endDate) || (it.current ? (lang === 'zh' ? '至今' : 'Present') : '')}</span></div>
      ${it.company ? `<p class="text-sm" style="color:${color}">${esc(it.company)}</p>` : ''}
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<div class="mt-1.5 flex flex-wrap gap-1">${it.technologies.map((t: string) => `<span class="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style="background:${color};opacity:0.8">${esc(t)}</span>`).join('')}</div>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'education') {
    return `<div class="space-y-3">${((c as EducationContent).items || []).map((it: any) => `<div class="rounded-lg border border-zinc-100 p-4">
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold text-zinc-800">${esc(degreeField(it.degree, it.field))}</span>${it.institution ? `<span class="text-sm text-zinc-500"> — ${esc(it.institution)}</span>` : ''}</div><span class="shrink-0 text-xs text-zinc-400">${esc(it.startDate)} – ${esc(it.endDate) || (lang === 'zh' ? '至今' : 'Present')}</span></div>
      ${it.gpa ? `<p class="text-sm text-zinc-500">GPA: ${esc(it.gpa)}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'skills') {
    return `<div class="space-y-2">${((c as SkillsContent).categories || []).map((cat: any, ci: number) => `<div>
      <p class="mb-1 text-xs font-bold text-zinc-500">${esc(cat.name)}</p>
      <div class="flex flex-wrap gap-1.5">${(cat.skills || []).map((skill: string) =>
        `<span class="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style="background:${COLORS[(colorIndex + ci) % COLORS.length]}">${esc(skill)}</span>`
      ).join('')}</div>
    </div>`).join('')}</div>`;
  }
  if (section.type === 'projects') {
    return `<div class="space-y-3">${((c as ProjectsContent).items || []).map((it: any) => `<div class="rounded-lg border border-zinc-100 p-4">
      <div class="flex items-baseline justify-between"><h3 class="text-sm font-bold" style="color:${color}">${esc(it.name)}</h3>${it.startDate ? `<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style="background:${color}">${esc(it.startDate)} – ${it.endDate ? esc(it.endDate) : (lang === 'zh' ? '至今' : 'Present')}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<div class="mt-1.5 flex flex-wrap gap-1">${it.technologies.map((t: string) => `<span class="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style="background:${color};opacity:0.8">${esc(t)}</span>`).join('')}</div>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'certifications') {
    return `<div class="space-y-1.5">${((c as CertificationsContent).items || []).map((it: any) =>
      `<div class="flex items-baseline justify-between rounded-lg border border-zinc-100 p-3"><div><span class="text-sm font-bold" style="color:${color}">${esc(it.name)}</span>${it.issuer ? `<span class="text-sm text-zinc-500"> — ${esc(it.issuer)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>`
    ).join('')}</div>`;
  }
  if (section.type === 'languages') {
    return `<div class="flex flex-wrap gap-2">${((c as LanguagesContent).items || []).map((it: any, i: number) =>
      `<span class="rounded-full px-3 py-1 text-xs font-medium text-white" style="background:${COLORS[(colorIndex + i) % COLORS.length]}">${esc(it.language)} — ${esc(it.proficiency)}</span>`
    ).join('')}</div>`;
  }
  if (section.type === 'github') {
    return `<div class="space-y-3">${((c as GitHubContent).items || []).map((it: any) => `<div class="rounded-lg border border-zinc-100 p-4">
      <div class="flex items-baseline justify-between"><span class="text-sm font-bold" style="color:${color}">${esc(it.name)}</span><span class="shrink-0 text-xs text-zinc-400">\u2B50 ${it.stars?.toLocaleString() ?? 0}</span></div>
      ${it.language ? `<span class="text-xs" style="color:${color}">${esc(it.language)}</span>` : ''}
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'custom') {
    return `<div class="space-y-3">${((c as CustomContent).items || []).map((it: any) => `<div class="rounded-lg border border-zinc-100 p-4">
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold" style="color:${color}">${esc(it.title)}</span>${it.subtitle ? `<span class="text-sm text-zinc-500"> — ${esc(it.subtitle)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'qr_codes') return buildQrCodesHtml(section);
  if (c.items) {
    return `<div class="space-y-2">${c.items.map((it: any) => `<div class="rounded-lg border border-zinc-100 p-3"><span class="text-sm font-medium text-zinc-800">${esc(it.name || it.title || it.language)}</span>${it.description ? `<div class="text-sm text-zinc-600">${md(it.description)}</div>` : ''}</div>`).join('')}</div>`;
  }
  return '';
}

export function buildInfographicHtml(resume: ResumeWithSections): string {
  const pi = getPersonalInfo(resume);
  const sections = visibleSections(resume);
  const contacts = [pi.age, pi.politicalStatus, pi.gender, pi.ethnicity, pi.hometown, pi.maritalStatus, pi.yearsOfExperience, pi.educationLevel, pi.email, pi.phone, pi.wechat, pi.location, pi.website].filter(Boolean);
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  return `<div class="mx-auto max-w-[210mm] bg-white shadow-lg" style="font-family:Inter,sans-serif">
    <div class="relative overflow-hidden px-8 py-8" style="background:linear-gradient(135deg,#1e40af,#7c3aed)">
      <div class="relative flex items-center gap-5">
        ${pi.avatar ? `<img src="${esc(pi.avatar)}" alt="" class="h-20 w-20 shrink-0 rounded-full border-white/30 object-cover" style="border-width:3px"/>` : ''}
        <div>
          <h1 class="text-3xl font-bold text-white">${esc(pi.fullName || 'Your Name')}</h1>
          ${pi.jobTitle ? `<p class="mt-1 text-base text-white/70">${esc(pi.jobTitle)}</p>` : ''}
          ${contacts.length || pi.linkedin || pi.github ? `<div class="mt-2 flex flex-wrap gap-3 text-sm text-white/60">${contacts.map(c => `<span>${esc(c)}</span>`).join('')}${pi.linkedin ? `<span class="break-all">${esc(pi.linkedin)}</span>` : ''}${pi.github ? `<span class="break-all">${esc(pi.github)}</span>` : ''}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="p-8">
      ${sections.map((s, idx) => `<div class="mb-6" data-section>
        <h2 class="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white" style="background:${COLORS[idx % COLORS.length]}">${idx + 1}</span>
          <span style="color:${COLORS[idx % COLORS.length]}">${esc(s.title)}</span>
        </h2>
        ${buildInfographicSectionContent(s, COLORS[idx % COLORS.length], idx, resume.language || 'en')}
      </div>`).join('')}
    </div>
  </div>`;
}
