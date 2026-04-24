# 育儿助手小程序 - UE 设计文档

## 零、Logo 分析与品牌色系

### Logo 视觉元素
Logo 由三个核心元素组成：
1. **南瓜** - 象征宝宝辅食营养，温暖而富有食欲感
2. **食物碗** - 代表育儿喂养的日常行为
3. **育儿记录册** - 体现数据追踪和成长记录功能
4. **背景渐变弧线** - 彩虹色渐变，象征宝宝的健康成长

### 品牌色系（基于Logo提取）
- **主色调**：#FFA926（温暖橙，来自Logo背景）- 传达亲和、食欲、温暖感
- **强调色**：#D4684F（红棕色，来自Logo南瓜）- 用于重点信息和警示
- **辅助绿**：#7FD8BE（薄荷绿，来自Logo渐变）- 用于生长记录和正向反馈
- **辅助橙**：#FFE5CC（浅橙，来自Logo浅色区域）- 用于卡片背景和次级信息
- **中性色**：#333333深灰、#F0F0F0浅灰、#FFFFFF纯白

### 品牌调性
🎨 **温暖、可爱、专业、可信**
- 温暖的色彩搭配体现母婴关怀
- 简洁清晰的设计降低用户学习成本
- 充足的留白和善用圆角传达友好感
- 数据可视化兼顾专业性和易读性

---

## 一、设计规范

### 基础规范

| **设计尺寸** | 375px × 812px（iPhone X 逻辑分辨率） |
| **基础字体** | 正文 12-14px，标题 16-20px |
| **主色调** | #FFA926（温暖橙，来自 logo，亲和、食欲感强） |
| **辅助色** | #FFE5CC（浅橙背景，卡片背景）、#7FD8BE（薄荷绿，生长曲线）、#F5F5F5（灰色背景） |
| **强调色** | #D4684F（温暖红棕，来自 logo 南瓜色，用于重点信息） |
| **中性色** | #333333（深灰，文字）、#F0F0F0（浅灰，分割线） |
| **圆角** | 卡片 16px，按钮 12px，头像 40px |
| **间距** | 基础间距 12px，页面左右边距 16px |
| **图标** | 使用 Font Awesome 或 iconfont |

### 色彩应用规则

#### 功能区块配色

| 功能模块 | 主色 | 辅色 | 应用示例 |
|---------|------|------|---------|
| **食谱相关** | #FFA926 | #FFE5CC | 首页、食谱库、食谱详情 |
| **生长记录** | #7FD8BE | #E0F7F3 | 生长曲线、记录页、数据卡片 |
| **操作按钮** | #FFA926 | #FF8A3D | 主操作按钮、确认操作 |
| **提示信息** | #D4684F | #FDEAE5 | 过敏提示、重要提醒 |
| **成功反馈** | #7FD8BE | - | 完成勾选、成功提示 |
| **禁用/次要** | #CCCCCC | - | 禁用按钮、次级信息 |

#### 文字色彩

- **主标题**：#333333（黑色，20px）
- **副标题**：#666666（深灰，16px）
- **正文**：#333333（黑色，14px）
- **辅文**：#999999（中灰，12px）
- **弱文**：#CCCCCC（浅灰，12px）
- **链接**：#FFA926（橙色）
- **出错**：#D4684F（红棕色）

---

## 二、交互动画规范

### 过渡动画

| 交互行为 | 动画类型 | 时长 | 说明 |
|---------|--------|------|------|
| **页面切换** | 滑动 + 淡入 | 300ms | Tab 栏切换使用右进左出效果 |
| **卡片展开** | 缩放 + 淡入 | 250ms | 从 scale 0.8 → 1.0 |
| **按钮按压** | 缩放反馈 | 100ms | 按下时缩放到 0.95，抬起复原 |
| **滚动加载** | 淡入 | 200ms | 新加载的列表项逐个出现 |
| **模态框弹出** | 从下往上 + 背景渐变 | 250ms | 底部弹窗上滑进入，背景渐显 |
| **数据更新** | 闪烁 + 数字变化 | 500ms | 生长数据变化时有轻微高亮闪烁 |

### 动画缓动函数

```
- 进入动画：cubic-bezier(0.34, 1.56, 0.64, 1) [Bounce Out]
- 退出动画：cubic-bezier(0.25, 0.46, 0.45, 0.94) [Ease Out]
- UI反馈：cubic-bezier(0.68, -0.55, 0.265, 1.55) [Elastic]
- 滚动加载：linear（恒定速率）
```

### 交互反馈规范

#### 按钮反馈
```
正常状态 → 悬停 → 按下 → 释放
- 悬停：背景色加深 10%，投影增强
- 按下：缩放 95%，投影减弱
- 释放：1秒内恢复到正常状态
```

#### 加载状态
```
- 加载中：显示加载动画（旋转图标或骨架屏）
- 加载完成：淡出动画（200ms），显示内容
- 加载失败：红色提示 + 重试按钮
```

#### 空状态反馈
```
- 列表为空时：显示插画 + 空状态文案 + 操作引导
- 网络错误：显示错误插画 + 建议文案 + 重试按钮
- 无权限：显示锁定插画 + 权限申请引导
```

### 微交互设计

#### Tab 栏切换
```javascript
// 伪代码
点击新Tab → 
  | 当前Tab淡出 (200ms)
  | 新Tab从右侧滑入 (300ms)
  | 其中Tab下方滑块动画移动指示位置 (250ms)
```

#### 食谱卡片交互
```
鼠标进入 → 卡片上浮 (投影增强)
点击 → 缩放反馈 (0.95倍) + 页面切换
长按 → 浮层菜单 (复制、分享、收藏等)
```

#### 生长曲线交互
```
曲线初始加载 → 
  | 数据点从左到右依次出现 (500ms, stagger 50ms)
  | 曲线路径逐步绘制 (800ms)
  | 完成后显示解读文案 (淡入, 300ms)

点击数据点 → 
  | 该点展示详细信息浮层
  | 其他点半透明处理
```

---

## 三、响应式布局与多屏适配

### 设计尺寸阶梯

小程序主要适配以下设备：

| 设备类型 | 逻辑分辨率 | 开发尺寸参考 | 说明 |
|---------|----------|----------|------|
| iPhone SE | 375x667 | 基准尺寸 | 最小屏幕 |
| iPhone 8 | 375x812 | **主设计尺寸** | 标准参考 |
| iPhone 13 | 390x844 | 轻微调整 | 超小屏 |
| iPhone 14/15 Pro | 430x932 | 放大适配 | 超大屏 |
| iPad mini | 768x1024 | 专项适配 | 平板端 |

### 响应式规则

#### 字体缩放
```
375px → 14px (基准)
390px → 14px (基本不变)
430px → 15px (放大 7%)
768px (iPad) → 16px (放大 14%)

公式：fontSize(target) = fontSize(base) * (targetWidth / 375)
```

#### 间距缩放
```
375px → 12px (基准间距)
430px → 13px (放大 8%)
768px → 14px (放大 16%)

应用场景：卡片间距、页面边距、元素内边距
```

#### 组件宽度适配

```
小屏 (375px)          中屏 (430px)          大屏 (768px)
┌─────────────┐      ┌───────────────┐    ┌─────────────────┐
│ [全宽]      │      │ [全宽]        │    │ [中间列] [侧栏]  │
│ [半宽][半宽]│  →   │ [半宽][半宽]  │ →  │ [全宽内容]      │
│ [卡片列表]  │      │ [卡片列表]    │    │ [双列网格]      │
└─────────────┘      └───────────────┘    └─────────────────┘
```

#### 关键组件适配

##### 导航栏
- **375px**：4个 Tab 均匀分布
- **430px**：Tab 间距增加 10%
- **768px**：上方水平导航 + 左侧栏菜单式布局

##### 食谱卡片
- **小屏**：单列布局，卡片宽度 = 屏宽 - 32px
- **中屏**：单列布局，卡片宽度 = 屏宽 - 32px  
- **大屏**：双列网格，每列宽度 = (屏宽 - 48px) / 2

##### 生长曲线图
- **小屏**：高度 = 200px，字体 12px
- **中屏**：高度 = 220px，字体 13px
- **大屏**：高度 = 280px，字体 14px，可展示多条曲线

### 触摸点尺寸规范

- **最小可点击区域**：48x48px（推荐）
- **舒适可点击区域**：56x56px
- **按钮高度**：44-56px
- **Tab 栏高度**：50px（iOS 标准）
- **按钮间距**：至少 8px

### 适配实现方案

```css
/* 使用 rem 相对单位 */
html { font-size: calc(100vw / 8.75); } /* 375px时 1rem = 42.85px */

/* 或使用 vw 单位 */
.card { 
  width: calc(100vw - 8.533vw); /* 32px margin in vw */
  padding: calc(3.2vw); /* 12px padding in vw */
}

/* 媒体查询 */
@media (min-width: 430px) {
  html { font-size: calc(100vw / 9.344); }
}

@media (min-width: 768px) {
  .container { max-width: 968px; margin: 0 auto; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; }
}
```

---

