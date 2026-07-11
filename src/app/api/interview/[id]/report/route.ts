import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel, extractAIConfig, AIConfigError, getJsonProviderOptions } from '@/lib/ai/provider';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { interviewReportSchema } from '@/lib/ai/interview-report-schema';
import { extractJson } from '@/lib/ai/extract-json';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id: sessionId } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const report = await interviewRepository.findReportBySessionId(sessionId);
  if (!report) return NextResponse.json({ error: 'No report found' }, { status: 404 });

  return NextResponse.json(report);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbReady;
    const { id: sessionId } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const session = await interviewRepository.findSession(sessionId);
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const existing = await interviewRepository.findReportBySessionId(sessionId);
    if (existing) return NextResponse.json(existing);

    const { model: modelId, locale = 'zh' } = await request.json();
    const aiConfig = extractAIConfig(request);
    const model = getModel(aiConfig, modelId);

    const roundsWithMessages = await interviewRepository.findAllMessagesBySessionId(sessionId);

    const conversationLog = roundsWithMessages.map(({ round, messages }) => {
      const config = round.interviewerConfig as any;
      return {
        interviewerType: round.interviewerType,
        interviewerName: config.name,
        roundId: round.id,
        messages: messages.map((m: { role: string; content: string; metadata: unknown }) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
      };
    });

    const lang = locale === 'zh' ? '中文' : 'English';

    const reportPrompt = locale === 'zh'
      ? `你是一位拥有丰富面试评估经验的人才评估专家。请基于以下面试对话记录，对候选人进行系统化、结构化的评估分析，生成专业的面试评估报告。请以 JSON 格式输出。

# 岗位要求

${session.jobDescription}

# 面试对话记录

${JSON.stringify(conversationLog, null, 2)}

# 评估要求

## 1. 综合评分（0-100）
基于候选人在所有轮次中的整体表现给出综合分数。评分参考标准：
- 90-100：远超岗位要求，强烈建议录用
- 75-89：符合或略超岗位要求，建议录用
- 60-74：基本符合，但有明显短板需考量
- 40-59：部分能力不足，慎重考虑
- 0-39：明显不满足岗位要求

## 2. 能力维度评分（6-8 个维度，每个维度 0-100）
根据岗位要求和面试表现，选择最相关的 6-8 个评估维度（如：技术深度、系统设计、编码能力、沟通表达、团队协作、学习能力、业务理解、问题解决等）。每个维度独立评分，用于生成雷达图。

## 3. 逐轮逐题评估
对每轮面试的每个问题进行独立评估：
- 评分（1-5 分）：1=未能回答 / 2=基础薄弱 / 3=基本合格 / 4=表现良好 / 5=表现优秀
- 亮点：候选人回答中值得肯定的具体表现
- 不足：回答中暴露的问题或可改进之处
- 参考思路：针对该问题，给出更好的回答方向或关键知识点提示，帮助候选人后续学习

## 4. 总体反馈
撰写 3-5 段专业、具有建设性的综合反馈，涵盖：候选人的核心优势、主要短板、与目标岗位的匹配度分析、以及是否推荐录用的建议。

## 5. 改进计划
按优先级（high/medium/low）列出候选人最需要提升的领域，每项附带：改进方向说明和推荐的具体学习资源（书籍、课程、文档、开源项目等）。

# 特殊标记处理
- \`"marked": true\`：候选人主动标记想复习的内容 → 在报告中重点标注
- \`"hinted": true\`：候选人请求了提示 → 在评估中标注为"使用了提示"
- \`"skipped": true\`：候选人跳过了该问题 → 标注为"已跳过"并相应扣分

请用中文输出报告内容。`
      : `You are an experienced talent assessment professional. Based on the following interview transcripts, produce a systematic, structured evaluation of the candidate. Output the report in JSON format.

# Job Requirements

${session.jobDescription}

# Interview Transcripts

${JSON.stringify(conversationLog, null, 2)}

# Evaluation Requirements

## 1. Overall Score (0-100)
Score based on the candidate's performance across all rounds:
- 90-100: Significantly exceeds requirements — strong hire
- 75-89: Meets or exceeds requirements — recommended hire
- 60-74: Generally meets requirements with notable gaps
- 40-59: Partially qualified — proceed with caution
- 0-39: Does not meet requirements

## 2. Competency Dimension Scores (6-8 dimensions, each 0-100)
Select 6-8 dimensions most relevant to the role (e.g., Technical Depth, System Design, Coding Ability, Communication, Teamwork, Learning Ability, Business Acumen, Problem Solving). Score each independently for the radar chart.

## 3. Per-Round Per-Question Evaluation
For each question in each round:
- Score (1-5): 1=Unable to answer / 2=Weak fundamentals / 3=Adequate / 4=Good / 5=Excellent
- Highlights: Specific strengths demonstrated in the answer
- Weaknesses: Issues or areas for improvement revealed
- Reference tips: Better answer direction or key knowledge points to help the candidate improve

## 4. Overall Feedback
Write 3-5 paragraphs of professional, constructive feedback covering: core strengths, main weaknesses, role-fit analysis, and hire recommendation.

## 5. Improvement Plan
List areas for improvement ranked by priority (high/medium/low), each with: description of what to improve and specific learning resources (books, courses, docs, open-source projects).

# Special Markers
- \`"marked": true\`: Candidate flagged this for review → highlight in report
- \`"hinted": true\`: Candidate requested a hint → note as "hint used" in evaluation
- \`"skipped": true\`: Candidate skipped the question → mark as "skipped" and factor into scoring

Output the report in English.`;

    const { text } = await generateText({
      model,
      maxOutputTokens: 16384,
      system: `You are a professional interview evaluator. Output your evaluation as a single valid JSON object. Do NOT wrap the JSON in markdown code fences. Do NOT wrap the result in an array.

The JSON MUST use EXACTLY these top-level keys (camelCase, English, no translation, no synonyms):
- "overallScore" (number 0-100)
- "dimensionScores" (array of { "dimension": string, "score": number 0-100, "maxScore": number })
- "roundEvaluations" (array of { "roundId": string, "interviewerType": string, "interviewerName": string, "score": number 0-100, "feedback": string, "questions": array of { "question": string, "answerSummary": string, "score": number 1-5, "highlights": string[], "weaknesses": string[], "referenceTips": string, "marked": boolean, "hinted": boolean, "skipped": boolean } })
- "overallFeedback" (string, 3-5 paragraphs)
- "improvementPlan" (array of { "priority": "high"|"medium"|"low", "area": string, "description": string, "resources": string[] })

DO NOT use alternative names like "comprehensiveScore", "capabilityScores", "direction", "feedback" instead of "overallFeedback", etc. Field names must match EXACTLY. All fields are REQUIRED.`,
      prompt: reportPrompt,
      providerOptions: getJsonProviderOptions(aiConfig),
    });

    const report = extractJson(text, interviewReportSchema);

    const saved = await interviewRepository.createReport({
      sessionId,
      overallScore: report.overallScore,
      dimensionScores: report.dimensionScores,
      roundEvaluations: report.roundEvaluations,
      overallFeedback: report.overallFeedback,
      improvementPlan: report.improvementPlan,
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof AIConfigError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
    console.error('POST /api/interview/[id]/report error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
