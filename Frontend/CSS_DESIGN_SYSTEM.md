# TradeGuard AI - Complete CSS Design System

> **Version:** 2.0 | **Last Updated:** February 2026  
> **CSS Architecture:** Webflow Export + Custom CSS + Tailwind CSS

---

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Typography](#typography)
4. [Color System](#color-system)
5. [Spacing System](#spacing-system)
6. [Layout & Grid](#layout--grid)
7. [Component Library](#component-library)
8. [Form Elements](#form-elements)
9. [Navigation](#navigation)
10. [Animations & Transitions](#animations--transitions)
11. [Responsive Breakpoints](#responsive-breakpoints)
12. [Utility Classes](#utility-classes)
13. [Best Practices](#best-practices)
14. [Tailwind Integration](#tailwind-integration)

---

## Overview

TradeGuard AI uses a comprehensive multi-layer CSS architecture:
- **normalize.css** - Cross-browser CSS reset (v3.0.3)
- **webflow.css** - Webflow framework base styles, grid system, widgets
- **tradeguard-ai.webflow.css** - Custom Webflow export with app-specific components
- **index.css** - React app custom styles (profiles, predictions, etc.)

---

## File Structure

```
Frontend/src/css/
├── normalize.css              # CSS reset for consistent cross-browser styling
├── webflow.css                # Webflow base framework (1,791 lines)
│   ├── Icons (webflow-icons font)
│   ├── Grid System (w-col-1 through w-col-12)
│   ├── Form Elements (w-input, w-select, w-button)
│   ├── Widgets (slider, dropdown, lightbox)
│   └── Responsive utilities
├── tradeguard-ai.webflow.css  # App-specific styles (12,251 lines)
│   ├── CSS Custom Properties (:root)
│   ├── Typography classes
│   ├── Component styles (cards, buttons, navigation)
│   ├── Page-specific layouts
│   └── Admin dashboard styles
└── (imported in main.jsx)
    └── index.css              # React app custom styles (748 lines)
        ├── Profile page styles
        ├── Predictions page styles
        └── Custom animations
```

---

## Typography

### Font Families

| Font | Usage | Weights Available |
|------|-------|-------------------|
| **Lato** | Webflow default | 100, 300, 400, 700, 900 (normal + italic) |
| **Roboto** | React app override | 100-900 |
| **webflow-icons** | Icon font | - |

```css
/* Lato (from tradeguard-ai.webflow.css) */
@font-face {
  font-family: Lato;
  src: url('../fonts/Lato-Regular.ttf') format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Roboto override (from index.css) */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;600;700;800;900&display=swap');
```

### Heading Styles

| Class | Size | Weight |
|-------|------|--------|
| `.heading-style-h1` | 3.5rem | Bold |
| `.heading-style-h2` | 2.5rem | Bold |
| `.heading-style-h3` | 2rem | Bold |
| `.heading-style-h4` | 1.5rem | Bold |
| `.heading-style-h5` | 1.25rem | Bold |
| `.heading-style-h6` | 1rem | Bold |

### Text Size Classes

| Class | Size | Usage |
|-------|------|-------|
| `.text-size-tiny` | ~0.75rem | Badges, meta |
| `.text-size-small` | ~0.875rem | Secondary text |
| `.text-size-regular` | 1rem | Body text |
| `.text-size-medium` | 1.125rem | Emphasis |
| `.text-size-large` | 1.25rem | Subheadings |
| `.text-size-xlarge` | 1.75rem | Large display |

### Font Weight Classes

| Class | Weight |
|-------|--------|
| `.text-weight-light` | 300 |
| `.text-weight-normal` | 400 |
| `.text-weight-medium` | 500-600 |
| `.text-weight-semibold` | 600 |
| `.text-weight-bold` | 700 |
| `.text-weight-xbold` | 800-900 |

### Text Style Utilities

| Class | Effect |
|-------|--------|
| `.text-style-italic` | Italic text |
| `.text-style-strikethrough` | Strikethrough |
| `.text-style-allcaps` | Uppercase |
| `.text-style-nowrap` | No wrap |
| `.text-style-muted` | Reduced opacity |
| `.text-style-link` | Link styling |
| `.text-style-quote` | Blockquote style |

### Text Alignment

| Class | Alignment |
|-------|-----------|
| `.text-align-left` | Left |
| `.text-align-center` | Center |
| `.text-align-right` | Right |

---

## Color System

### CSS Custom Properties (Complete)

```css
:root {
  /* ===== BRAND COLORS ===== */
  --base-color-brand--color-primary: #1e65fa;     /* Primary blue */
  --base-color-brand--color-secondary: #f3ff43;   /* Yellow accent */
  --base-color-brand--color-black: #181818;       /* Brand black */
  --base-color-brand--blue: #2d62ff;              /* Secondary blue */
  --base-color-brand--blue-dark: #080331;         /* Dark blue */
  --base-color-brand--blue-light: #d9e5ff;        /* Light blue */
  --base-color-brand--pink: #dd23bb;              /* Pink accent */
  --base-color-brand--pink-light: #ffaefe;        /* Light pink */
  --base-color-brand--pink-dark: #3c043b;         /* Dark pink */
  
  /* ===== SYSTEM / STATUS COLORS ===== */
  --color-red: #ef5350;                           /* Error/Sell/Bearish */
  --color-green: #26a69a;                         /* Success/Buy/Bullish */
  --base-color-system--success-green: #cef5ca;    /* Success background */
  --base-color-system--success-green-dark: #114e0b;
  --base-color-system--warning-yellow: #fcf8d8;   /* Warning background */
  --base-color-system--warning-yellow-dark: #5e5515;
  --base-color-system--error-red: #f8e4e4;        /* Error background */
  --base-color-system--error-red-dark: #3b0b0b;
  --base-color-system--focus-state: #2d62ff;
  
  /* ===== NEUTRAL COLORS ===== */
  --base-color-neutral--white: #fff;
  --base-color-neutral--black: var(--base-color-brand--color-black);
  --base-color-neutral--neutral-lightest: #eee;
  --base-color-neutral--neutral-lighter: #ccc;
  --base-color-neutral--neutral-light: #aaa;
  --base-color-neutral--neutral: #666;
  --base-color-neutral--neutral-dark: #444;
  --base-color-neutral--neutral-darker: #222;
  --base-color-neutral--neutral-darkest: #111;
  
  /* ===== TEXT COLORS ===== */
  --text-color--text-primary: #323539;
  --text-color--text-secondary: #858c95;
  --text-color--text-alternate: var(--base-color-neutral--white);
  --text-color--text-success: var(--base-color-system--success-green-dark);
  --text-color--text-warning: var(--base-color-system--warning-yellow-dark);
  --text-color--text-error: var(--base-color-system--error-red-dark);
  --text-grey: #64748b;
  
  /* ===== BACKGROUND COLORS ===== */
  --background-color--background-primary: var(--base-color-brand--color-black);
  --background-color--background-secondary: var(--base-color-brand--color-primary);
  --background-color--background-tertiary: var(--base-color-brand--color-secondary);
  --background-color--background-alternate: var(--base-color-neutral--white);
  --background-color--background-success: var(--base-color-system--success-green);
  --background-color--background-warning: var(--base-color-system--warning-yellow);
  --background-color--background-error: var(--base-color-system--error-red);
  --background-grey: #fafbfc;
  --background-header: #f1f5f9;
  --color-primary-light: #ecf4fc;
  
  /* ===== BORDER COLORS ===== */
  --border-color--border-primary: #e5e5e7;
  --border-color--border-secondary: var(--base-color-brand--color-primary);
  --border-color--border-alternate: var(--base-color-neutral--neutral-darker);
  
  /* ===== LINK COLORS ===== */
  --link-color--link-primary: var(--base-color-brand--color-primary);
  --link-color--link-secondary: var(--base-color-neutral--black);
  --link-color--link-alternate: var(--base-color-neutral--white);
  
  /* ===== MEMBERSTACK INTEGRATION ===== */
  --memberstack-library--ms-main-cta-color: #2962ff;
  --memberstack-library--ms-main-cta-hover: #1051b9;
  --memberstack-library--ms-border-color: #e5e5e7;
  --memberstack-library--ms-shadow-color: #0000001a;
  --memberstack-library--ms-main-text-color: #121331;
  --memberstack-library--ms-input-placeholder: #12133199;
  --memberstack-library--ms-background-color: #f4f5f8;
  
  /* ===== SIZING ===== */
  --card-radius: 0.5rem;
}
```

### Text Color Classes

| Class | Color | Hex |
|-------|-------|-----|
| `.text-color-primary` | Primary text | `#323539` |
| `.text-color-secondary` | Secondary text | `#858c95` |
| `.text-color-alternate` | White text | `#fff` |
| `.text-color-green` | Success/Buy | `#26a69a` |
| `.text-color-red` | Error/Sell | `#ef5350` |

### Background Color Classes

| Class | Usage |
|-------|-------|
| `.background-color-primary` | Dark brand background |
| `.background-color-secondary` | Blue brand background |
| `.background-color-alternate` | White background |
| `.background-color-tertiary` | Yellow accent background |

---

## Spacing System

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `tiny` | 0.25rem (4px) | Minimal gaps |
| `xxsmall` | 0.375rem (6px) | Tight spacing |
| `xsmall` | 0.5rem (8px) | Small gaps |
| `small` | 0.75rem (12px) | Compact spacing |
| `medium` | 1rem (16px) | Default spacing |
| `large` | 1.25rem (20px) | Comfortable spacing |
| `xlarge` | 2rem (32px) | Section padding |
| `xxlarge` | 2.5rem (40px) | Large sections |
| `huge` | 3rem (48px) | Hero sections |
| `xhuge` | 4rem (64px) | Major breaks |
| `xxhuge` | 5rem (80px) | Page sections |

### Padding Classes

```css
/* All sides */
.padding-tiny    { padding: 0.25rem; }
.padding-xsmall  { padding: 0.5rem; }
.padding-small   { padding: 0.75rem; }
.padding-medium  { padding: 1rem; }
.padding-large   { padding: 1.25rem; }
.padding-xlarge  { padding: 2rem; }
/* ... continues */

/* Directional */
.padding-top     { padding-bottom: 0; padding-left: 0; padding-right: 0; }
.padding-bottom  { padding-top: 0; padding-left: 0; padding-right: 0; }
.padding-left    { padding-top: 0; padding-bottom: 0; padding-right: 0; }
.padding-right   { padding-top: 0; padding-bottom: 0; padding-left: 0; }
.padding-vertical   { padding-left: 0; padding-right: 0; }
.padding-horizontal { padding-top: 0; padding-bottom: 0; }

/* Section padding */
.padding-section-small  { padding-top: 3rem; padding-bottom: 3rem; }
.padding-section-medium { padding-top: 5rem; padding-bottom: 5rem; }
.padding-section-large  { padding-top: 7rem; padding-bottom: 7rem; }
.padding-global { padding-left: 2.5rem; padding-right: 2.5rem; }
```

### Margin Classes

Same pattern as padding: `.margin-tiny`, `.margin-xsmall`, etc.

### Spacer Components

```css
.spacer-tiny    { width: 100%; padding-top: 0.25rem; }
.spacer-xxsmall { width: 100%; padding-top: 0.5rem; }
.spacer-xsmall  { width: 100%; padding-top: 0.75rem; }
.spacer-small   { width: 100%; padding-top: 1rem; }
.spacer-medium  { width: 100%; padding-top: 1.5rem; }
.spacer-large   { width: 100%; padding-top: 2rem; }
/* ... continues */
```

---

## Layout & Grid

### Container Widths

| Class | Max Width |
|-------|-----------|
| `.container` | 940px |
| `.container-small` | 48rem |
| `.container-medium` | 64rem |
| `.container-large` | 80rem |
| `.max-width-xxsmall` | 20rem |
| `.max-width-xsmall` | 24rem |
| `.max-width-small` | 32rem |
| `.max-width-medium` | 40rem |
| `.max-width-large` | 48rem |
| `.max-width-xlarge` | 64rem |
| `.max-width-xxlarge` | 80rem |
| `.max-width-full` | 100% |

### Webflow Grid System

```css
/* 12-column grid */
.w-col-1  { width: 8.33%; }
.w-col-2  { width: 16.67%; }
.w-col-3  { width: 25%; }
.w-col-4  { width: 33.33%; }
.w-col-5  { width: 41.67%; }
.w-col-6  { width: 50%; }
.w-col-7  { width: 58.33%; }
.w-col-8  { width: 66.67%; }
.w-col-9  { width: 75%; }
.w-col-10 { width: 83.33%; }
.w-col-11 { width: 91.67%; }
.w-col-12 { width: 100%; }
```

### Dashboard Layout

```css
.dashboard_main_wrapper {
  background-color: var(--background-grey);
  flex-flow: column;
  width: 100%;
  display: flex;
}

.dashboard_main_app {
  padding: 2rem;
  min-height: calc(100vh - 80px);
  background: #fafbfc;
}

.dashboard_main_content {
  grid-template-columns: 1.75fr 1fr;
  gap: 1.25rem;
  display: grid;
}

.dashboard_main_content.is-app {
  grid-template-columns: 1.75fr;  /* Single column */
}

.dashboard_main_header {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1.25rem;
  display: grid;
}

.dashboard_main_flex {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
```

### Aspect Ratio Classes

```css
.aspect-ratio-square    { padding-top: 100%; }
.aspect-ratio-portrait  { padding-top: 125%; }
.aspect-ratio-landscape { padding-top: 75%; }
.aspect-ratio-widescreen { padding-top: 56.25%; }
```

### Z-Index Scale

| Class | Value |
|-------|-------|
| `.z-index-1` | 1 |
| `.z-index-2` | 2 |
| Navbar | 1000 |

---

## Component Library

### Card Components

```css
/* Main Card Wrapper */
.card_app_wrapper {
  border: 1px solid var(--border-color--border-primary);
  background-color: var(--base-color-neutral--white);
  border-radius: 0.75rem;
  overflow: hidden;
  width: 100%;
}

.card_app_wrapper.is-small {
  flex-flow: column;
  justify-content: space-between;
  display: flex;
}

/* Card Header */
.card_app_header {
  gap: 0.25rem;
  border-bottom: 1px solid var(--border-color--border-primary);
  flex-flow: row;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  min-height: 5.25rem;
}

/* Card Price Display */
.card_app_price {
  font-size: 2.5rem;
  line-height: 1;
}

/* Card Text Wrapper */
.card_main_text_wrapper {
  gap: 0.2rem;
  justify-content: flex-start;
  align-items: flex-start;
  display: flex;
}

.card_main_text_wrapper.is-centered {
  gap: 0.5rem;
  justify-content: flex-start;
  align-items: center;
}

/* Legacy Card Wrapper */
.card_main_wrapper {
  border: 1px solid var(--border-color--border-primary);
  background-color: var(--base-color-neutral--white);
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
}

.card_main_wrapper.is-small {
  padding: 1rem 1.25rem;
  gap: 1rem;
}

.card_main_wrapper.is-blue {
  background-color: var(--base-color-brand--color-primary);
  color: var(--base-color-neutral--white);
  border-style: none;
}
```

### Crypto Icons

```css
.card_main_crypto_icon {
  border-radius: 100%;
  max-width: 1.5rem;
}

.card_main_crypto_icon.is-large {
  max-width: 2rem;
}
```

### Buttons

```css
/* Primary Button */
.button {
  padding: 0.75rem 1.5rem;
  display: inline-block;
  border: none;
  cursor: pointer;
  background-color: var(--base-color-brand--color-primary);
  color: white;
  border-radius: 0.5rem;
}

.button:hover {
  opacity: 0.9;
}

/* Button Variants */
.button.is-secondary {
  background-color: transparent;
  border: 1px solid var(--border-color--border-primary);
  color: var(--text-color--text-primary);
}

.button.is-secondary:hover {
  border-color: var(--base-color-brand--color-primary);
  color: var(--base-color-brand--color-primary);
}

.button.is-text {
  background-color: transparent;
  color: var(--base-color-brand--color-primary);
  padding: 0;
}

.button.is-small  { padding: 0.5rem 1rem; font-size: 0.875rem; }
.button.is-large  { padding: 1rem 2rem; }
.button.is-icon   { padding: 0.75rem; }
.button.is-full-width { width: 100%; }
.button.is-white  { background-color: white; color: var(--text-color--text-primary); }
.button.is-brand  { /* Brand colored */ }

/* Webflow Button */
.w-button {
  display: inline-block;
  padding: 9px 15px;
  background-color: #3898EC;
  color: white;
  border: 0;
  line-height: inherit;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0;
}

/* Memberstack Button */
.ms-button {
  border: 1px solid var(--memberstack-library--ms-main-cta-color);
  background-color: var(--memberstack-library--ms-main-cta-color);
  color: #fff;
  border-radius: 8px;
  padding: 13px 16px 11.5px;
  font-weight: 600;
  transition: transform 0.2s, background-color 0.2s;
  box-shadow: 1px 1px 5px #ffffff40, 0 10px 20px -5px #2d3e504d;
}

.ms-button:hover {
  background-color: var(--memberstack-library--ms-main-cta-hover);
  transform: translate(0, 2px);
}
```

### Tags & Badges

```css
.tag_main_wrapper {
  color: var(--base-color-brand--color-primary);
  text-transform: uppercase;
  background-color: #ecf4fc;
  border-radius: 10rem;
  padding: 0.25rem 1rem;
  font-weight: 600;
}

/* Pattern Type Badges */
.pattern-type-badge {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.pattern-type-badge--bullish { background: #26a69a; }
.pattern-type-badge--bearish { background: #ef5350; }
.pattern-type-badge--continuation { background: #7c3aed; }
.pattern-type-badge--reversal { background: #f59e0b; }
```

### Icon Wrappers

```css
.icon_wrapper {
  border: 1px solid var(--border-color--border-primary);
  border-radius: 0.38rem;
  min-width: 2.5rem;
  min-height: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon_wrapper:hover {
  border-color: var(--base-color-brand--color-primary);
  background-color: var(--color-primary-light);
}

/* Size variants */
.icon-1x1-small  { width: 1rem; height: 1rem; }
.icon-1x1-medium { width: 1.5rem; height: 1.5rem; }
.icon-1x1-large  { width: 2rem; height: 2rem; }
.icon-height-small  { height: 1rem; }
.icon-height-medium { height: 1.5rem; }
.icon-height-large  { height: 2rem; }
```

### Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border: 1px solid #e5e5e7;
  border-radius: 0.75rem;
  gap: 1rem;
}

.bookmarks-empty-state {
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e5e5e7;
  border-radius: 0.75rem;
}
```

### Toast Notifications

```css
.toast-container {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #323539;
  color: white;
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

.toast--success { background: #10b981; }
.toast--error { background: #ef4444; }
```

---

## Form Elements

### Webflow Form Base

```css
.w-input, .w-select {
  display: block;
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #333333;
  background-color: #ffffff;
  border: 1px solid #cccccc;
}

.w-input:focus, .w-select:focus {
  border-color: #3898EC;
  outline: 0;
}

.w-input::placeholder {
  color: #999;
}
```

### Custom Form Input

```css
.form_input {
  padding: 0.75rem;
  border: 1px solid var(--border-color--border-primary);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form_input::placeholder {
  color: #858c95;
}

.form_input.is-text-area {
  min-height: 8rem;
  resize: vertical;
}
```

### Main Form Input (Auth forms)

```css
.main_form_input {
  border: 1px solid var(--memberstack-library--ms-border-color);
  box-shadow: 0 5px 10px -5px var(--memberstack-library--ms-shadow-color);
  color: var(--memberstack-library--ms-main-text-color);
  background-color: #fff;
  border-radius: 5px;
  min-height: 40px;
  padding: 8px 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.main_form_input:hover {
  border-color: var(--memberstack-library--ms-main-cta-color);
  box-shadow: none;
}
```

### Checkbox & Radio

```css
.w-checkbox {
  margin-bottom: 5px;
  padding-left: 20px;
  display: block;
}

.form_checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form_checkbox-icon {
  border: 1px solid var(--border-color--border-primary);
  border-radius: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
}

.form_checkbox-icon.w--redirected-checked {
  background-color: var(--base-color-brand--color-primary);
  border-color: var(--base-color-brand--color-primary);
}

.form_radio-icon {
  border: 1px solid var(--border-color--border-primary);
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
}
```

### Form Messages

```css
.form_message-success {
  background-color: var(--background-color--background-success);
  padding: 1rem;
  border-radius: 0.5rem;
}

.form_message-error {
  background-color: var(--background-color--background-error);
  color: var(--text-color--text-error);
  padding: 1rem;
  border-radius: 0.5rem;
}
```

### Auth Form Wrapper

```css
.main_form {
  gap: 1.5rem;
  border-radius: var(--card-radius);
  background-color: var(--base-color-neutral--white);
  border: 1px solid #e5e5e7;
  flex-flow: column;
  min-width: 22rem;
  max-width: 25rem;
  padding: 2rem;
  display: flex;
}

.main_form.is-large {
  min-width: 25rem;
  max-width: 28rem;
}
```

---

## Navigation

### Main Navbar

```css
.navbar_component {
  z-index: 1000;
  background-color: var(--base-color-neutral--white);
  width: 100%;
  height: auto;
  min-height: 5.5rem;
  display: flex;
  position: fixed;
  box-shadow: 0 2px 30px #00000008;
}

.navbar_container {
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  margin: auto;
  display: flex;
}
```

### App Navbar

```css
.navbar_app_component {
  border-bottom: 1px solid var(--border-color--border-primary);
  background-color: var(--base-color-neutral--white);
  width: 100%;
  display: flex;
}

.navbar_app_container {
  grid-template-columns: 1fr auto;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 2rem;
  display: grid;
}
```

### Sidebar Navigation

```css
.sidebar_app_wrapper {
  border-right: 1px solid var(--border-color--border-primary);
  background-color: var(--base-color-neutral--white);
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar_app_link {
  background-color: white;
  color: var(--text-color--text-primary);
  border-left: 5px solid transparent;
  grid-template-columns: minmax(1.125rem, auto) 1fr;
  padding: 0.75rem 1.75rem;
  font-size: 1.13rem;
  font-weight: 500;
  text-decoration: none;
  display: grid;
}

.sidebar_app_link:hover {
  background-color: var(--color-primary-light);
}

.sidebar_app_link.is-active {
  border-left-color: var(--base-color-brand--color-primary);
  background-color: var(--color-primary-light);
  color: var(--base-color-brand--color-primary);
}
```

### Navigation Links

```css
.navbar_link {
  color: var(--text-color--text-primary);
  background-color: transparent;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  text-decoration: none;
}

.navbar_link:hover {
  color: var(--base-color-brand--color-primary);
}

.navbar_app_link {
  gap: 0.5rem;
  color: var(--text-color--text-primary);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
}
```

### Breadcrumb

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.breadcrumb a {
  color: #1e65fa;
  text-decoration: none;
}

.breadcrumb-separator {
  color: #d1d5db;
}
```

---

## Animations & Transitions

### Keyframe Animations

```css
/* Spin Animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shimmer (Skeleton Loading) */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Slide Up (Toast) */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Usage Classes

```css
/* Spinners */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e5e7;
  border-top-color: #1e65fa;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Skeleton Loading */
.card-skeleton__image {
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Standard Transitions

```css
/* Common transition pattern */
transition: all 0.2s ease;

/* Button transitions */
transition: transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1),
            background-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

/* Card hover */
transition: box-shadow 0.2s ease, transform 0.2s ease;
```

---

## Responsive Breakpoints

### Media Query Breakpoints

| Name | Max Width | Usage |
|------|-----------|-------|
| Desktop | > 991px | Default styles |
| Tablet | ≤ 991px | `@media (max-width: 991px)` |
| Mobile Landscape | ≤ 767px | `@media (max-width: 767px)` |
| Mobile Portrait | ≤ 479px | `@media (max-width: 479px)` |

### Responsive Typography

```css
@media screen and (max-width: 767px) {
  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.5rem; }
  h4 { font-size: 1.25rem; }
  h5 { font-size: 1rem; }
  h6 { font-size: 0.875rem; }
}
```

### Responsive Grid Columns

```css
/* Tablet columns: w-col-medium-* */
@media screen and (max-width: 991px) {
  .w-col-medium-6 { width: 50%; }
  .w-col-stack { width: 100%; }
  .dashboard_main_content { grid-template-columns: 1.75fr; }
}

/* Mobile columns: w-col-small-* */
@media screen and (max-width: 767px) {
  .w-col { width: 100%; }
  .w-col-small-6 { width: 50%; }
}

/* Tiny columns: w-col-tiny-* */
@media screen and (max-width: 479px) {
  .w-container { max-width: none; }
}
```

### Visibility Helpers

| Class | Behavior |
|-------|----------|
| `.w-hidden-main` | Hidden on desktop |
| `.w-hidden-medium` | Hidden on tablet |
| `.w-hidden-small` | Hidden on mobile |
| `.w-hidden-tiny` | Hidden on small mobile |
| `.hide` | Always hidden |
| `.is-none` | Display none |

---

## Utility Classes

### Display

```css
.w-block { display: block; }
.w-inline-block { max-width: 100%; display: inline-block; }
.w-hidden { display: none; }
.hide { display: none; }
.is-none { display: none; }
```

### Overflow

```css
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
```

### Pointer Events

```css
.pointer-events-auto { pointer-events: auto; }
.pointer-events-none { pointer-events: none; }
```

### Alignment

```css
.align-center {
  margin-left: auto;
  margin-right: auto;
}
```

### Clearfix

```css
.w-clearfix:before, .w-clearfix:after {
  content: " ";
  display: table;
}
.w-clearfix:after {
  clear: both;
}
```

### Layer (Full Screen Overlay)

```css
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

---

## Best Practices

### 1. Always Use CSS Variables
```css
/* ✅ Good */
color: var(--color-red);
background-color: var(--background-grey);
border: 1px solid var(--border-color--border-primary);

/* ❌ Avoid */
color: #ef5350;
background-color: #fafbfc;
```

### 2. Standard Border Pattern
```css
border: 1px solid var(--border-color--border-primary);  /* #e5e5e7 */
border-radius: 0.75rem;  /* Cards */
border-radius: 0.5rem;   /* Buttons, inputs */
```

### 3. Card Structure
```html
<div class="card_app_wrapper">
  <div class="card_app_header">
    <!-- Header content -->
  </div>
  <div class="card_app_body">
    <!-- Body content -->
  </div>
</div>
```

### 4. Color Application for Trading UI
```css
/* Buy/Bullish */
.text-color-green { color: #26a69a; }
background: rgba(38, 166, 154, 0.08);

/* Sell/Bearish */
.text-color-red { color: #ef5350; }
background: rgba(239, 83, 80, 0.08);
```

### 5. Consistent Spacing
```css
/* Use predefined classes */
padding: 1rem 1.25rem;     /* Standard card padding */
gap: 1.25rem;              /* Grid/flex gaps */
margin-bottom: 1.5rem;     /* Section spacing */
```

### 6. Hover States
```css
/* Opacity change */
.button:hover { opacity: 0.9; }

/* Color change */
.navbar_link:hover { color: var(--base-color-brand--color-primary); }

/* Border highlight */
.icon_wrapper:hover {
  border-color: var(--base-color-brand--color-primary);
  background-color: var(--color-primary-light);
}
```

### 7. Responsive Considerations
- Always test at 991px, 767px, and 479px breakpoints
- Use `.w-col-medium-*` for tablet layouts
- Stack columns on mobile using `.w-col-stack` or `width: 100%`

---

## Tailwind Integration

Tailwind CSS is configured to complement the existing Webflow system:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#1e65fa',
        secondary: '#f3ff43',
        black: '#181818',
        'blue-dark': '#080331',
        'blue-light': '#d9e5ff',
      },
      system: {
        green: '#26a69a',
        red: '#ef5350',
      },
      neutral: {
        lightest: '#eee',
        lighter: '#ccc',
        light: '#aaa',
        DEFAULT: '#666',
        dark: '#444',
        darker: '#222',
        darkest: '#111',
      },
      text: {
        primary: '#323539',
        secondary: '#858c95',
      },
      border: {
        primary: '#e5e5e7',
      },
      background: {
        grey: '#fafbfc',
        header: '#f1f5f9',
      }
    },
    borderRadius: {
      card: '0.75rem',
      sm: '0.5rem',
    },
    spacing: {
      'tiny': '0.25rem',
      'xsmall': '0.5rem',
      'small': '0.75rem',
    }
  }
}
```

### Tailwind Class Usage

```html
<!-- Use Tailwind with custom theme -->
<div class="bg-brand-primary text-white rounded-card p-4">
  <span class="text-system-green">+5.25%</span>
  <span class="text-system-red">-2.10%</span>
</div>

<div class="border border-border-primary bg-background-grey">
  <p class="text-text-primary">Primary text</p>
  <p class="text-text-secondary">Secondary text</p>
</div>
```

---

## Quick Reference

### Common Patterns

| Use Case | Classes/Variables |
|----------|------------------|
| Card wrapper | `.card_app_wrapper` |
| Primary button | `.button` or `.ms-button` |
| Secondary button | `.button.is-secondary` |
| Success text | `.text-color-green` |
| Error text | `.text-color-red` |
| Page background | `var(--background-grey)` |
| Card background | `var(--base-color-neutral--white)` |
| Primary border | `var(--border-color--border-primary)` |
| Primary text | `var(--text-color--text-primary)` |
| Muted text | `var(--text-color--text-secondary)` |

### File Import Order

```css
/* In your main entry point (main.jsx or index.jsx) */
import './css/normalize.css';      /* 1st: Reset */
import './css/webflow.css';        /* 2nd: Framework */
import './css/tradeguard-ai.webflow.css';  /* 3rd: Custom components */
import './index.css';              /* 4th: App overrides */
```

---

*This design system documentation is auto-generated from CSS analysis. Last updated: February 2026*