## 四、页面结构总览

```
底部 Tab 栏（4个入口）
├── 首页（今日推荐）
├── 食谱库
├── 生长记录
└── 我的

“我的”页二级入口（新增）
├── 我的家庭
│   ├── 家庭信息
│   ├── 家庭成员
│   ├── 邀请家人
│   └── 输入邀请码加入
```

---

## 五、详细页面设计

### 页面 1：启动页/加载页

**功能**：首次加载、用户授权

**布局**：
```
┌─────────────────────────┐
│                         │
│        [Logo]           │
│     育儿助手             │
│    科学喂养，轻松育儿      │
│                         │
│   ┌───────────────────┐ │
│   │  微信一键登录      │ │
│   └───────────────────┘ │
│                         │
│   登录即表示同意《用户协议》 │
└─────────────────────────┘
```

**交互**：
- 点击"微信一键登录" → 获取用户信息 → 进入首页（无宝宝则弹出创建宝宝档案弹窗）

---

### 页面 2：首页 - 今日推荐（核心页面）

**布局结构**：
```
┌─────────────────────────────────┐
│ 顶部导航栏                        │
│ [宝宝头像] 小宝 [▼]  [🔔] [···]  │
│ 3岁2个月 | 无过敏              │
├─────────────────────────────────┤
│                                 │
│ 今日三餐                         │
│ ┌─────────────────────────────┐ │
│ │ 🌅 早餐                       │ │
│ │ 番茄鸡蛋蝴蝶面                │ │
│ │ 15分钟 | 补蛋白        [换]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ☀️ 午餐                       │ │
│ │ 西兰花炒虾仁 + 软米饭         │ │
│ │ 20分钟 | 补钙        [换]    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🌙 晚餐                       │ │
│ │ 南瓜小米粥 + 蒸鳕鱼           │ │
│ │ 25分钟 | 易消化      [换]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ 一键生成周计划        [立即生成]  │
│                                 │
│ 快捷入口                         │
│ [排敏记录] [备菜清单] [长辈模式]  │
│                                 │
│ 猜你喜欢（基于宝宝年龄）          │
│ [食谱卡片] [食谱卡片] [食谱卡片]  │
└─────────────────────────────────┘
```

**交互说明**：

| 元素 | 点击行为 |
|------|---------|
| 宝宝头像+下拉 | 切换宝宝（支持多孩） |
| 今日三餐卡片 | 进入食谱详情页 |
| 卡片右上角[换] | 替换当前餐为另一道随机食谱 |
| 一键生成周计划 | 进入周计划页面，生成一周食谱 |
| 快捷入口 | 分别进入对应功能页面 |
| 猜你喜欢食谱卡片 | 进入食谱详情页 |

---

### 页面 3：食谱详情页

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]            [收藏☆] [分享]│
├─────────────────────────────────┤
│                                 │
│        [食谱主图]                │
│                                 │
│ 番茄鸡蛋蝴蝶面                    │
│ ⭐ 4.8  ·  215人做过  ·  15分钟  │
│                                 │
│ [10月龄+] [无蛋清] [补蛋白]       │
│                                 │
├─────────────────────────────────┤
│ 📝 食材清单                       │
│ ┌─────────────────────────────┐ │
│ │ 蝴蝶面        30g            │ │
│ │ 番茄          1个（约100g）   │ │
│ │ 鸡蛋黄        1个            │ │
│ │ 核桃油        2滴            │ │
│ └─────────────────────────────┘ │
│                                 │
│ 👩‍🍳 制作步骤                      │
│ ┌─────────────────────────────┐ │
│ │ 1. 番茄划十字烫去皮，切碎      │ │
│ │ 2. 锅中倒油，炒番茄出汁       │ │
│ │ 3. 加水煮开，下蝴蝶面         │ │
│ │ 4. 蛋黄打散淋入，煮1分钟出锅   │ │
│ │ [查看完整视频]                │ │
│ └─────────────────────────────┘ │
│                                 │
│ 💡 小贴士                         │
│ 番茄要选熟透的，更易出汁          │
│                                 │
│ 🏷️ 营养分析                       │
│ 番茄富含维生素C，蛋黄补铁          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         [✅ 我做过了]          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**交互说明**：

| 元素 | 点击行为 |
|------|---------|
| 收藏☆ | 收藏/取消收藏，图标状态变化 |
| 查看完整视频 | 播放短视频教程 |
| 我做过了 | 记录用户做过该食谱，用于后续推荐 |

---

### 页面 4：食谱库（列表页）

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]            🔍 搜索食谱   │
├─────────────────────────────────┤
│ 筛选栏                           │
│ [全部] [6-8月] [8-10月] [10-12月]│
│ [1-2岁] [2-3岁] [3岁+]          │
│                                 │
│ [补铁] [补钙] [手指食物] [易消化] │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [图] 南瓜小米粥              │ │
│ │     6月龄+ | 15分钟 | 易消化  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [图] 西兰花虾仁烩饭          │ │
│ │     10月龄+ | 20分钟 | 补钙  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [图] 番茄鸡蛋面              │ │
│ │     8月龄+ | 15分钟 | 补蛋白 │ │
│ └─────────────────────────────┘ │
│                                 │
│         加载更多...              │
└─────────────────────────────────┘
```

**交互说明**：

| 元素 | 点击行为 |
|------|---------|
| 搜索框 | 进入搜索结果页 |
| 筛选标签 | 切换列表内容，高亮选中标签 |
| 食谱卡片 | 进入食谱详情页 |

---

### 页面 5：生长记录

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]               生长记录   │
├─────────────────────────────────┤
│ 当前宝宝：[小宝 3岁2个月 ▼]       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 最新记录                     │ │
│ │ 身高：96.5 cm    +2.5cm      │ │
│ │ 体重：14.2 kg    +0.8kg      │ │
│ │ 记录时间：2024-01-15         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [➕ 记录新数据]                  │
│                                 │
│ 生长曲线图                       │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   身高曲线（cm）             │ │
│ │  105 ┤          ●           │ │
│ │   90 ┤     ●                │ │
│ │   75 ┤  ●                   │ │
│ │   60 ┤●                     │ │
│ │     └──┬──┬──┬──┬──┬──    │ │
│ │      0  1  2  3  4  5       │ │
│ │         年龄（岁）           │ │
│ │                             │ │
│ │ 当前位于：P75 分位           │ │
│ │ 生长速度：正常 ▼             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📊 智能解读                      │
│ ┌─────────────────────────────┐ │
│ │ 宝宝身高位于同龄人的75%分位， │ │
│ │ 体重位于50%分位，体型匀称。   │ │
│ │ 近3个月生长趋势良好，继续保持！│ │
│ │                             │ │
│ │ 🍳 推荐食谱                   │ │
│ │ → 补钙：奶酪虾仁饼            │ │
│ │ → 增重：牛油果香蕉奶昔        │ │
│ └─────────────────────────────┘ │
│                                 │
│ 历史记录                         │
│ 2024-01-15  96.5cm  14.2kg      │
│ 2024-01-01  94.0cm  13.4kg      │
│ 2023-12-15  92.0cm  12.8kg      │
└─────────────────────────────────┘
```

**交互说明**：

| 元素 | 点击行为 |
|------|---------|
| 记录新数据 | 弹出表单（日期、身高、体重） |
| 推荐食谱卡片 | 进入食谱详情页 |
| 历史记录行 | 可编辑/删除该条记录 |

**记录数据弹窗**：
```
┌─────────────────────────┐
│  记录生长数据      [×]   │
├─────────────────────────┤
│  日期                    │
│  [2024-01-15]           │
│                         │
│  身高（cm）              │
│  [________________]     │
│                         │
│  体重（kg）              │
│  [________________]     │
│                         │
│ ┌───────────────────┐  │
│ │      保存          │  │
│ └───────────────────┘  │
└─────────────────────────┘
```

---

