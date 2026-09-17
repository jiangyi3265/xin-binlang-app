# xin-binlang-app

倌榔兑奖系统的 uni-app 客户端，提供消费者兑奖、门店核销与销售拓店工作台。

## 项目简介

消费者可以免登录浏览活动、规则、奖品和门店，在主动兑奖或查看个人记录时发起微信登录，输入包装内数字码，自选 1 张牌翻开结果。支持谢谢惠顾、到店补差价换购一袋商品，以及在微信小程序内领取现金红包。门店人员通过账号密码登录，扫码查看商品与补款金额，确认收到补款后核销；销售人员维护本人门店并创建门店账号。

页面使用倌榔深蓝包装纹样、蓝金配色，以及用户提供的 30 元棕金装和 50 元深蓝装图片。红包领取以服务端查询的微信转账结果为准；微信收款确认页面打开成功不会被显示为已到账。商户配置及业务流程见 [后端奖励说明](https://github.com/jiangyi3265/xin-binlang-backend/blob/main/docs/guanlang-rewards.md)。

目前包含 27 个页面，分别位于消费者主包、门店分包和销售分包。业务数据统一来自 xin-binlang-backend，活动与资源由 xin-binlang-admin 配置。客户端不在本地决定中奖结果或执行离线核销。

微信小程序首页提供“分享给好友”按钮，所有消费者页面支持右上角菜单转发给好友或群聊。转发统一打开公开活动首页，使用包内倌榔包装图，不携带兑换码、订单号或用户身份，也不使用凭证页截图。分享由用户主动触发，不影响兑奖次数和奖项；H5 不显示微信小程序专用按钮。实现使用 [uni-app 官方分享接口](https://uniapp.dcloud.io/api/plugins/share)。

## 技术栈

- uni-app，Vue 3.4，JavaScript，Vue 单文件组件。
- Vite 5、@dcloudio/vite-plugin-uni，SCSS / Sass。
- 微信小程序及 H5 构建目标，uni.request 等跨端 API。
- pnpm 10 与 pnpm-lock.yaml；Node.js 24 用于本项目构建及 CI。
- 自定义通用组件、页面状态模块及二维码编码与结构校验。

## 关联仓库

| 项目 | 说明 | GitHub |
| --- | --- | --- |
| xin-binlang-backend | 后端服务 | [xin-binlang-backend](https://github.com/jiangyi3265/xin-binlang-backend) |
| xin-binlang-admin | 管理后台 | [xin-binlang-admin](https://github.com/jiangyi3265/xin-binlang-admin) |
| xin-binlang-app | 用户端 | [xin-binlang-app](https://github.com/jiangyi3265/xin-binlang-app) |

## 快速启动

```bash
git clone https://github.com/jiangyi3265/xin-binlang-app.git 槟榔小程序端
cd 槟榔小程序端
pnpm install --frozen-lockfile
```

需要 Node.js 24 和 pnpm 10。复制 `.env.example` 为 `.env`（PowerShell：`Copy-Item .env.example .env`）。示例默认连接本项目后端 `http://127.0.0.1:8897`。

```bash
pnpm run dev:h5
```

H5 开发服务使用 `http://127.0.0.1:5273/app/`。同时按 [后端说明](https://github.com/jiangyi3265/xin-binlang-backend#快速启动) 启动 API。商品、奖品和门店图片来自后端托管的 admin 仓库 `assets/`，完整联调需检出该仓库。

### 检查与生产构建

```bash
pnpm run check
pnpm run build:h5
pnpm run build:mp-weixin
```

- H5 产物：`dist/build/h5`，由后端 `H5_DIR` 指向并在 `/app/` 提供。
- 微信小程序产物：`dist/build/mp-weixin`，导入微信开发者工具。
- `check` 验证页面路由、图标、组件、资源体积、游客浏览、二维码结构，以及微信登录配置与顶部安全区。
- 构建完成后的 `sync-mp-static.mjs` 确保小程序静态资源和 tabBar 图标完整。

`manifest.json` 已配置微信 AppID `wx8887b61da8f2edd6`。H5 使用 `https://xbinglangs.oksja.cn/app/`，CI 和发布流程均构建至该生产 API。uni-app 的 DCloud AppID 保持待配置，仅在后续需要对应原生 App 能力时补充。微信登录配置：

1. 微信小程序使用 `config/wechat.mjs` 中的本项目 HTTPS API；H5 环境通过 `VITE_API_ORIGIN` 和 `VITE_USE_WECHAT_LOGIN` 单独配置。
2. 在微信公众平台设置本项目 request 合法域名。
3. 在后端配置对应 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`，如需消息通知再配置订阅模板。

微信小程序的 API 地址独立保存在 `config/wechat.mjs`，始终使用真实微信登录；HBuilderX 运行、真机预览和正式构建均不会读取 H5 的关闭登录开关或缓存接口地址。`.env` 中的回环地址和 `VITE_USE_WECHAT_LOGIN=false` 仅影响 H5 调试。调试小程序可运行 `pnpm run dev:mp-weixin`；正式包请运行 `pnpm run build:mp-weixin` 后导入 `dist/build/mp-weixin`，重新生成预览二维码或上传开发版本。已上传的旧包不会随 GitHub 推送自动更新。

所有 `VITE_*` 变量都会进入客户端构建产物，只能存放公开配置。AppSecret、数据库密码及签名密钥只存于后端。本地开发默认使用回环地址；生产构建在 `.env.production` 中配置上述 API 和微信登录开关。CI 产物已使用本项目生产域名，可导入微信开发者工具验证；提交审核和正式发布仍需在微信平台完成。

## 项目结构

```text
pages/                 消费者活动、授权、兑奖与个人记录
pagesStore/            门店登录、扫码核销、订单、统计与店员
pagesSales/            销售登录、本人门店与门店账号
components/            导航、弹层、游客态、图标和二维码
store/                 消费者、门店与销售业务状态
utils/                 API、登录授权、日期与二维码工具
config/defaults.js     接口加载前的基础配置
static/                Logo 与 tabBar 小体积资源
scripts/               页面检查、二维码检查与静态资源同步
manifest.json          跨端应用配置及 AppID
pages.json             页面、分包与 tabBar 定义
vite.config.js         Vite / uni-app 构建配置
```

## 简历描述示例

参与 uni-app 兑奖客户端开发，使用 Vue 3 实现自主选牌与翻转动画、换购凭证和微信现金领取状态同步。建设门店补款确认核销与销售拓店分包，通过统一 API 保持多端业务数据一致。
