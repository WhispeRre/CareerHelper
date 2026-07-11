# 微信支付接入调研

> 目标：在 careerhelper 中接入微信支付，支持会员/积分购买。本文聚焦：**你需要去微信那边准备什么 + 技术选型**。

---

## 1. 微信支付的产品形态（选对场景）

| 场景 | 产品名 | 适用 | careerhelper 需要？ |
|---|---|---|---|
| **PC 网站扫码付款** ✅ | **Native 支付** | Web 站点，后端生成二维码让用户扫 | **首选** |
| H5 网页跳转 | H5 支付 | 手机浏览器（非微信内）调起微信 App | 移动端 Web 可加 |
| 微信内网页 | JSAPI 支付 | 微信浏览器内 H5 / 公众号 | 看是否做公众号 |
| App 内支付 | App 支付 | 原生 App | 暂不需要 |
| 小程序支付 | 小程序支付 | 微信小程序 | 暂不需要 |
| 刷卡/付款码 | 付款码支付 | 线下扫枪 | 不需要 |

> **careerhelper 桌面端首选 Native（扫码支付）**，未来做移动端 Web 再补 H5 支付。两者可以共用同一个商户号。

---

## 2. 你要去微信那边准备的东西（Checklist）

### 2.1 账号与资质（最大前置卡点）

1. **必须企业主体**：个人无法开通微信支付商户号。资料：
   - 营业执照
   - 法人身份证
   - 对公银行账户（结算户，回款打到这里）
   - 经营类目（会影响费率和风控）
2. **注册微信支付商户平台**：<https://pay.weixin.qq.com>
3. **两种开户路径**：
   - **独立商户号**（推荐）：直接去 pay.weixin.qq.com 注册，审核 1–5 工作日
   - **服务商模式**：挂靠在服务商下面，适合 SaaS 分账，前期不需要
4. **费率**：标准类目 **0.6%**（按交易金额扣手续费，T+1 结算）
5. **结算周期**：默认 T+1 自动提现到对公户，新商户前 90 天可能有冻结保证金

### 2.2 绑定 AppID（关键一步）

微信支付必须**绑定到一个 AppID**上使用。可选：
- **微信开放平台 网站应用 AppID**（跟微信登录共用这一个 ✅，推荐）
- 公众号 AppID
- 小程序 AppID
- 移动应用 AppID

> **最佳实践**：微信登录和微信支付共用同一个"网站应用 AppID"，账号体系天然打通（同一个 unionid）。如果登录调研已经在推进，这里直接复用。

绑定流程：商户平台 → 产品中心 → AppID 账号管理 → 关联 AppID → 对方（开放平台）确认授权

### 2.3 开通 Native 支付产品

商户平台 → 产品中心 → Native 支付 → 申请开通。部分类目秒开，部分要审核。

### 2.4 拿到的凭证（保密等级⭐⭐⭐⭐⭐）

开通完成后你会拿到：

| 凭证 | 用途 | 去哪拿 |
|---|---|---|
| **商户号 mchid** | 标识商户 | 商户平台首页 |
| **APIv3 密钥** | 对称加密回调通知 | 商户平台 → API 安全 → 自己设置一个 32 位字符串 |
| **商户 API 证书** (apiclient_cert.pem / apiclient_key.pem) | 调用退款等敏感接口的客户端证书 | 商户平台 → API 安全 → 下载证书工具 |
| **微信支付平台证书 / 公钥** | 验签回调 | APIv3 通过接口下载，会自动轮换 |
| **AppID + AppSecret** | 同登录 | 开放平台 |

> **安全红线**：APIv3 密钥和证书私钥绝不能进 Git，必须走环境变量 / 密钥管理服务。泄露必须立刻在商户平台重置。

### 2.5 域名与回调

- **支付结果通知 URL**：必须是 **HTTPS** 公网可访问，例如 `https://careerhelper.app/api/payment/wechat/notify`
- 域名需要能备案（大陆服务器）或境外可访问
- 微信会 POST 加密回调，必须 **5 秒内返回 `{"code":"SUCCESS","message":"成功"}`**，否则最多重试 15 次

---

## 3. APIv3 下单流程（Native 支付）

> 微信支付目前主推 **APIv3**（REST + JSON + AES-GCM），老的 APIv2（XML + MD5）不要用。

```
1. 用户点"购买" → 前端请求后端 /api/payment/wechat/create
2. 后端调用微信下单接口
   POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
   Headers: Authorization: WECHATPAY2-SHA256-RSA2048 ...(商户私钥签名)
   Body: {
     appid, mchid,
     description: "careerhelper Pro 会员-月",
     out_trade_no: "本地订单号(唯一)",
     notify_url: "https://careerhelper.app/api/payment/wechat/notify",
     amount: { total: 3000, currency: "CNY" }   // 单位：分
   }
   ← 返回 { code_url: "weixin://wxpay/bizpayurl?pr=..." }

3. 后端把 code_url 生成二维码 (qrcode 库)，前端 Modal 展示

4. 用户用微信扫码 → 支付 → 微信异步 POST 回调到 notify_url
   - 回调 body 是 APIv3 加密的，需要用 APIv3 密钥 AES-GCM 解密
   - 必须用微信平台证书对请求头 Wechatpay-Signature 验签
   - 验签通过 → 查本地订单 → 幂等更新为已支付 → 发货（开会员/加积分）
   - 5 秒内返回 {"code":"SUCCESS"}

5. 前端轮询 /api/payment/status?out_trade_no=... 或 WebSocket 推送，跳转到成功页
```