### 页面 6：我的（个人中心）

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]                我的     │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 用户昵称                  │ │
│ │   已绑定微信                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ 👶 我的宝宝                      │
│ ┌─────────────────────────────┐ │
│ │ 小宝   男   3岁2个月          │ │
│ │ 过敏：无                     │ │
│ │ 偏好：爱吃肉                 │ │
│ │                    [编辑]    │ │
│ └─────────────────────────────┘ │
│            [+ 添加宝宝]          │
│                                 │
│ 📚 我的内容                      │
│ [我的收藏] [做过的食谱]           │
│                                 │
│ ⚙️ 设置                          │
│ [长辈模式]     [开启后界面简化]   │
│ [清除缓存]                      │
│ [意见反馈]                      │
│ [关于我们]                      │
└─────────────────────────────────┘
```

**编辑宝宝档案页面**：
```
┌─────────────────────────────────┐
│ [← 返回]           编辑宝宝档案   │
├─────────────────────────────────┤
│ 头像                   [更换]    │
│                                 │
│ 昵称：[小宝_________________]    │
│ 性别：[男] [女]                  │
│ 出生日期：[2020-11-15]          │
│                                 │
│ 过敏源（可多选）                  │
│ [牛奶] [鸡蛋] [海鲜] [坚果] [小麦]│
│ [大豆] [其他]                    │
│                                 │
│ 饮食偏好                         │
│ [爱吃肉] [爱吃蔬菜] [爱吃水果]     │
│ [不爱吃蔬菜] [不爱吃肉]           │
│                                 │
│ ┌───────────────────────────┐ │
│ │          保存              │ │
│ └───────────────────────────┘ │
└─────────────────────────────────┘
```

---

### 页面 6-1：我的家庭（新增）

**功能**：支持妈妈邀请爸爸/老人加入同一个家庭，共享宝宝档案、周计划、生长记录等数据，不需要重复创建

**页面定位**：
- 入口放在【我的】页中，建议位于“我的宝宝”模块下方、“我的内容”模块上方
- 未加入家庭时，展示“创建家庭”和“输入邀请码加入”
- 已加入家庭时，展示家庭信息、成员列表、邀请入口

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]             我的家庭    │
├─────────────────────────────────┤
│ 家庭名称：小宝一家               │
│ 我的身份：创建者 / 妈妈          │
│ 成员数：2人                     │
│ [邀请家人]   [编辑家庭名]        │
│                                 │
│ 家庭成员                         │
│ ┌─────────────────────────────┐ │
│ │ [头像] 妈妈小厨   创建者      │ │
│ │ [头像] 爸爸阿杰   可编辑      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 已共享内容                       │
│ · 宝宝档案                       │
│ · 生长记录                       │
│ · 本周菜单 / 备菜清单            │
│ · 做过食谱 / 我的食谱            │
│                                 │
│ [输入邀请码加入家庭]             │
└─────────────────────────────────┘
```

**交互说明**：

| 元素 | 点击行为 |
|------|---------|
| 邀请家人 | 生成 6 位邀请码，24 小时有效，默认一次使用 |
| 输入邀请码加入家庭 | 输入邀请码后加入家庭，自动同步共享数据 |
| 家庭成员卡片 | 查看成员角色，创建者可调整权限/移除 |
| 编辑家庭名 | 修改家庭名称 |

**角色设计**：
- `owner`：家庭创建者，可邀请成员、调整角色、移除成员
- `editor`：可编辑宝宝、录入生长数据、生成周计划、维护共享食谱
- `viewer`：仅查看，不可修改共享数据

---

### 页面 7：周计划生成页

**布局结构**：
```
┌─────────────────────────────────┐
│ [← 返回]           本周计划      │
├─────────────────────────────────┤
│ 当前宝宝：小宝 3岁2个月           │
│                                 │
│ [📅 本周] [一键换新] [生成备菜清单]│
│                                 │
│ 周一 3/17                        │
│ ┌─────────────────────────────┐ │
│ │ 🌅 早餐：南瓜小米粥           │ │
│ │ ☀️ 午餐：番茄鸡蛋面           │ │
│ │ 🌙 晚餐：西兰花虾仁烩饭        │ │
│ └─────────────────────────────┘ │
│                                 │
│ 周二 3/18                        │
│ ┌─────────────────────────────┐ │
│ │ 🌅 早餐：牛奶燕麦粥           │ │
│ │ ☀️ 午餐：胡萝卜肉末蒸蛋        │ │
│ │ 🌙 晚餐：菠菜猪肝面            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ...（周三至周日）                │
│                                 │
│ ┌───────────────────────────┐ │
│ │    📋 一键生成备菜清单       │ │
│ └───────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 六、核心流程

### 流程 1：首次使用流程
```
启动页 → 微信登录 → 创建宝宝档案 → 进入首页（已有今日推荐）
```

### 流程 2：记录生长数据流程
```
生长记录页 → 点击"记录新数据" → 填写表单 → 保存 → 刷新曲线图 → 显示智能解读+推荐食谱
```

### 流程 3：查找食谱流程
```
食谱库 → 筛选月龄/功效 → 点击食谱卡片 → 查看详情 → 收藏/记录做过了
```

### 流程 4：生成备菜清单流程
```
周计划页 → 确认本周食谱 → 点击"生成备菜清单" → 展示购物清单 → 截图/分享
```

### 流程 5：家庭共享流程（新增）
```
妈妈登录 → 创建家庭 → 创建宝宝档案 → 进入“我的家庭”点击邀请家人 → 生成邀请码 →
爸爸登录 → 输入邀请码加入家庭 → 自动看到同一家庭下的宝宝、周计划、生长记录和共享食谱
```

---

## 七、AI 生成食谱方案（内容填充）

### Prompt 模板

```
请生成一道适合{X}月龄宝宝的辅食食谱。

要求：
1. 菜名：简短好记
2. 适用月龄：{X}月龄+
3. 食材清单：列出所有食材，精确到克（主食、蛋白质、蔬菜、油脂）
4. 制作步骤：3-5步，简单易懂
5. 烹饪时间：分钟
6. 过敏源：标注可能过敏源（牛奶、鸡蛋、海鲜、坚果、小麦、大豆）
7. 营养功效：1-2句话
8. 小贴士：1句话

格式用 JSON 输出
```

### 计划生成的食谱数量

| 月龄段 | 计划数量 | 说明 |
|-------|--------|------|
| 6-8月龄 | 20道 | 泥糊状，单一食材开始 |
| 8-10月龄 | 20道 | 小颗粒，手指食物 |
| 10-12月龄 | 20道 | 软烂块状，自主进食 |
| 1-2岁 | 20道 | 正常家庭食物调整 |
| 2-3岁 | 20道 | 营养均衡搭配 |
| 3岁+ | 20道 | 幼儿园适应期 |
| **合计** | **120道** | MVP 足够 |

---

## 八、页面设计参考

### 可直接参考的 Figma 模板

搜索以下关键词，可找到可复用的设计资源：
- "Baby app UI kit"
- "Parenting app design"
- "Meal planner app UI"
- "Growth chart UI"

### 逐个页面的 Prompt 描述

#### 页面 1：启动页/登录页

**Prompt**：
```
请帮我设计一个微信小程序的启动页/登录页，尺寸375x812。

风格要求：
- 主色调：#FFA926（温暖橙，源自 logo）
- 背景：浅橙色渐变（#FFE5CC 到 #FFA926）
- 整体风格：温馨、亲和、母婴类应用

页面包含以下模块：
1. 顶部区域：留白20px
2. Logo区域：居中显示，一个奶瓶或育儿相关的简单图标，下方显示APP名称"育儿助手"，副标题"科学喂养，轻松育儿"
3. 中央装饰：简单可爱的插画（妈妈抱着宝宝，或辅食相关的插画）
4. 底部按钮：一个圆角按钮"微信一键登录"，按钮背景白色，文字橙色，下方显示小字"登录即表示同意《用户协议》"

交互要求：
点击登录按钮 → 弹出微信授权
```

#### 页面 2：首页-今日推荐

**Prompt**：
```
请帮我设计一个微信小程序的首页（今日推荐页面），尺寸375x812。

风格要求：
- 主色调：#FFA926（源自 logo 橙色）
- 背景色：#FFFFFF
- 卡片圆角：16px
- 整体风格：简洁、清晰、信息层级分明

页面包含以下模块：

1. 顶部导航栏：
   - 左侧：宝宝头像（圆形40px）+ 宝宝昵称"小宝"+ 下拉箭头，下方小字显示"3岁2个月 | 无过敏"
   - 右侧：消息通知图标、更多菜单图标（三个点）

2. 今日三餐区域（三个卡片，垂直排列）：
   - 每个卡片内：左侧餐图标（🌅/☀️/🌙）+ 餐别文字（早餐/午餐/晚餐）
   - 右侧：食谱名称（如"番茄鸡蛋蝴蝶面"）、烹饪时间（15分钟）、营养标签（补蛋白）
   - 卡片右上角：一个"换"字按钮（小圆角）
   - 卡片之间间距12px

3. 快捷操作区域：
   - 一个橙色按钮"一键生成周计划"，宽度100%宽度，圆角12px
   - 下方三个快捷入口横向排列：排敏记录、备菜清单、长辈模式（每个入口包含小图标+文字）

4. 猜你喜欢区域：
   - 标题"猜你喜欢"，右侧"查看更多"
   - 横向滚动食谱卡片（每个卡片：方形图片、食谱名称、月龄标签、烹饪时间）
   - 横向滚动，显示2.5个卡片

交互要求：
- 点击宝宝区域 → 切换宝宝
- 点击食谱卡片 → 进入食谱详情页
- 点击"换"按钮 → 刷新当前餐的食谱
- 横向滚动卡片可左右滑动
```

#### 页面 3：食谱详情页

**Prompt**：
```
请帮我设计一个食谱详情页，尺寸375x812。

风格要求：
- 主色调：#FFA926（源自 logo 橙色）
- 背景色：#FFFFFF
- 内容区域有适当留白
  
页面包含以下模块：

1. 顶部导航：
  - 左侧：返回箭头
  - 右侧：收藏图标（☆/★）、分享图标
    
2. 食谱主图区域：
  - 一张占位图片，宽375px，高220px
  - 图片左上角显示月龄标签（如"10月龄+"）
    
