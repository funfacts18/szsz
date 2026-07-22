# DESIGN.md

> 数智安农 · 农业高校数字化素养平台 — 在蓝绿品牌色中注入有机弧线，打破生硬盒状感

## 1. Visual Theme & Atmosphere

**Style**: Digital Campus / 数字田园
**Keywords**: 有机、温润、通透、数字感、弧线、层次、呼吸感
**Tone**: 专业稳重中不失温润亲和 — NOT 冰冷僵硬、死板方盒

**Interaction Tier**: L1 精致静态
**Dependencies**: CSS only

## 2. Color Palette & Roles

新增阴影变量：
--shadow-soft: 0 20px 60px rgba(21,101,192,.08), 0 8px 24px rgba(10,61,66,.06);
--shadow-elevated: 0 30px 80px rgba(21,101,192,.12), 0 12px 36px rgba(10,61,66,.08);

## 3. Typography Rules — 沿用现有字体方案

## 4. Component Stylings

### Hero 背景装饰圆弧
两个径向渐变光晕，一个蓝色（右上），一个绿色（左下），形成有机背景层次

### Panel 阴影增强
默认: --shadow-soft；Hover: --shadow-elevated + translateY(-2px)

### Welcome 面板
内部增加半透明径向渐变光晕弧，替代原有纯色 AHAU 水印

### Quick Links
hover 时上移距离加大 (6px)，阴影更深

## 5. Layout Principles — 沿用现有

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Subtle | --shadow-soft | 默认面板 |
| Elevated | --shadow-elevated | 悬停面板 |

## 7. Animation & Interaction — L1

### Reduced Motion
@media (prefers-reduced-motion: reduce) { hover transforms disabled }

## 8. Do's and Don'ts

### Do
- 在卡片背景中使用柔和的光晕弧线
- 保持蓝绿品牌色的整体协调性
- 用阴影层次营造纵深感和呼吸感
- 让装饰元素在 hover 时微妙增强
- 用弧形光晕代替生硬的矩形色块

### Don't
- ❌ 不要让装饰元素喧宾夺主
- ❌ 不要引入新的鲜艳色彩
- ❌ 不要用大面积强对比色块做装饰
- ❌ 不要让动画造成卡顿或布局偏移
- ❌ 不要在同一面板内使用多种圆角值
- ❌ 不要增加过度花哨的边框和描边
- ❌ 不要忽略移动端的触摸体验
- ❌ 不要在面板上方叠加遮挡内容的元素

## 9. Responsive Behavior — 沿用现有断点
