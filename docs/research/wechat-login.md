# 微信登录接入调研

> 目标：在 careerhelper 中支持"可配置的微信登录"。管理员配置后，登录页自动展示微信入口；已配置多种方式时并列展示（Google 直跳 OAuth，微信弹出扫码页）。本文件聚焦：**你需要去微信那边准备什么**。

---

## 1. 微信登录的两种形态（先选对类型！）

微信"登录"不是一个产品，而是 4 条不同的开放平台通道。选错了注册入口会白折腾。

| 场景 | 平台 | 产品名 | 适用 |
|---|---|---|---|
| **PC 网站扫码登录** ✅ | [open.weixin.qq.com](https://open.weixin.qq.com) | **网站应用** (Website App) | careerhelper 这种 Web 站点，**首选** |
| 移动 App 唤起微信 | open.weixin.qq.com | 移动应用 | iOS/Android 原生 App |
| 微信内 H5 静默授权 | mp.weixin.qq.com | 公众号网页授权 | 只在微信浏览器里打开的 H5 |
| 小程序登录 | mp.weixin.qq.com | 小程序 | 微信小程序 |

> **careerhelper 需要的是第一种：微信开放平台 → 网站应用**。产出 `AppID + AppSecret`，OAuth2 协议，标准授权码模式，可以在桌面浏览器弹出/嵌入二维码。

---

## 2. 你要去微信那边准备的东西（Checklist）

### 2.1 账号与资质
1. **注册微信开放平台账号**：<https://open.weixin.qq.com> （和公众号/小程序是**不同**的后台，别走错）
2. **开发者资质认证**
   - 需要 **企业主体**（营业执照）。**个人开发者无法申请网站应用**，这是目前最大的卡点。
   - 认证费：**300 元/年**（微信收的审核费）
   - 材料：营业执照、对公银行账户打款验证、法人身份证、企业联系人
   - 审核周期：1–7 个工作日
3. 如果没有公司主体，备选方案见第 6 节。

### 2.2 创建"网站应用"
认证通过后，在开放平台 → 管理中心 → 网站应用 → 创建应用：
- **应用名称 / 图标 / 简介**
- **官网地址**：必须是已备案的域名（中国大陆服务器需 ICP 备案；境外服务器可以用境外域名，但微信审核偏好备案域名）
- **授权回调域**：填一个主域名，例如 `careerhelper.app`，微信只校验"域名"不校验完整 URL。回调路径由我们自己定（如 `/api/auth/callback/wechat`）
- 审核：7 个工作日左右
- 审核通过后拿到：
  - `AppID`（公开）
  - `AppSecret`（保密，泄露必须立刻重置）

### 2.3 开通"微信登录"权限
网站应用创建后，**"微信登录"功能默认不一定开通**，需要在应用详情页点击"申请开通"，选择用途，再等一次审核。部分类目直接可用。

---

## 3. OAuth2 流程（落到代码层面）

微信网站应用用的是标准 OAuth2 Authorization Code，但参数命名跟 RFC 略有出入：

```
1. 前端点击"微信登录"
   → 跳 https://open.weixin.qq.com/connect/qrconnect
       ?appid=APPID
       &redirect_uri=URLENCODE(https://careerhelper.app/api/auth/callback/wechat)
       &response_type=code
       &scope=snsapi_login          ← 网站应用固定这个 scope
       &state=RANDOM_CSRF_TOKEN
       #wechat_redirect

2. 用户扫码确认 → 微信回跳
   → https://careerhelper.app/api/auth/callback/wechat?code=CODE&state=...

3. 后端用 code 换 access_token
   GET https://api.weixin.qq.com/sns/oauth2/access_token
       ?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
   ← 返回 { access_token, openid, unionid?, refresh_token, expires_in }

4. 拿用户信息（可选）
   GET https://api.weixin.qq.com/sns/userinfo
       ?access_token=...&openid=...&lang=zh_CN
   ← 返回 { openid, unionid, nickname, headimgurl, sex, ... }
```

### 关键身份字段
- **openid**：用户在**单个应用**内的唯一 ID。换个应用就变了。
- **unionid**：同一个微信开放平台账号下**所有应用共享**的统一 ID。**推荐用 unionid 作为用户主键**，方便以后接小程序/公众号时账号打通。
- 存库时两个都存，登录匹配优先 unionid，回退 openid。

---

## 4. UI/交互设计要点（对齐需求）

- 登录页根据配置动态渲染 provider 按钮：
  - Google：点击 → 直接跳 OAuth（现有流程）
  - 微信：点击 → **弹出 Modal 内嵌二维码**（而不是整页跳转），体验更好
- 两种嵌入二维码的方式：
  1. **整页跳转** `qrconnect`：简单，但离开当前页
  2. **内嵌 JS SDK**：<https://open.weixin.qq.com/connect/qrconnect> 提供的 `WxLogin` JS，在 Modal 的 `<div id="wx_login_container">` 里直接渲染二维码，可自定义样式表 `href` 参数隐藏微信默认边框
- 扫码成功后微信会把父页面 redirect 到 `redirect_uri`，所以 Modal 模式下通常开一个 `<iframe>` 或弹窗承载，回调后 `postMessage` 回主窗口关闭 Modal

---

## 5. careerhelper 代码侧要做的事（预告，不在本次调研范围内）

- `src/lib/config.ts` 增加 `auth.wechat.{enabled, appId, appSecret}`
- 登录页 provider 列表从 config 读取，动态渲染按钮
- NextAuth.js v5 自定义 Provider（微信不在官方 providers 里，需要手写 OAuth2Config，注意它返回的是 `openid` 不是 `sub`）
- DB schema：`users` 表增加 `wechat_openid` / `wechat_unionid` 列
- 回调路由：`src/app/api/auth/callback/wechat/route.ts`

---

## 6. 没有企业主体时的备选方案

1. **借用已认证主体**：朋友/公司帮忙在他们的开放平台下创建一个网站应用，把 AppID/Secret 给你用。灰色，不推荐长期。
2. **公众号扫码登录（服务号）**：服务号也能做"扫码关注即登录"，个人主体可以申请订阅号但**不能用网页授权登录**，必须服务号，服务号仍然需要企业认证。
3. **第三方登录聚合服务**：如 [Authing](https://authing.cn)、[登录即](https://www.loginradius.com) 等，他们持有资质，你作为租户接入，省掉审核。缺点是多一层依赖和成本。
4. **先不做微信，用手机号 + 短信验证码**（阿里云/腾讯云 SMS）覆盖国内用户，等业务跑起来再补微信。

---

## 7. 行动项 TODO

- [ ] 确认是否有企业主体可用（**这是最大前置条件**）
- [ ] 注册微信开放平台账号
- [ ] 提交开发者认证（300 元/年）
- [ ] 创建网站应用，提交审核
- [ ] 申请开通"微信登录"权限
- [ ] 拿到 AppID / AppSecret，录入到 `.env`
- [ ] 确认正式域名并完成 ICP 备案（如使用大陆服务器）
- [ ] 代码侧：设计 config schema + NextAuth Provider + DB 迁移

---

## 8. 参考链接

- 开放平台首页：<https://open.weixin.qq.com>
- 网站应用开发指南：<https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html>
- OAuth2 接口文档：<https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorized_API_call_UnionID.html>
- JS SDK（内嵌二维码）：<https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html>