3. 食谱标题区域：
  - 食谱名称（如"番茄鸡蛋蝴蝶面"），字体20px粗体
  - 下方一行：评分（4.8星）、做过人数（215人）、烹饪时间（15分钟），用圆点分隔
    
4. 标签区域：
  - 横向排列几个标签：如"手指食物"、"补蛋白"、"无蛋清"，浅橙色背景圆角
    
5. 食材清单模块：
  - 标题"📝 食材清单"，右侧有复制按钮
  - 列表形式：食材名称 + 重量（如"蝴蝶面 30g"），每行一个，灰色分割线
    
6. 制作步骤模块：
  - 标题"👩‍🍳 制作步骤"
  - 步骤列表：序号圆点 + 步骤文字，每步之间有间距
  - 底部有一个"查看完整视频"链接
    
7. 小贴士模块：
  - 浅橙色背景卡片，显示💡图标 + 小贴士内容
    
8. 底部按钮：
  - 固定底部，一个圆角按钮"✅ 我做过了"，主色背景
    
交互要求：
- 点击收藏图标 → 切换收藏状态
- 点击返回 → 返回上一页
- 点击"我做过了" → 记录用户行为，按钮变为"已做过"
```

#### 页面 4：食谱库列表页

**Prompt**：
```
请帮我设计一个食谱库列表页，尺寸375x812。

风格要求：
- 主色调：#FFA926（源自 logo 橙色）
- 背景色：#F5F5F5
- 卡片白色背景，圆角16px

页面包含以下模块：

1. 顶部搜索栏：
   - 搜索框占位文字"🔍 搜索食谱"，浅灰色背景，圆角8px
   - 左侧返回箭头

2. 筛选区域（横向滚动）：
   - 第一行：月龄筛选标签"全部""6-8月""8-10月""10-12月""1-2岁""2-3岁""3岁+"
   - 当前选中的标签有橙色边框或橙色背景
   - 第二行：功效筛选标签"补铁""补钙""手指食物""易消化""补蛋白"
   - 可横向滚动

3. 食谱列表区域（垂直滚动）：
   - 每个食谱卡片：
     - 左侧：正方形图片（80x80px）
     - 右侧：食谱名称、月龄标签、烹饪时间、营养标签（如"补钙"）
     - 右侧下方：收藏图标
   - 卡片之间间距12px，背景白色，圆角16px

4. 底部：
   - 加载更多提示（滚动到底部时显示"加载中..."）

交互要求：
- 点击筛选标签 → 切换列表内容，高亮选中标签
- 点击搜索框 → 进入搜索页
- 点击食谱卡片 → 进入详情页
- 点击收藏图标 → 收藏/取消收藏
- 无限滚动加载更多食谱
```

#### 页面 5：生长记录页

**Prompt**：
```
请帮我设计一个生长记录页面，尺寸375x812。

风格要求：
- 主色调：#7FD8BE（薄荷绿，区别于食谱的橙色）
- 背景色：#FFFFFF
- 数据可视化清晰易懂

页面包含以下模块：

1. 顶部导航：
   - 返回箭头
   - 标题"生长记录"
   - 右侧更多菜单（可选）

2. 宝宝切换区域：
   - 显示当前宝宝"小宝 3岁2个月"，右侧下拉箭头

3. 最新数据卡片：
   - 白色卡片，显示最新记录的身高（96.5cm）、体重（14.2kg）、记录日期
   - 显示与上次记录的变化量（+2.5cm，+0.8kg）
   - 右侧有一个"记录新数据"按钮，主色

4. 生长曲线图区域：
   - 标题"身高曲线"
   - 折线图：X轴为年龄（0-5岁），Y轴为身高（cm）
   - 显示数据点，当前点高亮
   - 下方显示当前分位（如"P75分位"）和生长速度评价

5. 智能解读卡片：
   - 浅绿色背景卡片
   - 文字解读："宝宝身高位于同龄人的75%分位，体重位于50%分位，体型匀称..."
   - 下方推荐食谱：两个横向卡片，显示食谱名称和图片

6. 历史记录区域：
   - 标题"历史记录"
   - 列表形式：日期、身高、体重、操作（编辑/删除）
   - 每个记录有浅灰色分割线

交互要求：
- 点击"记录新数据" → 弹出表单弹窗
- 点击推荐食谱 → 跳转食谱详情
- 点击历史记录编辑 → 可修改数据
```

#### 页面 6：我的页面

**Prompt**：
```
请帮我设计一个"我的"页面（个人中心），尺寸375x812。

风格要求：
- 主色调：#FFA926（源自 logo 橙色）
- 背景色：#F5F5F5
- 卡片白色背景，圆角16px

页面包含以下模块：

1. 顶部用户信息区域：
   - 白色背景
   - 左侧：用户头像（圆形60px）
   - 右侧：用户昵称（"宝爸/宝妈"），微信已绑定标识
   - 可点击编辑区域

2. 我的宝宝卡片：
   - 白色卡片，标题"👶 我的宝宝"，右侧"添加"按钮
   - 宝宝信息行：宝宝头像、昵称、性别、年龄
   - 下方显示过敏源标签（如"无过敏"）和饮食偏好（如"爱吃肉"）
   - 右侧"编辑"按钮

3. 我的内容区域：
   - 两个入口横向排列：我的收藏、做过的食谱
   - 每个入口显示数量角标

4. 设置区域：
   - 入口列表：长辈模式（带开关）、清除缓存、意见反馈、关于我们
   - 每个入口左侧图标，右侧箭头
   - 分割线区分

交互要求：
- 点击编辑宝宝 → 进入编辑页面
- 点击添加宝宝 → 添加新宝宝
- 点击我的收藏 → 进入收藏列表页
- 长辈模式开关 → 切换UI为简化模式
```

#### 页面 7：编辑宝宝档案弹窗

**Prompt**：
```
请帮我设计一个编辑宝宝档案的页面，尺寸375x812。

风格要求：
- 主色调：#FFA926（源自 logo 橙色）
- 表单简洁，易于填写

页面包含以下模块：

1. 顶部导航：
   - 返回箭头
   - 标题"编辑宝宝档案"
   - 保存按钮

2. 头像区域：
   - 居中显示圆形头像（80px），下方"更换头像"文字链接

3. 表单区域：
   - 昵称：输入框，占位文字"请输入宝宝昵称"
   - 性别：两个按钮"男""女"
   - 出生日期：日期选择器，占位文字"请选择出生日期"

4. 过敏源选择区域：
   - 标题"过敏源（可多选）"
   - 横向标签：牛奶、鸡蛋、海鲜、坚果、小麦、大豆、其他
   - 选中状态为橙色填充，未选中为灰色边框

5. 饮食偏好区域：
   - 标题"饮食偏好"
   - 横向标签：爱吃肉、爱吃蔬菜、爱吃水果、不爱吃蔬菜、不爱吃肉
   - 可多选

6. 底部保存按钮：
   - 固定底部，橙色圆角按钮"保存"

交互要求：
- 点击保存 → 返回上一页并更新数据
- 点击日期选择器 → 弹出日期选择
- 点击过敏源标签 → 切换选中状态
```

---

## 九、开发建议（前后端）

### 技术栈选型

#### 前端选项

| 方案 | 对比 | 推荐度 |
|------|------|-------|
| **微信原生小程序** | 官方支持，文档完善，性能最优 | ⭐⭐⭐⭐⭐ |
| Taro（京东开源） | 一套代码多端运行，学习成本略高 | ⭐⭐⭐⭐ |
| uni-app（阿里系） | 跨平台生态好，社区活跃 | ⭐⭐⭐⭐ |
| 原生 React Native | 性能好但版本碎片化 | ⭐⭐⭐ |

**推荐**：**微信原生小程序** - 新手友好，官方文档充足

#### 后端方案

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|-------|
| **Supabase（PostgreSQL）** | 免费额度友好，SQL 能力强，内置 Auth/Storage/Edge Functions | 需要单独处理微信登录映射 | ⭐⭐⭐⭐⭐（单人/MVP） |
| 自建服务器（Node.js + Express） | 完全自主，成本可控 | 需要运维，部署复杂 | ⭐⭐⭐⭐（成熟产品） |
| Serverless（阿里云/腾讯云） | 弹性伸缩，按量计费 | 冷启动延迟，调试困难 | ⭐⭐⭐ |

**推荐**：**Supabase**（MVP 阶段）→ **自建服务器**（商业化阶段）

#### 数据库选择

对于此项目推荐顺序：
1. **PostgreSQL**（Supabase）- 强一致性，关系模型清晰，适合持续演进
2. **MongoDB** - 结构灵活，适合快速原型
3. **MySQL** - 传统但稳定

### 开发分工（前后端分离）

#### 前端开发清单

**使用技术**：WXML + WXSS + JavaScript

```
前端核心文件结构：
├── pages/                      // 页面
│   ├── index/                  // 首页
│   ├── recipes/                // 食谱库
│   ├── growth/                 // 生长记录
│   └── mine/                   // 我的
├── components/                 // 可复用组件
│   ├── recipe-card
│   ├── growth-chart
│   ├── tab-bar
│   └── loading-state
├── utils/                      // 工具函数
│   ├── api.js                  // API 请求封装
│   ├── auth.js                 // 认证逻辑
│   └── format.js               // 数据格式化
├── assets/                     // 资源
│   ├── icons/
│   └── images/
└── app.js                      // 应用入口

