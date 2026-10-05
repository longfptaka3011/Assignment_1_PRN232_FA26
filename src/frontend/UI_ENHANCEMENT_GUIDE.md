# TaskTrack UI/UX Enhancement Guide

## Tổng Quan

Dự án đã được nâng cấp UI/UX với các cải tiến sau:

### 1. Design System Token Architecture (3-Layer)

```
Primitive (raw values) → Semantic (purpose aliases) → Component (component-specific)
```

**File**: `src/assets/design-tokens.json`

Chứa đầy đủ các design tokens theo 3 layer:
- **Primitive**: Raw colors, spacing, typography
- **Semantic**: Purpose-based aliases (background, foreground, primary, etc.)
- **Component**: Component-specific tokens (button, card, input, etc.)

### 2. CSS Variables (Design Tokens)

**File**: `src/styles/design-tokens.css`

Import vào project để sử dụng các CSS variables đã được chuẩn hóa.

### 3. Micro-interactions Đã Thêm

#### Hover Effects
```css
.hover-scale:hover { transform: scale(1.02); }
.hover-lift:hover { transform: translateY(-4px); }
.hover-glow:hover { box-shadow: var(--shadow-glow-cyan); }
```

#### Ripple Effect
```css
.ripple::after {
  /* Creates ripple effect on click */
}
```

#### Press Effect
```css
.press-effect:active { transform: scale(0.98); }
```

#### Pulse Ring
```css
.pulse-ring::before {
  /* Animated pulse ring effect */
}
```

### 4. Animations Mới

```css
/* Fade In Up với stagger delays */
@keyframes fadeInUp { ... }
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }

/* Scale In cho modal */
@keyframes scaleIn { ... }

/* Modal Slide In */
@keyframes modalSlideIn { ... }

/* Shake cho error */
@keyframes shake { ... }

/* Float cho empty state */
@keyframes float { ... }

/* Pulse cho dots */
@keyframes pulse { ... }
```

### 5. Glass Effects

```css
.glass {
  background: rgba(26, 26, 37, 0.85);
  backdrop-filter: blur(20px);
}

.glass-strong {
  background: rgba(21, 21, 31, 0.95);
  backdrop-filter: blur(40px);
}
```

### 6. Neon Glow Effects

```css
.neon-cyan { box-shadow: 0 0 5px var(--primary), 0 0 20px var(--primary-glow), 0 0 40px rgba(0, 245, 212, 0.15); }
.neon-pink { box-shadow: 0 0 5px var(--accent-pink), 0 0 20px rgba(255, 0, 110, 0.3), 0 0 40px rgba(255, 0, 110, 0.15); }
.neon-green { box-shadow: 0 0 5px var(--accent-green), 0 0 20px rgba(48, 209, 88, 0.3), 0 0 40px rgba(48, 209, 88, 0.15); }
.neon-purple { box-shadow: 0 0 5px var(--secondary), 0 0 20px var(--secondary-muted), 0 0 40px rgba(191, 90, 242, 0.15); }
```

### 7. Skeleton Loading

```css
.skeleton {
  position: relative;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  animation: skeleton-shine 1.5s ease-in-out infinite;
}
```

## Cách Sử Dụng

### 1. Sử Dụng CSS Variables

```tsx
// Trong component
<div style={{ 
  background: 'var(--bg-card)',
  border: 'var(--border-subtle)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow)',
  padding: 'var(--space-6)',
  transition: 'var(--transition)'
}}>
  Content
</div>
```

### 2. Sử Dụng Component Tokens

```tsx
// Button với tokens
<button className="btn btn-primary hover-lift ripple">
  Click Me
</button>

// Card với tokens
<div className="card hover-glow">
  Card Content
</div>

// Input với tokens
<input className="form-input" placeholder="Enter text..." />
```

### 3. Thêm Micro-interactions

```tsx
// Hover Scale
<div className="hover-scale">Hover to scale</div>

// Hover Lift
<div className="hover-lift">Hover to lift</div>

// Ripple Effect
<button className="ripple">Click for ripple</button>

// Press Effect
<button className="press-effect">Click to press</button>
```

### 4. Sử Dụng Glass Effect

```tsx
// Glass Background
<div className="glass">
  Glass Effect Content
</div>

// Strong Glass
<div className="glass-strong">
  Strong Glass Effect
</div>
```

### 5. Sử Dụng Neon Glow

```tsx
// Neon Cyan
<div className="neon-cyan">Cyan Glow</div>

// Neon Pink
<div className="neon-pink">Pink Glow</div>

// Neon Green
<div className="neon-green">Green Glow</div>

// Neon Purple
<div className="neon-purple">Purple Glow</div>
```

### 6. Skeleton Loading

```tsx
// Skeleton Card
<div className="skeleton-card">
  <div className="skeleton skeleton-line short"></div>
  <div className="skeleton skeleton-line full"></div>
  <div className="skeleton skeleton-line medium"></div>
</div>
```

### 7. Animation Classes

