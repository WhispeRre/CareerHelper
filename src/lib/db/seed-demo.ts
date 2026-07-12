import { users, resumes, resumeSections } from './schema';

/**
 * Seed a demo-fingerprint user with a sample resume.
 * Called automatically when the database is empty.
 */
export async function seedDemoUser(db: any) {
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: 'Jacky',
    authType: 'fingerprint',
    fingerprint: 'demo-fingerprint',
  });

  const resumeId = crypto.randomUUID();
  await db.insert(resumes).values({
    id: resumeId,
    userId,
    title: '示例简历 - Jacky',
    template: 'modern',
    language: 'zh',
  });

  const sections = [
    {
      type: 'personal_info',
      title: '个人信息',
      sortOrder: 0,
      content: {
        fullName: 'Jacky',
        jobTitle: 'AI Product Engineer',
        email: 'jacky@example.com',
        phone: '+1 415-555-0198',
        location: 'San Francisco, CA',
        website: 'https://jacky.dev',
      },
    },
    {
      type: 'summary',
      title: '个人简介',
      sortOrder: 1,
      content: {
        text: 'AI 产品工程师，专注于把大模型能力落地到求职、生产力和内容生成工具中。熟悉 Next.js、TypeScript、Vercel AI SDK、PostgreSQL 和产品原型设计，能够从需求拆解、前端实现、AI 工作流设计到上线部署独立推进。',
      },
    },
    {
      type: 'work_experience',
      title: '工作经历',
      sortOrder: 2,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            company: 'CareerHelper Labs',
            position: 'AI Product Engineer',
            location: 'San Francisco, CA',
            startDate: '2024-01',
            endDate: null,
            current: true,
            description: '负责 AI 简历生成、JD 匹配分析、语法优化和模拟面试模块。',
            highlights: [
              '设计基于 Vercel AI SDK 的流式生成体验，让用户可以实时查看 AI 生成结果',
              '搭建多模型配置能力，支持 OpenAI、Anthropic 和自定义 API 端点',
              '优化 PDF / 图片简历解析流程，提高结构化字段识别准确率',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'Horizon Apps',
            position: 'Full Stack Developer',
            location: 'Remote',
            startDate: '2021-06',
            endDate: '2023-12',
            current: false,
            description: '负责 SaaS 仪表盘、用户系统和导出服务。',
            highlights: [
              '使用 Next.js 和 PostgreSQL 构建多租户后台，支持团队级权限管理',
              '实现 PDF / DOCX / HTML 多格式导出能力，覆盖核心业务报表场景',
              '建立自动化部署和 Docker 镜像发布流程，减少手动发布成本',
            ],
          },
          {
            id: crypto.randomUUID(),
            company: 'Pixel Studio',
            position: 'Frontend Developer',
            location: 'Los Angeles, CA',
            startDate: '2019-07',
            endDate: '2021-05',
            current: false,
            description: '负责高保真 Web 页面和组件库开发。',
            highlights: [
              '搭建可复用组件系统，统一多个项目的按钮、表单和布局规范',
              '改善移动端响应式体验，提高关键页面在小屏设备上的可用性',
            ],
          },
        ],
      },
    },
    {
      type: 'education',
      title: '教育背景',
      sortOrder: 3,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            institution: 'University of California, Berkeley',
            degree: 'B.S.',
            field: 'Computer Science',
            location: 'Berkeley, CA',
            startDate: '2015-09',
            endDate: '2019-06',
            gpa: '',
            highlights: ['Coursework: Human-Computer Interaction, Database Systems, Machine Learning'],
          },
        ],
      },
    },
    {
      type: 'skills',
      title: '技能特长',
      sortOrder: 4,
      content: {
        categories: [
          { id: crypto.randomUUID(), name: 'Frontend', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
          { id: crypto.randomUUID(), name: 'AI', skills: ['Vercel AI SDK', 'Prompt Engineering', 'OpenAI API', 'RAG Basics'] },
          { id: crypto.randomUUID(), name: 'Backend', skills: ['Node.js', 'PostgreSQL', 'SQLite', 'Docker'] },
          { id: crypto.randomUUID(), name: 'Product', skills: ['UX Prototyping', 'Analytics', 'A/B Testing'] },
        ],
      },
    },
    {
      type: 'projects',
      title: '项目经历',
      sortOrder: 5,
      content: {
        items: [
          {
            id: crypto.randomUUID(),
            name: 'CareerHelper AI Resume Platform',
            url: 'https://github.com/WhispeRre/CareerHelper',
            startDate: '2024-10',
            endDate: '2025-02',
            description: '基于 AI 的智能简历生成与优化平台，支持多模板、实时预览、简历解析和 AI 对话式编辑。',
            technologies: ['Next.js', 'React', 'Tailwind CSS', 'Vercel AI SDK'],
            highlights: [
              '实现从职位描述到简历内容的生成链路，支持用户按模块继续优化',
              '设计简历解析、语法检查、JD 匹配分析等 AI 工作流',
            ],
          },
          {
            id: crypto.randomUUID(),
            name: 'AI Mock Interview Coach',
            url: 'https://jacky.dev/interview-coach',
            startDate: '2024-04',
            endDate: '2024-09',
            description: '面向求职者的 AI 模拟面试工具，可根据 JD 和简历生成追问与反馈。',
            technologies: ['Next.js', 'OpenAI API', 'PostgreSQL', 'Recharts'],
            highlights: [
              '设计多角色面试官机制，覆盖 HR、技术、行为和项目深挖场景',
              '生成结构化面试报告，包含评分、优势、风险点和下一步练习建议',
            ],
          },
          {
            id: crypto.randomUUID(),
            name: 'Resume Export Pipeline',
            url: 'https://jacky.dev/export-pipeline',
            startDate: '2023-08',
            endDate: '2023-12',
            description: '用于将在线简历稳定导出为 PDF、DOCX、HTML 和 JSON 的服务。',
            technologies: ['Puppeteer', 'Chromium', 'DOCX', 'Docker'],
            highlights: [
              '优化 PDF 渲染流程，减少分页错位和字体缺失问题',
              '封装统一导出接口，便于不同模板复用同一套导出逻辑',
            ],
          },
        ],
      },
    },
  ];

  for (const section of sections) {
    await db.insert(resumeSections).values({
      id: crypto.randomUUID(),
      resumeId,
      ...section,
    } as any);
  }

  console.log('[DB] Auto-seed complete: demo user created');
}