### 关键要点
- **金额单位是"分"**，3000 = 30.00 元，少一个零就事故
- **out_trade_no 必须幂等**：同一订单重复下单要返回同一个 code_url
- **回调必须验签 + 解密 + 幂等**：微信会重复投递，数据库状态机要处理"已支付的订单再次收到 SUCCESS"的情况
- **对账**：每天 T+1 拉当日对账单接口，和本地订单比对，防漏单

---

## 4. 退款 / 关单 / 查询

| 接口 | 用途 |
|---|---|
| `/v3/refund/domestic/refunds` | 发起退款（需商户证书） |
| `/v3/pay/transactions/out-trade-no/{out_trade_no}` | 查询订单状态（兜底/补单） |
| `/v3/pay/transactions/out-trade-no/{out_trade_no}/close` | 关闭未支付订单 |
| `/v3/bill/tradebill` | 下载对账单 |

---

## 5. careerhelper 代码侧要做的事（预告）

- **SDK 选型**：
  - 官方 Node：[`wechatpay-node-v3`](https://github.com/klover2/wechatpay-node-v3-ts)（社区维护，TS 友好，推荐）
  - 或手搓 fetch + 签名（控制力强，但要自己实现 SHA256-RSA2048 签名、AES-GCM 解密、平台证书轮换）
- `src/lib/config.ts` 增加 `payment.wechat.{enabled, mchid, appId, apiV3Key, certSerial, privateKeyPath, notifyUrl}`
- DB schema：新增 `orders` 表（out_trade_no, user_id, amount, status, provider, transaction_id, paid_at, raw_notify）
- 路由：
  - `POST /api/payment/wechat/create` 下单 + 返回二维码
  - `POST /api/payment/wechat/notify` 回调（验签 + 解密 + 幂等发货）
  - `GET  /api/payment/status` 轮询状态
- 幂等设计：订单状态机 `pending → paid → delivered`，回调只推进不回退
- 监控：回调失败 / 签名失败 / 发货失败要告警

---

## 6. 没有企业主体时的备选方案

1. **聚合支付服务商**：Ping++、BeeCloud、Stripe（国内通道）、易宝等，持牌方提供商户号，你作为子商户接入。费率略高（~0.8–1%），但省掉开户审核
2. **Stripe 国际版**：如果面向海外用户，Stripe + Alipay/WeChat Pay 方式也能收微信，但结算到境外账户
3. **个人收款**：微信"收款码" / "个人转账"**绝对不要**拿来做业务支付 —— 没有回调、没有对账、违反微信规则，随时封号
4. **先不做微信支付**：用 Stripe（海外）+ 支付宝当面付（个人也能申请部分类目），等业务跑起来再补

---

## 7. 费率 & 成本测算

| 项目 | 成本 |
|---|---|
| 开户费 | 0 元 |
| 交易手续费 | **0.6%**（标准类目） |
| 结算周期 | T+1 |
| 提现手续费 | 0（自动结算到对公户） |
| 证书 | 免费 |
| 保证金 | 部分类目新商户冻结 ~1000 元 |

> 举例：月 GMV 10 万，手续费 600 元，占比很低，相比 Stripe 的 2.9% + 0.3U 便宜很多。

---

## 8. 行动项 TODO

- [ ] **确认企业主体可用**（和微信登录共用前置条件）
- [ ] 注册 pay.weixin.qq.com 商户号
- [ ] 提交开户资料，等审核（1–5 工作日）
- [ ] 绑定开放平台网站应用 AppID（和登录复用）
- [ ] 申请开通 Native 支付
- [ ] 设置 APIv3 密钥、下载商户证书
- [ ] 配置回调 URL 域名（HTTPS + 备案）
- [ ] 选 SDK（`wechatpay-node-v3` vs 手搓）
- [ ] 设计订单表 + 状态机
- [ ] 实现下单 / 回调 / 查询 / 退款 四个接口
- [ ] 写对账脚本 + 监控告警

---

## 9. 避坑清单

1. ❌ 不要用 APIv2（XML + MD5），已不推荐，新接口都在 v3
2. ❌ 金额单位是"分"不是"元"
3. ❌ 回调不要只看 return_code，必须验签 + 解密 + 查本地订单
4. ❌ 发货逻辑必须幂等，回调会重复投递
5. ❌ 证书和 APIv3 密钥不要进 Git
6. ❌ 别用个人微信收款做业务
7. ❌ notify_url 不能带 query 参数（微信明确规定）
8. ✅ 每天跑对账脚本，防漏单/错单
9. ✅ 本地订单 out_trade_no 建议用 UUID 或雪花 ID，别用自增
10. ✅ 测试环境用小额（1 分钱）真实支付验证全链路，微信没有沙箱（v3 沙箱已下线）

---

## 10. 参考链接

- 商户平台：<https://pay.weixin.qq.com>
- APIv3 官方文档：<https://pay.weixin.qq.com/docs/merchant/apis/native-payment/introduction.html>
- Native 下单：<https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsons/native-prepay.html>
- 回调通知：<https://pay.weixin.qq.com/docs/merchant/apis/native-payment/payment-notice.html>
- Node SDK：<https://github.com/klover2/wechatpay-node-v3-ts>
- 签名工具/证书下载：<https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-generation.html>
