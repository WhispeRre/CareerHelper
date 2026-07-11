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

function buildStartupSectionContent(section: Section, lang: string): string {
  const c = section.content as any;
  const PURPLE = '#6366f1';
  const CYAN = '#06b6d4';
  if (section.type === 'summary') return `<div class="text-sm leading-relaxed text-zinc-600">${md((c as SummaryContent).text)}</div>`;
  if (section.type === 'work_experience') {
    return `<div class="space-y-4">${((c as WorkExperienceContent).items || []).map((it: any) => `<div class="pl-4" style="border-left-width:3px;border-left-style:solid;border-color:${CYAN}">
      <div class="flex items-baseline justify-between"><h3 class="text-sm font-bold text-zinc-800">${esc(it.position)}</h3><span class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white" style="background:${PURPLE}">${esc(it.startDate)} – ${esc(it.endDate) || (it.current ? (lang === 'zh' ? '至今' : 'Present') : '')}</span></div>
      ${it.company ? `<p class="text-sm" style="color:${CYAN}">${esc(it.company)}</p>` : ''}
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<div class="mt-1.5 flex flex-wrap gap-1">${it.technologies.map((t: string) => `<span class="rounded-full border px-2 py-0.5 text-[10px] font-medium" style="border-color:${PURPLE};color:${PURPLE}">${esc(t)}</span>`).join('')}</div>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'education') {
    return `<div class="space-y-3">${((c as EducationContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold text-zinc-800">${esc(degreeField(it.degree, it.field))}</span>${it.institution ? `<span class="text-sm text-zinc-500"> — ${esc(it.institution)}</span>` : ''}</div><span class="shrink-0 text-xs text-zinc-400">${esc(it.startDate)} – ${esc(it.endDate) || (lang === 'zh' ? '至今' : 'Present')}</span></div>
      ${it.gpa ? `<p class="text-sm text-zinc-500">GPA: ${esc(it.gpa)}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'skills') {
    return `<div class="flex flex-wrap gap-1.5">${((c as SkillsContent).categories || []).flatMap((cat: any) =>
      (cat.skills || []).map((skill: string) => `<span class="rounded-full border px-3 py-1 text-xs font-medium" style="border-color:${PURPLE};color:${PURPLE}">${esc(skill)}</span>`)
    ).join('')}</div>`;
  }
  if (section.type === 'projects') {
    return `<div class="space-y-4">${((c as ProjectsContent).items || []).map((it: any) => `<div class="pl-4" style="border-left-width:3px;border-left-style:solid;border-color:${CYAN}">
      <div class="flex items-baseline justify-between"><h3 class="text-sm font-bold text-zinc-800">${esc(it.name)}</h3>${it.startDate ? `<span class="shrink-0 text-xs text-zinc-400">${esc(it.startDate)} – ${it.endDate ? esc(it.endDate) : (lang === 'zh' ? '至今' : 'Present')}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<div class="mt-1.5 flex flex-wrap gap-1">${it.technologies.map((t: string) => `<span class="rounded-full border px-2 py-0.5 text-[10px] font-medium" style="border-color:${PURPLE};color:${PURPLE}">${esc(t)}</span>`).join('')}</div>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'certifications') {
    return `<div class="space-y-2">${((c as CertificationsContent).items || []).map((it: any) =>
      `<div class="flex items-baseline justify-between"><div><span class="text-sm font-semibold text-zinc-800">${esc(it.name)}</span>${it.issuer ? `<span class="text-sm text-zinc-500"> — ${esc(it.issuer)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>`
    ).join('')}</div>`;
  }
  if (section.type === 'languages') {
    return `<div class="flex flex-wrap gap-1.5">${((c as LanguagesContent).items || []).map((it: any) =>
      `<span class="rounded-full border px-3 py-1 text-xs font-medium" style="border-color:${CYAN};color:${CYAN}">${esc(it.language)} — ${esc(it.proficiency)}</span>`
    ).join('')}</div>`;
  }
  if (section.type === 'github') {
    return `<div class="space-y-4">${((c as GitHubContent).items || []).map((it: any) => `<div class="pl-4" style="border-left-width:3px;border-left-style:solid;border-color:${CYAN}">
      <div class="flex items-baseline justify-between"><h3 class="text-sm font-bold text-zinc-800">${esc(it.name)}</h3><span class="shrink-0 text-xs text-zinc-400">\u2B50 ${it.stars?.toLocaleString() ?? 0}</span></div>
      ${it.language ? `<span class="text-xs" style="color:${CYAN}">${esc(it.language)}</span>` : ''}
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'custom') {
    return `<div class="space-y-4">${((c as CustomContent).items || []).map((it: any) => `<div class="pl-4" style="border-left-width:3px;border-left-style:solid;border-color:${CYAN}">
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold text-zinc-800">${esc(it.title)}</span>${it.subtitle ? `<span class="text-sm text-zinc-500"> — ${esc(it.subtitle)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'qr_codes') return buildQrCodesHtml(section);
  if (c.items) {
    return `<div class="space-y-2">${c.items.map((it: any) => `<div><span class="text-sm font-medium text-zinc-800">${esc(it.name || it.title || it.language)}</span>${it.description ? `<div class="text-sm text-zinc-600">${md(it.description)}</div>` : ''}</div>`).join('')}</div>`;
  }
  return '';
}

export function buildStartupHtml(resume: ResumeWithSections): string {
  const pi = getPersonalInfo(resume);
  const sections = visibleSections(resume);
  const contacts = [pi.age, pi.politicalStatus, pi.gender, pi.ethnicity, pi.hometown, pi.maritalStatus, pi.yearsOfExperience, pi.educationLevel, pi.email, pi.phone, pi.wechat, pi.location, pi.website].filter(Boolean);
  const PURPLE = '#6366f1';
  const CYAN = '#06b6d4';

  return `<div class="mx-auto max-w-[210mm] overflow-hidden bg-white shadow-lg" style="font-family:Inter,sans-serif">
    <div class="relative px-8 py-8 text-white" style="background:linear-gradient(135deg,${PURPLE},${CYAN})">
      <div class="absolute inset-0 opacity-10" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.1) 10px,rgba(255,255,255,0.1) 20px)"></div>
      <div class="relative flex items-center gap-5">
        ${pi.avatar ? `<img src="${esc(pi.avatar)}" alt="" class="shrink-0 rounded-2xl border-2 border-white/30 object-cover" style="height:4.5rem;width:4.5rem"/>` : ''}
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight">${esc(pi.fullName || 'Your Name')}</h1>
          ${pi.jobTitle ? `<p class="mt-1 text-base font-light text-white/80">${esc(pi.jobTitle)}</p>` : ''}
          ${contacts.length ? `<div class="mt-2 flex flex-wrap gap-2 text-sm text-white/70">${contacts.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="p-8">
      ${sections.map(s => `<div class="mb-6" data-section>
        <h2 class="mb-3 text-sm font-extrabold uppercase tracking-wider" style="color:${PURPLE}">${esc(s.title)}</h2>
        ${buildStartupSectionContent(s, resume.language || 'en')}
      </div>`).join('')}
    </div>
  </div>`;
}