```tsx
// Fade In Up với delay
<div className="animate-fade-in-up delay-100">
  Animated Content
</div>

// Scale In
<div className="animate-scale-in">
  Scaled Content
</div>

// Pulse Ring
<div className="pulse-ring">
  <Icon />
</div>
```

### 8. Sử Dụng Gradient Text

```tsx
// Single Gradient
<h1 className="gradient-text">Gradient Title</h1>

// Triple Gradient
<h1 className="gradient-text-3">Triple Gradient</h1>
```

## Các File Đã Cải Tiến

| File | Cải tiến |
|------|----------|
| `src/index.css` | Thêm micro-interactions, animations, responsive utilities |
| `src/components/Layout.css` | Cải thiện hover effects, transitions, button styles |
| `src/pages/TaskList.css` | Thêm stagger animations, modal animations, skeleton loading |
| `src/pages/Dashboard.css` | Cải thiện chart styling, card animations, layout |
| `src/assets/design-tokens.json` | 3-layer token architecture hoàn chỉnh |
| `src/styles/design-tokens.css` | CSS variables và utility classes |

## Best Practices

### 1. Luôn Sử Dụng CSS Variables
```css
/* ✅ Đúng */
color: var(--primary);
background: var(--bg-card);
padding: var(--space-4);

/* ❌ Sai */
color: #00f5d4;
background: #15151f;
padding: 16px;
```

### 2. Sử Dụng Transition Phù Hợp
```css
/* Fast transition cho hover */
transition: var(--transition-fast); /* 150ms */

/* Normal transition */
transition: var(--transition); /* 250ms */

/* Slow transition cho cards */
transition: var(--transition-slow); /* 400ms */

/* Bounce transition cho buttons */
transition: var(--transition-bounce); /* 500ms */
```

### 3. Animation Staggering
```tsx
// Đối với danh sách items
{[1, 2, 3, 4, 5, 6].map((i) => (
  <div 
    key={i} 
    className="animate-fade-in-up"
    style={{ animationDelay: `${(i - 1) * 50}ms` }}
  >
    Item {i}
  </div>
))}
```

### 4. Sử Dụng Border-radius Nhất Quán
```css
/* Small elements (tags, badges) */
border-radius: var(--radius-sm); /* 6px */

/* Medium elements (inputs, buttons) */
border-radius: var(--radius-md); /* 8px */

/* Large elements (cards, modals) */
border-radius: var(--radius-lg); /* 12px */

/* Extra large elements (panels) */
border-radius: var(--radius-xl); /* 16px */

/* Full round (avatars, pills) */
border-radius: var(--radius-full); /* 9999px */
```

## Responsive Breakpoints

```css
/* Extra Large (≥1280px) */
@media (max-width: 1280px) { ... }

/* Large (≥1024px) */
@media (max-width: 1024px) { ... }

/* Medium (≥768px) */
@media (max-width: 768px) { ... }

/* Small (≥640px) */
@media (max-width: 640px) { ... }
```

## Color System

### Primary Colors
- `--primary`: #00f5d4 (Cyan)
- `--secondary`: #bf5af2 (Purple)

### Accent Colors
- `--accent-pink`: #ff006e
- `--accent-blue`: #3a86ff
- `--accent-green`: #30d158
- `--accent-orange`: #ff9500
- `--accent-red`: #ff453a
- `--accent-yellow`: #ffd60a

### Status Colors
- Success: `--accent-green`
- Warning: `--accent-yellow`
- Error: `--accent-red`
- Info: `--accent-blue`

## Typography Scale

```css
/* Display */
font-size: 2.25rem; /* h1 display */

/* Headings */
font-size: 1.875rem; /* h1 */
font-size: 1.5rem;   /* h2 */
font-size: 1.25rem;  /* h3 */

/* Body */
font-size: 1rem;      /* body text */

/* Small */
font-size: 0.875rem;  /* small text */
font-size: 0.75rem;   /* caption */
```

## Shadow System

```css
/* Subtle shadow */
box-shadow: var(--shadow-sm);

/* Normal shadow */
box-shadow: var(--shadow);

/* Medium shadow */
box-shadow: var(--shadow-md);

/* Large shadow */
box-shadow: var(--shadow-lg);

/* Glow shadows */
box-shadow: var(--shadow-glow-cyan);
box-shadow: var(--shadow-glow-purple);
box-shadow: var(--shadow-glow-pink);
box-shadow: var(--shadow-glow-green);
box-shadow: var(--shadow-glow-orange);
box-shadow: var(--shadow-glow-blue);
```

## Z-Index Scale

```css
--z-dropdown: 50
--z-sticky: 100
--z-fixed: 200
--z-modal-backdrop: 300
--z-modal: 400
--z-popover: 500
--z-tooltip: 600
```

## Tài Liệu Tham Khảo

- [UI Styling Skill](../.agents/skills/ui-ux-pro-max/cli/assets/skills/ui-styling/SKILL.md)
- [Design System Skill](../.agents/skills/ui-ux-pro-max/cli/assets/skills/design-system/SKILL.md)
- [Design Tokens JSON](./assets/design-tokens.json)
- [CSS Variables](./styles/design-tokens.css)
