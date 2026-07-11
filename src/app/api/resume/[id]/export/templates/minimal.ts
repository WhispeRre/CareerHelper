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

function buildMinimalSectionContent(section: Section, lang: string = 'en'): string {
  const c = section.content as any;
  if (section.type === 'summary') return `<div class="text-sm text-zinc-600 leading-relaxed">${md((c as SummaryContent).text)}</div>`;
  if (section.type === 'work_experience') {
    return `<div class="space-y-4">${((c as WorkExperienceContent).items || []).map((it: any) => `<div>
      <p class="text-sm"><span class="font-medium text-zinc-800">${esc(it.position)}</span>${it.company ? ` <span class="text-zinc-500">/ ${esc(it.company)}</span>` : ''}</p>
      <p class="text-xs text-zinc-400">${esc(it.startDate)} - ${esc(it.endDate) || (it.current ? (lang === 'zh' ? '至今' : 'Present') : '')}</p>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<p class="mt-0.5 text-xs text-zinc-400">${esc(it.technologies.join(' / '))}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-500')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'education') {
    return `<div class="space-y-3">${((c as EducationContent).items || []).map((it: any) => `<div>
      <p class="text-sm"><span class="font-medium text-zinc-800">${esc(it.institution)}</span></p>
      <p class="text-sm text-zinc-600">${esc(degreeField(it.degree, it.field))}</p>
      <p class="text-xs text-zinc-400">${esc(it.startDate)} - ${esc(it.endDate) || (lang === 'zh' ? '至今' : 'Present')}</p>
      ${it.gpa ? `<p class="text-xs text-zinc-400">GPA: ${esc(it.gpa)}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-500')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'skills') {
    return `<div class="space-y-1">${((c as SkillsContent).categories || []).map((cat: any) =>
      `<p class="text-sm text-zinc-600">${esc((cat.skills || []).join(' / '))}</p>`
    ).join('')}</div>`;
  }
  if (section.type === 'projects') {
    return `<div class="space-y-4">${((c as ProjectsContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><span class="text-sm font-medium text-zinc-800">${esc(it.name)}</span>${it.startDate ? `<span class="text-xs text-zinc-400">${esc(it.startDate)} - ${it.endDate ? esc(it.endDate) : (lang === 'zh' ? '至今' : 'Present')}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<p class="mt-0.5 text-xs text-zinc-400">${esc(it.technologies.join(' / '))}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-4">${buildHighlights(it.highlights, 'text-sm text-zinc-500')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'github') {
    return `<div class="space-y-4">${((c as GitHubContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><span class="text-sm font-medium text-zinc-800">${esc(it.name)}</span><span class="text-xs text-zinc-400">${it.stars?.toLocaleString() ?? 0}</span></div>
      ${it.language ? `<span class="text-xs text-zinc-400">${esc(it.language)}</span>` : ''}
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'certifications') {
    return `<div class="space-y-1.5">${((c as CertificationsContent).items || []).map((it: any) =>
      `<div class="flex items-baseline justify-between"><div class="text-sm"><span class="font-medium text-zinc-800">${esc(it.name)}</span>${it.issuer ? `<span class="text-zinc-500"> — ${esc(it.issuer)}</span>` : ''}</div>${it.date ? `<span class="text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>`
    ).join('')}</div>`;
  }
  if (section.type === 'languages') {
    return `<div class="flex flex-wrap gap-x-6 gap-y-1">${((c as LanguagesContent).items || []).map((it: any) =>
      `<span class="text-sm"><span class="font-medium text-zinc-800">${esc(it.language)}</span><span class="text-zinc-400"> — ${esc(it.proficiency)}</span></span>`
    ).join('')}</div>`;
  }
  if (section.type === 'custom') {
    return `<div class="space-y-3">${((c as CustomContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><div class="text-sm"><span class="font-medium text-zinc-800">${esc(it.title)}</span>${it.subtitle ? `<span class="text-zinc-500"> — ${esc(it.subtitle)}</span>` : ''}</div>${it.date ? `<span class="text-xs text-zinc-400">${esc(it.date)}</span>` : ''}</div>
      ${it.description ? `<div class="mt-0.5 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'qr_codes') return buildQrCodesHtml(section);
  if (c.items) {
    return `<div class="space-y-2">${c.items.map((it: any) => `<div><span class="text-sm font-medium text-zinc-700">${esc(it.name || it.title || it.language)}</span>${it.description ? `<div class="text-sm text-zinc-500">${md(it.description)}</div>` : ''}</div>`).join('')}</div>`;
  }
  return '';
}

export function buildMinimalHtml(resume: ResumeWithSections): string {
  const pi = getPersonalInfo(resume);
  const sections = visibleSections(resume);

  return `<div class="mx-auto max-w-[210mm] bg-white shadow-lg" style="font-family:Inter,sans-serif">
    <div class="mb-8">
      <div class="flex items-center gap-3">
        ${pi.avatar ? `<img src="${esc(pi.avatar)}" alt="" class="h-12 w-12 shrink-0 rounded-full object-cover"/>` : ''}
        <div>
          <h1 class="text-xl font-medium text-zinc-900">${esc(pi.fullName || 'Your Name')}</h1>
          <div class="mt-1 flex flex-wrap gap-3 text-sm text-zinc-500">
            ${pi.jobTitle ? `<span>${esc(pi.jobTitle)}</span>` : ''}
            ${pi.age ? `<span>${esc(pi.age)}</span>` : ''}
            ${pi.politicalStatus ? `<span>${esc(pi.politicalStatus)}</span>` : ''}
            ${pi.gender ? `<span>${esc(pi.gender)}</span>` : ''}
            ${pi.ethnicity ? `<span>${esc(pi.ethnicity)}</span>` : ''}
            ${pi.hometown ? `<span>${esc(pi.hometown)}</span>` : ''}
            ${pi.maritalStatus ? `<span>${esc(pi.maritalStatus)}</span>` : ''}
            ${pi.yearsOfExperience ? `<span>${esc(pi.yearsOfExperience)}</span>` : ''}
            ${pi.educationLevel ? `<span>${esc(pi.educationLevel)}</span>` : ''}
            ${pi.email ? `<span>${esc(pi.email)}</span>` : ''}
            ${pi.phone ? `<span>${esc(pi.phone)}</span>` : ''}
            ${pi.wechat ? `<span>${esc(pi.wechat)}</span>` : ''}
            ${pi.location ? `<span>${esc(pi.location)}</span>` : ''}
            ${pi.linkedin ? `<span>LinkedIn: ${esc(pi.linkedin)}</span>` : ''}
            ${pi.github ? `<span>GitHub: ${esc(pi.github)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
    ${sections.map(s => `<div class="mb-6" data-section>
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">${esc(s.title)}</h2>
      ${buildMinimalSectionContent(s, resume.language || 'en')}
    </div>`).join('')}
  </div>`;
}