关键特性适配：
✓ 长列表虚拟滚动（recipe-scroll）
✓ 骨架屏加载优化
✓ 懒加载图片处理
✓ 离线缓存方案
```

#### 后端开发清单

**使用技术**：Node.js + Supabase（PostgreSQL + Edge Functions）

```
后端核心文件结构：
├── supabase/
│   ├── migrations/             // 数据库迁移 SQL
│   ├── seed.sql                // 测试数据
│   ├── policies.sql            // RLS 策略
│   └── config.toml             // Supabase 本地配置
├── functions/                  // Edge Functions
│   ├── wechat-login/
│   ├── recommendation/
│   ├── growth-analysis/
│   └── weekly-plan/
├── server/                     // 可选 BFF 层（Node.js）
│   ├── routes/
│   ├── services/
│   └── middleware/
└── config/                     // 配置
    └── constants.js            // 常量定义

关键业务逻辑：
✓ 用户认证和授权
✓ 推荐算法实现
✓ 数据一致性维护
✓ 异常错误处理
✓ 日志记录和监控
```

### 开发顺序（按优先级）

#### 第 1 阶段：基础架构与认证（1 周）

**前端**：
- [ ] 小程序项目初始化
- [ ] 底部 Tab 栏實現
- [ ] 启动页/登陆页 UI
- [ ] API 请求层封装（wx.request 拦截器）
- [ ] 本地存储方案（token, 用户信息）

**后端**：
- [ ] Supabase 项目初始化（本地 + 线上）
- [ ] 数据库与迁移脚本初始化
- [ ] 微信 API 集成（登录授权）
- [ ] JWT/Session 认证机制
- [ ] 错误响应统一格式

**交付物**：能完成微信授权登录，并保存用户信息

---

#### 第 2 阶段：核心食谱功能（1-2 周）

**前端**：
- [ ] 首页布局（顶部导航 + 三餐卡片）
- [ ] 食谱详情页
- [ ] 食谱库列表页（分页加载）
- [ ] 搜索和筛选功能
- [ ] 收藏功能 UI

**后端**：
- [ ] 食谱数据导入（120 道食谱）
- [ ] 食谱 CRUD 接口
- [ ] 搜索/筛选接口（支持多条件组合）
- [ ] 收藏接口
- [ ] 推荐算法初版（基于年龄和过敏源）

**交付物**：用户可以浏览、搜索、收藏食谱

---

#### 第 3 阶段：宝宝管理与生长记录（1-2 周）

**前端**：
- [ ] 宝宝档案创建/编辑页面
- [ ] 生长记录页面布局
- [ ] 生长曲线图绘制（使用 echarts-for-weixin）
- [ ] 记录新数据表单

**后端**：
- [ ] 宝宝信息 CRUD 接口
- [ ] 生长记录接口
- [ ] 生长数据分析接口（计算百分位）
- [ ] 基于生长数据的食谱推荐接口

**交付物**：用户可以管理多个宝宝，记录生长数据

---

#### 第 4 阶段：周计划和高级功能（1 周）

**前端**：
- [ ] 周计划生成页面
- [ ] 备菜清单显示
- [ ] 分享功能（截图/链接）
- [ ] "做过了"记录功能

**后端**：
- [ ] 周计划生成接口
- [ ] 购物清单生成接口
- [ ] 做过食谱的记录接口

**交付物**：用户可以生成周计划和备菜清单

---

#### 第 5 阶段：优化与完善（1 周）

**前端优化**：
- [ ] 性能优化（图片压缩、长列表优化）
- [ ] 骨架屏和加载动画
- [ ] 离线缓存方案
- [ ] 错误处理和用户提示
- [ ] 无障碍适配

**后端优化**：
- [ ] 接口缓存策略
- [ ] 数据库查询优化
- [ ] 监控和日志
- [ ] 率限流和反爬虫

**家庭共享（建议并入第 5 阶段）**：
- [ ] 家庭表 / 家庭成员表 / 邀请码表
- [ ] 我的家庭页面
- [ ] 邀请码创建与加入流程
- [ ] 家庭角色权限控制
- [ ] 现有宝宝 / 生长记录 / 周计划数据迁移到家庭维度

**交付物**：应用运行流畅，用户体验良好

---

#### 第 6 阶段：测试与上线准备（1 周）

- [ ] 功能测试（全流程）
- [ ] 兼容性测试（不同机型/系统版本）
- [ ] 性能测试（加载时间、内存占用）
- [ ] 安全测试（SQL 注入、CSRF 等）
- [ ] User Acceptance Testing（邀请小范围测试）
- [ ] 小程序企业审核准备
- [ ] 灰度发布计划

**交付物**：可上线的产品版本

### 预期工作量评估

#### 单人开发时间线

| 阶段 | 预期耗时 | 人员 | 备注 |
|-----|--------|------|------|
| 第1阶段 | 5-7 天 | 1人 | 前后端兼顾 |
| 第2阶段 | 7-10 天 | 1人 | 核心功能，耗时最长 |
| 第3阶段 | 7-10 天 | 1人 | 数据分析部分复杂 |
| 第4阶段 | 5-7 天 | 1人 | 基于前几阶段迅速迭代 |
| 第5阶段 | 5-7 天 | 1人 | 优化和调试 |
| 第6阶段 | 5-7 天 | 1人或邀请 | 可邀请朋友帮忙测试 |
| **总计** | **6-10 周** | - | MVP 版本可上线 |

#### 团队分工方案（推荐）

若有团队协作：

| 角色 | 职责 | 预期产出 |
|------|------|--------|
| **前端工程师** | 小程序开发、UI实现、性能优化 | .wxml / .wxss / .js 文件 |
| **后端工程师** | Supabase API、数据库设计、RLS 策略开发 | SQL 迁移脚本、Edge Functions |
| **UI/UX设计师** | 高保真设计、交互规范 | Figma / Sketch 设计稿 |
| **产品经理** | 需求梳理、优先级排序 | 产品功能文档 |
| **测试工程师** | 功能/性能/安全测试 | 测试报告、bug 列表 |

### 开发环境配置

#### 前端开发环境

```bash
# 1. 安装微信开发者工具
# 官网下载：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 2. 项目初始化
mkdir mommy-kitchen-helper
cd mommy-kitchen-helper
# 创建 project.config.json 和 app.js

# 3. 推荐的开发插件
# - 微信小程序高效开发框架 (WePY/Taro/uni-app)
# - ESLint + Prettier（代码规范）
# - 调试工具推荐使用微信开发者工具自带的调试面板
```

#### 后端开发环境

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 初始化项目
supabase init
supabase start

# 3. 连接线上项目
supabase login
supabase link --project-ref <your-project-ref>

# 4. 创建迁移并推送
supabase migration new init_schema
supabase db push
```

#### 数据库初始化脚本

```sql
-- Supabase 初始化示例（迁移文件）
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wechat_openid text unique not null,
  nickname text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nickname text not null,
  gender text check (gender in ('male', 'female')),
  birth_date date not null,
  allergies text[] default '{}',
  dietary_preferences text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_babies_user_id on babies(user_id);
```

### 质量保证检查清单

#### 前端测试清单

```
[ ] 页面加载时间 < 3 秒
[ ] 首屏内容绘制 < 2 秒（First Contentful Paint）
[ ] 菜单切换流畅（60fps）
[ ] 长列表滚动无卡顿（虚拟滚动）
[ ] 网络断开时有友好提示
[ ] 内存占用 < 100MB（后台运行）
[ ] 兼容 iOS 11+ 和 Android 6+
[ ] 字体可读性评分 WCAG AA 以上
[ ] 所有点击区域 >= 44x44px
[ ] 重要操作有确认提示
```

#### 后端测试清单

```
[ ] 所有 API 返回格式一致
[ ] 错误处理覆盖 95% 以上路径
[ ] 并发测试（1000+ 同时用户）
[ ] SQL 注入/ XSS 漏洞扫描
[ ] 接口响应时间 < 500ms（95分位）
[ ] 数据库连接池管理正确
[ ] 定时任务按时触发
[ ] 备份机制完善
```

### 持续集成建议

