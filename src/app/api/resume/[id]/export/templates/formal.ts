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

function buildFormalSectionContent(section: Section, lang: string): string {
  const c = section.content as any;
  const DG = '#004d40';
  if (section.type === 'summary') return `<div class="text-sm leading-relaxed text-zinc-600">${md((c as SummaryContent).text)}</div>`;
  if (section.type === 'work_experience') {
    return `<div class="space-y-4">${((c as WorkExperienceContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold" style="color:${DG}">${esc(it.position)}</span>${it.company ? `<span class="text-sm text-zinc-600">, ${esc(it.company)}</span>` : ''}${it.location ? `<span class="text-sm text-zinc-400"> (${esc(it.location)})</span>` : ''}</div><span class="shrink-0 text-xs italic text-zinc-400">${esc(it.startDate)} – ${esc(it.endDate) || (it.current ? (lang === 'zh' ? '至今' : 'Present') : '')}</span></div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<p class="mt-0.5 text-xs text-zinc-400">${lang === 'zh' ? '技术栈' : 'Tech'}: ${esc(it.technologies.join(', '))}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-5">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'education') {
    return `<div class="space-y-3">${((c as EducationContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold" style="color:${DG}">${esc(it.institution)}</span>${it.location ? `<span class="text-sm text-zinc-400"> (${esc(it.location)})</span>` : ''}</div><span class="shrink-0 text-xs italic text-zinc-400">${esc(it.startDate)} – ${esc(it.endDate) || (lang === 'zh' ? '至今' : 'Present')}</span></div>
      <p class="text-sm text-zinc-600">${esc(degreeField(it.degree, it.field))}</p>
      ${it.gpa ? `<p class="text-xs text-zinc-500">GPA: ${esc(it.gpa)}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-5">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'skills') {
    return `<div class="space-y-1">${((c as SkillsContent).categories || []).map((cat: any) =>
      `<div class="flex text-sm"><span class="w-32 shrink-0 font-semibold" style="color:${DG}">${esc(cat.name)}:</span><span class="text-zinc-600">${esc((cat.skills || []).join(', '))}</span></div>`
    ).join('')}</div>`;
  }
  if (section.type === 'projects') {
    return `<div class="space-y-3">${((c as ProjectsContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><span class="text-sm font-bold" style="color:${DG}">${esc(it.name)}</span>${it.startDate ? `<span class="shrink-0 text-xs italic text-zinc-400">${esc(it.startDate)} – ${it.endDate ? esc(it.endDate) : (lang === 'zh' ? '至今' : 'Present')}</span>` : ''}</div>
      ${it.description ? `<div class="mt-1 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
      ${it.technologies?.length ? `<p class="mt-0.5 text-xs text-zinc-400">${lang === 'zh' ? '技术栈' : 'Tech'}: ${esc(it.technologies.join(', '))}</p>` : ''}
      ${it.highlights?.length ? `<ul class="mt-1 list-disc pl-5">${buildHighlights(it.highlights, 'text-sm text-zinc-600')}</ul>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'certifications') {
    return `<div class="space-y-1.5">${((c as CertificationsContent).items || []).map((it: any) =>
      `<div class="flex items-baseline justify-between text-sm"><div><span class="font-bold" style="color:${DG}">${esc(it.name)}</span>${it.issuer ? `<span class="text-zinc-600"> — ${esc(it.issuer)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs italic text-zinc-400">${esc(it.date)}</span>` : ''}</div>`
    ).join('')}</div>`;
  }
  if (section.type === 'languages') {
    return `<div class="space-y-1">${((c as LanguagesContent).items || []).map((it: any) =>
      `<div class="flex text-sm"><span class="w-32 shrink-0 font-semibold" style="color:${DG}">${esc(it.language)}:</span><span class="text-zinc-600">${esc(it.proficiency)}</span></div>`
    ).join('')}</div>`;
  }
  if (section.type === 'github') {
    return `<div class="space-y-3">${((c as GitHubContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><span class="text-sm font-bold" style="color:${DG}">${esc(it.name)}</span><span class="shrink-0 text-xs italic text-zinc-400">\u2B50 ${it.stars?.toLocaleString() ?? 0}</span></div>
      ${it.language ? `<span class="text-xs text-zinc-500">${esc(it.language)}</span>` : ''}
      ${it.description ? `<div class="mt-0.5 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'custom') {
    return `<div class="space-y-3">${((c as CustomContent).items || []).map((it: any) => `<div>
      <div class="flex items-baseline justify-between"><div><span class="text-sm font-bold" style="color:${DG}">${esc(it.title)}</span>${it.subtitle ? `<span class="text-sm text-zinc-500"> — ${esc(it.subtitle)}</span>` : ''}</div>${it.date ? `<span class="shrink-0 text-xs italic text-zinc-400">${esc(it.date)}</span>` : ''}</div>
      ${it.description ? `<div class="mt-0.5 text-sm text-zinc-600">${md(it.description)}</div>` : ''}
    </div>`).join('')}</div>`;
  }
  if (section.type === 'qr_codes') return buildQrCodesHtml(section);
  if (c.items) {
    return `<div class="space-y-2">${c.items.map((it: any) => `<div><span class="text-sm font-medium" style="color:${DG}">${esc(it.name || it.title || it.language)}</span>${it.description ? `<div class="text-sm text-zinc-600">${md(it.description)}</div>` : ''}</div>`).join('')}</div>`;
  }
  return '';
}

export function buildFormalHtml(resume: ResumeWithSections): string {
  const pi = getPersonalInfo(resume);
  const sections = visibleSections(resume);
  const contacts = [pi.age, pi.politicalStatus, pi.gender, pi.ethnicity, pi.hometown, pi.maritalStatus, pi.yearsOfExperience, pi.educationLevel, pi.email, pi.phone, pi.wechat, pi.location, pi.website].filter(Boolean);
  const DG = '#004d40';

  return `<div class="mx-auto max-w-[210mm] bg-white shadow-lg" style="font-family:Georgia,'Times New Roman',serif">
    <div class="mb-6 border-b-2 pb-4" style="border-color:${DG}">
      <div class="flex items-center justify-center gap-4">
        ${pi.avatar ? `<img src="${esc(pi.avatar)}" alt="" class="h-16 w-16 shrink-0 rounded-full border-2 object-cover" style="border-color:${DG}"/>` : ''}
        <div class="text-center">
          <h1 class="text-2xl font-bold" style="color:${DG}">${esc(pi.fullName || 'Your Name')}</h1>
          ${pi.jobTitle ? `<p class="mt-0.5 text-base text-zinc-500">${esc(pi.jobTitle)}</p>` : ''}
        </div>
      </div>
      ${contacts.length || pi.linkedin || pi.github ? `<div class="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500">${contacts.map(c => `<span>${esc(c)}</span>`).join('')}${pi.linkedin ? `<span>LinkedIn: ${esc(pi.linkedin)}</span>` : ''}${pi.github ? `<span>GitHub: ${esc(pi.github)}</span>` : ''}</div>` : ''}
    </div>
    ${sections.map(s => `<div class="mb-5" data-section>
      <div class="mb-2 flex items-center gap-2">
        <h2 class="shrink-0 text-sm font-bold uppercase tracking-wider" style="color:${DG}">${esc(s.title)}</h2>
        <div class="h-px flex-1 bg-zinc-200"></div>
      </div>
      ${buildFormalSectionContent(s, resume.language || 'en')}
    </div>`).join('')}
  </div>`;
}
