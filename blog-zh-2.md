# careerhelper – AI 智能简历生成器，50 套模板、拖拽编辑、职业照生成、多格式导出

## careerhelper 是什么

> 官网：https://careerhelper.app/zh | GitHub：https://github.com/liuzeyu03/careerhelper

careerhelper 是一款开源的 AI 智能简历生成器，基于 AI 技术帮助用户快速创建高质量的专业简历。工具完全免费，支持自托管部署，Docker 一行命令即可启动。内置 50 套专业设计模板，提供拖拽式所见即所得编辑器，集成 AI 对话优化、一键生成简历、语法检查、JD 匹配分析、职业照生成等丰富的 AI 能力。所有 AI 功能使用用户自己的 API Key，密钥仅存储在浏览器本地，数据安全有保障。careerhelper 支持 PDF、DOCX、HTML 等多格式导出，还可以生成分享链接直接发给 HR，让简历制作变得简单而智能。

![模板画廊](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/template-list.png)

## careerhelper 的主要功能

- **50 套专业模板**：覆盖经典、现代、极简、创意、ATS 友好、北欧风、瑞士风、日式等多种风格，适配不同行业和求职场景。
- **拖拽式编辑器**：所见即所得的编辑体验，支持拖拽排序、行内编辑、主题定制（颜色/字体/间距/页边距），撤销/重做最多 50 步。
- **AI 一键生成简历**：输入目标职位、工作年限和核心技能，AI 自动生成完整的结构化简历。
- **图片/PDF 简历解析**：上传已有简历的 PDF 或照片，AI 自动识别并提取全部内容填入编辑器。
- **AI 对话优化**：编辑器内集成 AI 聊天助手，用自然语言对话即可优化简历内容，支持多会话和历史记录。
- **语法与写作检查**：一键检测弱动词、模糊描述、语法错误，给出质量评分和修改建议，支持一键批量修复。
- **JD 匹配分析**：对比简历与职位描述的匹配度，提供关键词覆盖率、ATS 评分和改进建议。
- **AI 职业照生成**：上传普通照片，AI 自动生成职业风格证件照，可选择不同尺寸和背景。
- **二维码模块**：简历内添加个人网站、GitHub、LinkedIn 等链接的二维码，HR 扫码直达。
- **求职信生成**：基于简历和 JD 自动生成求职信，可选正式/友好/自信语气。
- **多语言翻译**：支持 10 种语言互译，保留专业术语原文。
- **多格式导出**：支持 PDF、智能一页 PDF、DOCX、HTML、TXT、JSON 六种格式。
- **链接分享**：生成分享链接发给 HR，支持密码保护和浏览次数统计。
- **数据安全**：AI 密钥存储在浏览器本地，服务端不保存任何 API Key；支持 SQLite 本地存储或 PostgreSQL。

## 如何使用 careerhelper

- **在线使用**：直接访问 [careerhelper.app/zh](https://careerhelper.app/zh)，无需注册即可开始使用。
- **自托管部署**：通过 Docker 一行命令部署（`docker run -d -p 3000:3000 -e AUTH_SECRET=<密钥> -v careerhelper-data:/app/data liuzeyu03/careerhelper:latest`），也可以本地 clone 源码开发。
- **配置 AI**：打开应用后，在 **设置 > AI** 中配置自己的 API Key、Base URL 和模型（支持 OpenAI、Anthropic、自定义端点）。
- **创建简历**：在仪表盘点击新建，选择一套模板开始编辑；也可以使用 AI 一键生成，或上传已有简历解析导入。

![简历编辑器](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/resume-edit.png)

- **编辑内容**：在拖拽编辑器中填写个人信息、教育背景、工作经历、项目经验等内容，点击任意字段直接编辑，拖拽调整模块顺序，右侧实时预览效果。

![AI 填充简历](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/AI%20填充简历.gif)

- **AI 智能优化**：
    - **对话优化**：打开 AI 聊天面板，用自然语言让 AI 帮你润色简历内容，AI 可以直接修改简历。
    - **语法检查**：点击语法检查按钮，AI 逐条检测问题并给出修改建议，一键批量修复。
    - **JD 匹配**：粘贴目标岗位 JD，AI 分析匹配度并给出针对性改进建议。

![AI 优化](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/ai%20优化.png)

![AI 语法检查](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/AI%20语法检查.png)

![JD 匹配分析](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/JD%20匹配分析.png)

- **生成职业照**：上传一张普通照片，选择尺寸和背景样式，AI 生成专业的职业证件照，直接下载使用。

![AI 职业照生成](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/职业照生成.png)

- **添加二维码**：在简历中添加二维码模块，自动为个人网站、GitHub、LinkedIn 等链接生成二维码，让纸质简历也能链接到线上内容。

![二维码模块](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/二维码.png)

- **自定义简历风格**：
    - **选择模板**：50 套模板自由切换，覆盖经典、现代、极简、创意等多种风格。
    - **调整主题**：自定义颜色、字体、间距和页边距，实时预览效果。
- **导出简历**：完成编辑后，点击导出按钮，选择 PDF、DOCX、HTML 等格式下载；也可以生成在线分享链接直接发给 HR。

![多格式导出](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/多项导出.png)

![创建分享链接](https://ladr-1258957911.cos.ap-guangzhou.myqcloud.com/careerhelper/images/创建分享链接.png)

## careerhelper 的应用场景

- **求职者**：快速创建专业简历，利用 AI 优化内容、匹配 JD，提升求职竞争力。
- **应届毕业生**：没有简历写作经验？AI 一键生成 + 对话优化，轻松完成第一份简历。
- **职场人士**：优化现有简历，语法检查确保措辞专业，JD 匹配分析帮助精准投递。
- **自由职业者**：定制个性化简历，二维码链接到个人作品集，展示专业技能。
- **HR / 猎头**：帮候选人快速整理简历，图片解析 + AI 优化一步到位。
- **隐私敏感用户**：支持自托管部署，数据存储在自己的服务器上，AI 密钥不经过第三方。

## 相关信息

- **开源协议**：Apache 2.0
- **官网**：https://careerhelper.app/zh
- **GitHub**：https://github.com/liuzeyu03/careerhelper
- **技术栈**：Next.js 16、React 19、Tailwind CSS 4、shadcn/ui、Drizzle ORM、Vercel AI SDK v6
- **部署方式**：Docker 一键部署 / 本地开发
- **支持语言**：中文、英文双语界面
- **数据库**：SQLite（默认，零配置）/ PostgreSQL