```yaml
# .github/workflows/deploy.yml（CI/CD 示例）
name: Deploy to Supabase

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

---

## 十、后端功能需求与 API 设计

### 后端技术栈

**推荐方案**：Supabase（PostgreSQL + Auth + Storage + Edge Functions）

| 组件 | 技术选型 | 说明 |
|------|--------|------|
| 服务端框架 | Edge Functions（Deno）/ Node.js BFF | 按需编排业务逻辑 |
| 数据库 | Supabase PostgreSQL | 关系模型清晰，SQL 能力完整 |
| 文件存储 | Supabase Storage | 图片/视频存储，CDN 加速 |
| 缓存 | Redis（可选） | 热数据缓存（非必需，MB 级数据） |
| 消息队列 | pgmq / 外部队列（可选） | 异步任务处理 |

---

### 数据库设计

#### 核心数据表（Tables）

说明：本节下方字段描述用于业务逻辑表达，实际落库请以 Supabase PostgreSQL 的 SQL 脚本为准，见 supabase/schema.sql。

##### 1. 用户表（users）
```javascript
{
  _id: ObjectId,
  openid: String,              // 微信 openid（唯一）
  nickname: String,            // 用户昵称
  avatarUrl: String,           // 头像 URL
  phone: String,               // 手机号（可选）
  babyIds: Array,              // 关联的宝宝 ID 列表
  allergies: Array,            // 用户自身过敏源
  preferences: Object,         // 用户偏好设置
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  isDeleted: Boolean
}
```

##### 1-1. 家庭表（families）【新增】
```javascript
{
  _id: ObjectId,
  name: String,                // 家庭名称，如“小宝一家”
  owner_user_id: ObjectId,     // 家庭创建者
  status: String,              // active / dissolved
  created_at: Timestamp,
  updated_at: Timestamp
}
```

##### 1-2. 家庭成员表（family_members）【新增】
```javascript
{
  _id: ObjectId,
  family_id: ObjectId,
  user_id: ObjectId,
  role: String,                // owner / editor / viewer
  relation: String,            // 妈妈 / 爸爸 / 外婆 / 爷爷等
  status: String,              // active / removed
  joined_at: Timestamp,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

##### 1-3. 家庭邀请码表（family_invites）【新增】
```javascript
{
  _id: ObjectId,
  family_id: ObjectId,
  code: String,                // 6 位邀请码
  created_by_user_id: ObjectId,
  role_to_grant: String,       // editor / viewer
  expires_at: Timestamp,       // 24 小时有效
  used_by_user_id: ObjectId,
  used_at: Timestamp,
  status: String,              // active / used / expired / cancelled
  created_at: Timestamp,
  updated_at: Timestamp
}
```

##### 2. 宝宝档案表（babies）
```javascript
{
  _id: ObjectId,
  userId: ObjectId,            // 兼容旧字段，保留创建人
  family_id: ObjectId,         // 新增：所属家庭 ID
  nickname: String,            // 宝宝昵称
  gender: String,              // 性别 (male/female)
  birthDate: Date,             // 出生日期
  avatarUrl: String,           // 宝宝头像
  allergies: Array,            // 过敏源列表
  dietary_preferences: Array,  // 饮食偏好
  current_age_months: Number,  // 当前月龄（冗余字段，用于查询）
  created_at: Timestamp,
  updated_at: Timestamp,
  is_active: Boolean           // 是否为当前活跃宝宝
}
```

##### 3. 食谱表（recipes）
```javascript
{
  _id: ObjectId,
  name: String,                // 食谱名称
  description: String,         // 描述
  image_url: String,           // 食谱图片
  min_age_months: Number,      // 最小适用月龄
  max_age_months: Number,      // 最大适用月龄
  cooking_time: Number,        // 烹饪时间（分钟）
  difficulty: String,          // 难度 (easy/medium/hard)
  
  // 营养标签
  tags: Array,                 // ['补铁', '补钙', '手指食物', '易消化']
  allergens: Array,            // 过敏源 ['鸡蛋', '牛奶', ...]
  
  // 详细信息
  ingredients: Array,          // 食材列表
  // {
  //   name: String,            // 食材名称
  //   quantity: Number,        // 数量
  //   unit: String             // 单位 (g, ml, 个)
  // }
  
  steps: Array,                // 制作步骤
  // {
  //   step: Number,
  //   description: String,
  //   duration: Number         // 该步骤耗时（秒）
  // }
  
  tips: String,                // 小贴士
  nutrition_info: String,      // 营养分析
  video_url: String,           // 视频教程 URL（可选）
  
  // 统计信息
  rating: Number,              // 平均评分 (0-5)
  rating_count: Number,        // 评分人数
  times_made: Number,          // 被制作次数
  
  // 元数据
  created_at: Timestamp,
  updated_at: Timestamp,
  created_by: String,          // 食谱创建者 ID
  is_published: Boolean,
  is_deleted: Boolean
}
```

##### 4. 收藏表（collections）
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,           // 用户 ID
  recipe_id: ObjectId,         // 食谱 ID
  created_at: Timestamp,
  // 复合唯一索引：user_id + recipe_id
}
```

##### 5. 做过的食谱表（made_recipes）
```javascript
{
  _id: ObjectId,
  family_id: ObjectId,         // 新增：所属家庭，共享制作记录
  user_id: ObjectId,           // 用户 ID
  baby_id: ObjectId,           // 宝宝 ID
  recipe_id: ObjectId,         // 食谱 ID
  made_date: Date,             // 制作日期
  notes: String,               // 用户笔记
  rating: Number,              // 评分 (1-5)
  feedback: String,            // 反馈
  times_made: Number,          // 该宝宝已制作此食谱的次数
  created_at: Timestamp,
  updated_at: Timestamp,
  // 复合索引：user_id + baby_id + recipe_id
}
```

##### 6. 生长记录表（growth_records）
```javascript
{
  _id: ObjectId,
  family_id: ObjectId,         // 新增：所属家庭
  baby_id: ObjectId,           // 宝宝 ID
  user_id: ObjectId,           // 用户 ID
  
  // 测量数据
  height: Number,              // 身高 (cm)
  weight: Number,              // 体重 (kg)
  head_circumference: Number,  // 头围 (cm)（可选）
  
  measured_date: Date,         // 测量日期
  
  // 百分位数据（冗余，用查询优化）
  height_percentile: Number,   // 身高百分位 (0-100)
  weight_percentile: Number,   // 体重百分位 (0-100)
  
  // 变化量
  height_change: Number,       // 与上次记录相比身高变化
  weight_change: Number,       // 与上次记录相比体重变化
  
  // 医生建议
  doctor_notes: String,        // 医生备注
  is_abnormal: Boolean,        // 是否异常
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

##### 7. 每日推荐表（daily_recommendations）
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  baby_id: ObjectId,
  recipe_date: Date,           // 推荐日期
  
  breakfast: ObjectId,         // 早餐食谱 ID
  lunch: ObjectId,             // 午餐食谱 ID
  dinner: ObjectId,            // 晚餐食谱 ID
  
  created_at: Timestamp,
  updated_at: Timestamp,
  is_used: Boolean             // 是否被用户使用
}
```

##### 8. 周计划表（weekly_plans）
```javascript
{
  _id: ObjectId,
  family_id: ObjectId,         // 新增：所属家庭
  user_id: ObjectId,
  baby_id: ObjectId,
  
  week_start_date: Date,       // 周开始日期
  recipes: Array,              // 一周的食谱
  // {
  //   date: Date,
  //   breakfast: ObjectId,
  //   lunch: ObjectId,
  //   dinner: ObjectId
  // }
  
  created_at: Timestamp,
  updated_at: Timestamp,
  is_published: Boolean,
  shared_url: String           // 分享链接
}
```

---

### API 接口设计

#### 认证相关接口

##### 1. 微信登录
```
POST /api/user/wechat-login
Request: {
  code: String,                // 微信授权 code
  encryptedData: String,       // 加密用户数据
  iv: String                   // 加密初始化向量
}
Response: {
  token: String,               // JWT token
  user_id: String,
  openid: String,
  is_new_user: Boolean
}
```

#### 用户接口

##### 2. 获取用户信息
```
GET /api/user/profile
Headers: { Authorization: "Bearer {token}" }
Response: {
  user: {
    _id: String,
    nickname: String,
    avatarUrl: String,
    createdAt: Timestamp
  }
}
```

##### 3. 更新用户信息
```
PUT /api/user/profile
Headers: { Authorization: "Bearer {token}" }
Request: { nickname: String, ... }
Response: { success: Boolean }
```

#### 宝宝档案接口

##### 4. 创建宝宝档案
```
POST /api/baby/create
Headers: { Authorization: "Bearer {token}" }
Request: {
  nickname: String,
  gender: String,
  birthDate: Date,
  allergies: Array,
  dietary_preferences: Array
}
Response: {
  baby_id: String,
  success: Boolean
}
```

##### 5. 获取宝宝列表
```
GET /api/baby/list
Headers: { Authorization: "Bearer {token}" }
Response: {
  babies: Array<Baby>
}
```

##### 6. 更新宝宝档案
```
PUT /api/baby/{babyId}
Headers: { Authorization: "Bearer {token}" }
Request: { nickname, gender, birthDate, allergies, ... }
Response: { success: Boolean }
```

##### 7. 删除宝宝档案
```
DELETE /api/baby/{babyId}
Headers: { Authorization: "Bearer {token}" }
Response: { success: Boolean }
```

#### 家庭共享接口（新增）

##### 7-1. 创建家庭
```
POST /api/family/create
Headers: { Authorization: "Bearer {token}" }
Request: {
  name: String
}
Response: {
  family_id: String,
  success: Boolean
}
```

##### 7-2. 获取当前家庭信息
```
GET /api/family/current
Headers: { Authorization: "Bearer {token}" }
Response: {
  family: Family,
  my_role: String,
  members: Array<FamilyMember>
}
```

##### 7-3. 生成邀请码
```
POST /api/family/invite
Headers: { Authorization: "Bearer {token}" }
Request: {
  role: "editor" | "viewer",
  relation: String
}
Response: {
  code: String,
  expires_at: Timestamp
}
```

##### 7-4. 通过邀请码加入家庭
```
POST /api/family/join
Headers: { Authorization: "Bearer {token}" }
Request: {
  code: String
}
Response: {
  family_id: String,
  success: Boolean
}
```

##### 7-5. 获取家庭成员
```
GET /api/family/members
Headers: { Authorization: "Bearer {token}" }
Response: {
  members: Array<FamilyMember>
}
```

##### 7-6. 更新成员角色
```
PATCH /api/family/member/{memberId}/role
Headers: { Authorization: "Bearer {token}" }
Request: {
  role: "editor" | "viewer"
}
Response: { success: Boolean }
```

##### 7-7. 移除家庭成员
```
DELETE /api/family/member/{memberId}
Headers: { Authorization: "Bearer {token}" }
Response: { success: Boolean }
```

#### 食谱接口

##### 8. 获取食谱列表（带筛选）
```
GET /api/recipe/list?page=1&limit=20&ageMin=6&ageMax=8&tags=补钙,补铁
Headers: { Authorization: "Bearer {token}" }
Response: {
  recipes: Array<Recipe>,
  total: Number,
  page: Number,
  pageSize: Number
}
```

##### 9. 获取食谱详情
```
GET /api/recipe/{recipeId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  recipe: Recipe,
  is_collected: Boolean,
  times_user_made: Number
}
```

##### 10. 搜索食谱
```
GET /api/recipe/search?keyword=番茄&limit=20
Headers: { Authorization: "Bearer {token}" }
Response: {
  recipes: Array<Recipe>,
  total: Number
}
```

##### 11. 收藏/取消收藏食谱
```
POST /api/recipe/{recipeId}/collect
Headers: { Authorization: "Bearer {token}" }
Request: { action: "add" | "remove" }
Response: { success: Boolean, is_collected: Boolean }
```

##### 12. 记录"做过了"
```
POST /api/recipe/{recipeId}/mark-made
Headers: { Authorization: "Bearer {token}" }
Request: {
  baby_id: String,
  made_date: Date,
  rating: Number,
  notes: String
}
Response: { success: Boolean, entry_id: String }
```

##### 13. 获取我的收藏
```
GET /api/recipe/collections?page=1&limit=20
Headers: { Authorization: "Bearer {token}" }
Response: {
  recipes: Array<Recipe>,
  total: Number
}
```

##### 14. 获取做过的食谱
```
GET /api/recipe/made?baby_id={babyId}&page=1&limit=20
Headers: { Authorization: "Bearer {token}" }
Response: {
  recipes: Array<Recipe>,
  total: Number
}
```

#### 生长记录接口

##### 15. 添加生长记录
```
POST /api/growth-record/add
Headers: { Authorization: "Bearer {token}" }
Request: {
  baby_id: String,
  height: Number,
  weight: Number,
  head_circumference: Number (可选),
  measured_date: Date
}
Response: {
  success: Boolean,
  record_id: String,
  percentiles: { height: Number, weight: Number }
}
```

##### 16. 获取生长记录历史
```
GET /api/growth-record/history?baby_id={babyId}&limit=12
Headers: { Authorization: "Bearer {token}" }
Response: {
  records: Array<GrowthRecord>,
  latest_record: GrowthRecord
}
```

##### 17. 获取生长曲线数据
```
GET /api/growth-record/curve?baby_id={babyId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  curve_data: Array<{date, height, weight}>,
  percentile_reference: Object,  // 参考百分位数据
  analysis: String               // AI 生成的解读文案
}
```

##### 18. 获取推荐食谱（基于生长数据）
```
GET /api/growth-record/recommendations?baby_id={babyId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  recommendations: Array<{type, recipe}>  // type: '补钙', '补铁', etc.
}
```

#### 推荐系统接口

##### 19. 获取今日推荐（首页）
```
GET /api/recommendation/today?baby_id={babyId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  breakfast: Recipe,
  lunch: Recipe,
  dinner: Recipe,
  suggestions: Array<Recipe>   // 猜你喜欢
}
```

##### 20. 替换某一餐食谱
```
POST /api/recommendation/swap-meal
Headers: { Authorization: "Bearer {token}" }
Request: {
  baby_id: String,
  meal_type: "breakfast" | "lunch" | "dinner",
  date: Date
}
Response: {
  new_recipe: Recipe
}
```

#### 周计划接口

##### 21. 生成周计划
```
POST /api/weekly-plan/generate
Headers: { Authorization: "Bearer {token}" }
Request: {
  baby_id: String,
  start_date: Date
}
Response: {
  plan_id: String,
  weekly_recipes: Array,
  success: Boolean
}
```

##### 22. 获取周计划
```
GET /api/weekly-plan/{planId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  plan: WeeklyPlan,
  recipes: Array<Recipe>
}
```

##### 23. 生成备菜清单
```
POST /api/weekly-plan/{planId}/shopping-list
Headers: { Authorization: "Bearer {token}" }
Response: {
  shopping_list: Array<{ingredient, quantity, unit}>,
  total_items: Number,
  estimated_budget: Number
}
```

---

### 家庭共享功能落地说明（新增）

#### 共享与不共享范围

- 共享：
  - 宝宝档案
  - 生长记录
  - 周计划 / 备菜清单
  - 做过食谱
  - 我的食谱（建议支持“共享到家庭”）
- 暂不共享：
  - 用户昵称、头像、个人简介
  - 登录态
  - 个性化设置
  - 收藏食谱（建议先保留个人维度，避免互相干扰推荐）

#### 当前项目的数据迁移建议

从现有单人模型升级到家庭模型时，建议采用以下方案：

1. 为每个现有用户自动创建一个默认家庭
2. 将该用户当前已有宝宝迁移到这个默认家庭
3. 将生长记录、周计划、做过记录补写 `family_id`
4. 原 `babies.userId` 不删除，保留为“创建人”
5. 新增读取接口时，统一按“当前用户所属家庭”过滤

#### MVP 范围建议

第一版先做：
- 一个用户只能加入一个家庭
- 一个家庭可有多个成员
- 角色仅支持 `owner / editor / viewer`
- 邀请码加入
- 宝宝 / 生长记录 / 周计划共享

第二版再做：
- 一个用户可切换多个家庭
- 邀请链接 deep link
- 家庭共享收藏
- 家庭动态 / 操作日志

#### 家庭共享技术落地方案（新增）

##### 一、数据库迁移顺序

建议按以下顺序执行，避免中途出现字段缺失或关联不上：

1. 创建 `families`
2. 创建 `family_members`
3. 创建 `family_invites`
4. 为 `babies` 增加 `family_id`
5. 为 `growth_records` 增加 `family_id`
6. 为 `weekly_plan_snapshots` / `weekly_plans` 增加 `family_id`
7. 为 `made_recipes` 增加 `family_id`
8. 执行“历史数据回填脚本”

##### 二、历史数据迁移策略

适用于当前项目已有单用户数据的情况：

1. 为每个 `users` 生成一个默认家庭：
   - 名称可先用“{昵称}的家庭”
   - `owner_user_id = users.id`
2. 为每个用户插入一条 `family_members`：
   - `role = owner`
3. 将 `babies.user_id` 对应的宝宝回填到该用户默认家庭
4. 将该宝宝对应的：
   - `growth_records`
   - `weekly_plan_snapshots`
   - `made_recipes`
   回填对应 `family_id`
5. 后续所有宝宝/记录/周计划查询改为按 `family_id` + `baby_id` 过滤

##### 三、后端改造清单

###### 1. 认证层

- 微信登录成功后，除了返回用户信息，还需要带回：
  - 当前所属家庭 ID
  - 当前家庭角色
  - 是否已加入家庭
- 若用户尚无家庭：
  - 自动创建默认家庭
  - 或在首次登录后引导创建家庭

###### 2. 家庭模块

新增后端模块：
- `GET /api/family/current`
- `POST /api/family/create`
- `POST /api/family/invite`
- `POST /api/family/join`
- `GET /api/family/members`
- `PATCH /api/family/member/:memberId/role`
- `DELETE /api/family/member/:memberId`

###### 3. 宝宝模块

现有 `baby/create`、`baby/list`、`baby/update` 需要改为：
- 默认写入当前用户所在 `family_id`
- 查询时按 `family_id` 返回全家共享宝宝
- 权限校验改为“当前用户是否属于该家庭”

###### 4. 生长记录模块

现有 `growth-record/add`、`growth-record/history` 需要改为：
- 写入 `family_id`
- 查询时按 `family_id + baby_id`
- 权限校验以家庭成员身份为准，而不是单纯 `user_id`

###### 5. 周计划模块

现有 `weekly-plan/generate`、`weekly-plan/current`、`weekly-plan/save`、`weekly-plan/shopping-list` 需要改为：
- 保存时附带 `family_id`
- 读取本周菜单时按 `family_id + baby_id + week_start`
- 爸爸和妈妈看到同一份本周菜单

###### 6. 食谱模块

- 收藏：建议暂时保持个人维度，不用立即家庭共享
- 做过记录：建议升级为家庭共享，保留 `user_id` 记录“谁操作的”
- 自制食谱：建议增加 `shared_scope`
  - `private`
  - `family`
  - `public`

##### 四、前端改造清单

###### 1. 登录后全局状态

全局状态新增：
- `currentFamily`
- `familyMembers`
- `myFamilyRole`
- `hasFamily`

###### 2. 我的页面

新增入口：
- `我的家庭`

新增页面能力：
- 查看家庭信息
- 查看成员列表
- 生成邀请码
- 输入邀请码加入家庭
- 根据角色展示管理按钮

###### 3. 首页

可选增强：
- 宝宝区域下方显示“当前家庭：XXX”
- 若用户处于 `viewer`，则隐藏“可编辑型操作”

###### 4. 生长记录 / 周计划 / 宝宝档案

这些页面不需要大改 UI，但需要统一改查询来源：
- 不再理解为“我个人的数据”
- 改为“我当前家庭共享的数据”

##### 五、权限策略建议

| 场景 | owner | editor | viewer |
|------|-------|--------|--------|
| 查看家庭成员 | ✅ | ✅ | ✅ |
| 邀请新成员 | ✅ | ❌ | ❌ |
| 修改家庭名称 | ✅ | ❌ | ❌ |
| 编辑宝宝档案 | ✅ | ✅ | ❌ |
| 记录生长数据 | ✅ | ✅ | ❌ |
| 生成周计划 | ✅ | ✅ | ❌ |
| 查看周计划 | ✅ | ✅ | ✅ |
| 查看生长记录 | ✅ | ✅ | ✅ |

##### 六、推荐开发顺序

建议按下面顺序落地，风险最低：

1. 数据库新增 `families / family_members / family_invites`
2. 为 `babies / growth_records / weekly_plan_snapshots` 增加 `family_id`
3. 写历史数据迁移脚本
4. 后端先完成 `family/current`、`family/create`、`family/join`
5. 再改 `baby/list`、`growth-record/history`、`weekly-plan/current`
6. 前端新增【我的家庭】页面
7. 前端切换到基于家庭读取共享数据
8. 最后补角色权限控制和邀请码管理细节

##### 七、联调验收点

联调时至少覆盖以下用例：

1. 妈妈创建家庭并创建宝宝
2. 爸爸通过邀请码加入
3. 爸爸登录后能看到同一个宝宝
4. 爸爸新增一条生长记录，妈妈刷新后可见
5. 妈妈生成本周菜单，爸爸刷新后可见
6. 爸爸在 `viewer` 角色下不可编辑
7. 邀请码过期或重复使用时提示正确

### 服务端业务逻辑

#### 推荐算法

```javascript
// 伪代码：根据宝宝年龄和过敏源推荐食谱
function generateDailyRecommendation(babyId) {
  const baby = db.collection('babies').findOne({ _id: babyId });
  const ageMonths = calculateAgeMonths(baby.birthDate);
  
  // 1. 筛选适龄食谱（排除已做过）
  const availableRecipes = db.collection('recipes').find({
    min_age_months: { $lte: ageMonths },
    max_age_months: { $gte: ageMonths },
    allergens: { $nin: baby.allergies },
    _id: { $nin: recentlyMadeIds }  // 排除最近一周的
  });
  
  // 2. 根据营养标签和用户偏好排序
  const scored = availableRecipes.map(recipe => ({
    ...recipe,
    score: calculateScore(recipe, baby)  // 综合评分逻辑
  }));
  
  // 3. 分别选择早中晚食谱（确保营养搭配）
  const breakfast = selectRecipe(scored, 'breakfast');
  const lunch = selectRecipe(scored, 'lunch');
  const dinner = selectRecipe(scored, 'dinner');
  
  return { breakfast, lunch, dinner };
}

