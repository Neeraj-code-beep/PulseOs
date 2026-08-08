# PulseOS — Design System & Visual Specification

## 1. Visual Philosophy: Warm Editorial Productivity
PulseOS is designed as a calm, precise, student-focused productivity instrument. It replaces generic AI-SaaS blue/purple aesthetics with a warm paper canvas, coral actions, and green focus accents.

---

## 2. Color Palette & Semantic Tokens

### Light Theme (`--bg-app: #F5F3EE`) — Warm Paper
- `--bg-app`: `#F5F3EE` (Warm tactile canvas)
- `--bg-surface`: `#FBFAF7` (Primary container surface)
- `--bg-surface-elevated`: `#FFFFFF` (Subsurface / hover)
- `--text-primary`: `#1C1C1A` (Deep charcoal)
- `--text-secondary`: `#66645F` (Muted warm stone)
- `--text-muted`: `#96938C` (Soft label text)
- `--border`: `#DDD9D1` (Primary structural border)
- `--border-soft`: `#E9E5DD` (Subtle separator border)
- `--primary`: `#E85D3F` (Coral Accent)
- `--primary-hover`: `#D94F32`
- `--primary-soft`: `#FBE5DF`
- `--focus`: `#2F7D68` (Deep Forest Green)
- `--focus-soft`: `#DDEDE7`
- `--accent`: `#E7B65A` (Warm Gold)
- `--accent-soft`: `#F8EDD5`
- `--danger`: `#C94B40`

### Dark Theme (`.dark`, `--bg-app: #151513`) — Warm Charcoal
- `--bg-app`: `#151513` (Deep charcoal canvas)
- `--bg-surface`: `#1C1C19` (Elevated dark surface)
- `--bg-surface-elevated`: `#24231F` (Subsurface hover)
- `--text-primary`: `#F3F0E8` (Soft cream text)
- `--text-secondary`: `#B5B1A8` (Muted stone)
- `--text-muted`: `#77736C` (Quiet text)
- `--border`: `#34322D` (Dark border)
- `--border-soft`: `#292824` (Subtle dark separator)
- `--primary`: `#F07155` (Bright Coral)
- `--primary-hover`: `#FA8064`
- `--primary-soft`: `#3B241E`
- `--focus`: `#65B49A` (Mint Focus Green)
- `--focus-soft`: `#1D352D`
- `--accent`: `#D9A84E`
- `--danger`: `#E06356`

---

## 3. Typography
- **Primary Display & Body**: `DM Sans` (Weights: 400, 500, 600, 700). Single clean UI font replacing Inter and Manrope.
- **Timer & Duration**: `JetBrains Mono` (Weights: 500, 700). Used for timers, time values, and tabular numbers.

---

## 4. Radii & Surface Discipline
- **Controls**: `8px` (`--radius-md`)
- **Containers & Surfaces**: `10px` (`--radius-lg`)
- **Outer Shell & Modals**: `14px` (`--radius-xl`)
- **Pills**: Used strictly when semantic tag context requires a badge.

---

## 5. UI Primitives
- **`<Button>`**: Supports `primary` (coral), `secondary`, `ghost`, `danger`.
- **`<Card>`**: Standardized surface container with border and subtle shadow.
- **`<Input>`**: Accessible text input with label and error state handling.
- **`<Badge>`**: Semantic tags (`default`, `primary`, `accent`, `success`, `warning`, `danger`).
- **`<ThemeToggle>`**: Icon toggle between Sun and Moon modes.

---

## 6. Analytics Visualization & Hierarchy Standards
- **Focus Trend Visualization**: Custom Recharts BarChart styled with Forest Green (`var(--focus)`), 320px container height, rounded top bar radii (`4px`), subtle zero-day bars, and interactive hover emphasis (`brightness(1.12)`). No blue/purple gradients or bouncing animations.
- **Warm Tooltip**: Tooltip styled with `--bg-surface-elevated`, thin warm border, small shadow, displaying uppercase date, formatted duration (`1h 25m focused`), and session count.
- **Metric Strip Hierarchy**: Single editorial surface with subtle vertical dividers (`divide-x`), 28–36px font-mono numbers for value dominance, and 10–11px uppercase tracking labels.
- **Task Performance Visual**: Comparative horizontal progress bar comparing PLANNED workload (warm neutral `var(--border)`) against FOCUSED duration (Forest Green `var(--focus)`), accompanied by a neutral explanatory note ("Recorded focus time against estimated workload.") and task completion percentage.
- **Recent Focus Activity**: Clean log rows with status dot indicators (`var(--focus)` completed / `var(--text-muted)` cancelled), hover background transitions, relative timestamps (`Today · 11:05 AM`), and text metadata.
- **Deterministic Observations**: `YOUR RHYTHM` observation card providing clean bullet points calculated strictly from live metrics without AI terminology, chatbot badges, or sparkle icons.