// 评分计算
function calculateScore(recipe, baby) {
  let score = 0;
  
  // 基础分
  score += recipe.rating * 10;
  
  // 偏好加分
  const matchingTags = recipe.tags.filter(tag => baby.dietary_preferences.includes(tag));
  score += matchingTags.length * 5;
  
  // 新鲜度加分（最近一个月内未做过）
  const lastMade = db.collection('made_recipes').findOne({
    recipe_id: recipe._id,
    baby_id: baby._id
  });
  if (!lastMade || (Date.now() - lastMade.made_date > 30*24*60*60*1000)) {
    score += 15;
  }
  
  // 营养多样性加分（与最近7天的食谱不重复）
  const recentRecipes = getRecentMadeRecipes(baby._id, 7);
  if (!recentRecipes.includes(recipe._id)) {
    score += 10;
  }
  
  return score;
}
```

#### 生长数据分析

```javascript
// 伪代码：分析生长数据并生成解读文案
function analyzeGrowthData(babyId) {
  const records = db.collection('growth_records')
    .find({ baby_id: babyId })
    .sort({ measured_date: -1 })
    .limit(12);
  
  const latest = records[0];
  const threeMonthsAgo = records.find(r => 
    Date.now() - r.measured_date <= 90*24*60*60*1000
  );
  
  // 1. 计算百分位数（需调用成长曲线标准数据表）
  const heightPercentile = calculatePercentile('height', latest.height, babyAge);
  const weightPercentile = calculatePercentile('weight', latest.weight, babyAge);
  
  // 2. 计算增长速度
  const heightGrowth = latest.height - threeMonthsAgo.height;
  const weightGrowth = latest.weight - threeMonthsAgo.weight;
  
  // 3. 生成 AI 解读文案
  let analysis = `宝宝身高位于同龄人的${heightPercentile}%分位，`;
  analysis += `体重位于${weightPercentile}%分位。`;
  
  if (heightGrowth > 7 && weightGrowth > 1.5) {
    analysis += `近三个月成长快速，继续加油！`;
  } else if (heightGrowth < 3 || weightGrowth < 0.3) {
    analysis += `最近成长较缓，建议加强营养补充。`;
  }
  
  // 4. 基于数据推荐食谱
  const recommendations = generateRecipeRecommendations(
    heightPercentile, 
    weightPercentile, 
    baby.allergies
  );
  
  return {
    analysis,
    percentiles: { heightPercentile, weightPercentile },
    recommendations
  };
}
```

---

### 云函数部署指南

#### 关键云函数列表

| 云函数名 | 触发方式 | 说明 |
|---------|--------|------|
| `wechatLogin` | HTTP / 小程序调用 | 微信授权登录 |
| `getRecommendation` | HTTP | 获取推荐食谱 |
| `generateWeeklyPlan` | HTTP | 生成周计划 |
| `analyzeGrowthData` | 定时器（每日） | 定时分析生长数据 |
| `generateShoppingList` | HTTP | 生成购物清单 |
| `sendNotification` | 定时器（每日8:30） | 发送推送通知 |
| `batchImportRecipes` | HTTP | 批量导入食谱（管理员） |

#### 云函数实现示例（Node.js）

```javascript
// 云函数：获取今日推荐
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { baby_id } = event;
  const user_id = event.userInfo.openId;
  
  try {
    // 验证权限
    const baby = await db.collection('babies')
      .doc(baby_id)
      .get();
    
    if (baby.data.user_id !== user_id) {
      throw new Error('Permission denied');
    }
    
    // 获取今日推荐
    const recommendation = await generateRecommendation(baby_id);
    
    return {
      code: 0,
      data: recommendation
    };
  } catch (error) {
    return {
      code: -1,
      message: error.message
    };
  }
};

async function generateRecommendation(babyId) {
  // 实现推荐逻辑
  // ...
  return {
    breakfast: {...},
    lunch: {...},
    dinner: {...}
  };
}
```

---

## 附录：关键概念说明

### 月龄划分

- **6-8月龄**：开始添加辅食，以泥糊状为主
- **8-10月龄**：逐渐增加食物粗糙度，引入手指食物
- **10-12月龄**：接近成人食物形态，鼓励自主进食
- **1-2岁**：家庭食物逐步调整，满足营养需求
- **2-3岁**：提升营养均衡意识
- **3岁+**：幼儿园饮食适应

### 营养标签说明

| 标签 | 说明 | 适用月龄 |
|------|------|--------|
| 补铁 | 含血红蛋白、铁质丰富 | 8月龄+ |
| 补钙 | 含钙质丰富 | 6月龄+ |
| 补蛋白 | 蛋白质含量高 | 8月龄+ |
| 易消化 | 清淡易吸收 | 6月龄+ |
| 手指食物 | 可用手指捏食 | 8月龄+ |

---

**文档版本**：v1.0  
**最后更新**：2026年3月  
**负责人**：产品团队
