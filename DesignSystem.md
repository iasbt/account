# Account System Design System (Apple-Inspired)

> **Philosophy**: Premium, Monochrome, Content-First.
> **Reference**: Apple Official Website (2024).

## 1. Typography (San Francisco / System UI)

We use the system font stack to ensure native rendering on all devices.

| Role | Size (Desktop/Mobile) | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 64px / 40px | Bold (700) | -0.022em | Hero Headers |
| **Title 1** | 48px / 32px | Semibold (600) | -0.015em | Page Titles |
| **Title 2** | 32px / 24px | Medium (500) | -0.010em | Section Headers |
| **Body** | 17px / 16px | Regular (400) | Normal | Main Content |
| **Caption** | 14px / 13px | Regular (400) | Normal | Metadata, Hints |

## 2. Color Palette (Monochrome)

Strict adherence to greyscale with semantic accents.

### Backgrounds
- **Base**: `#f5f5f7` (Light Gray) - Main page background.
- **Surface**: `#ffffff` (Pure White) - Cards, Modals.
- **Contrast**: `#000000` (Pure Black) - Footers, Hero Sections.

### Text
- **Primary**: `#1d1d1f` (Off-Black) - Headlines, Body.
- **Secondary**: `#86868b` (Neutral Gray) - Subtitles, Captions.
- **Tertiary**: `#d2d2d7` (Light Gray) - Placeholders.

### Accents
- **Action Blue**: `#0071e3` (Apple Blue) - Links, Primary Buttons.
- **Destructive**: `#ff3b30` (System Red) - Errors, Delete.
- **Success**: `#34c759` (System Green) - Validations.

## 3. Layout & Spacing

### Grid
- **Container**: Max-width `1280px` (xl).
- **Margins**: `24px` (Mobile), `40px` (Tablet), `80px` (Desktop).
- **Gutter**: `24px` or `32px`.

### Cards
- **Radius**: `20px` (Standard), `30px` (Large).
- **Padding**: `40px` (Standard).
- **Shadow**: `0 4px 6px -1px rgba(0,0,0,0.02)` (Subtle).

## 4. Components

### Buttons
- **Primary**: Pill-shaped (`rounded-full`), `bg-[#0071e3]`, `text-white`.
- **Secondary**: Link-style, `text-[#0071e3]`, `hover:underline`.
- **Tertiary**: Outlined or soft background.

### Inputs
- **Style**: Minimalist, large padding.
- **Border**: `#d2d2d7` (Default), `#0071e3` (Focus).
- **Radius**: `12px`.

## 5. Motion
- **Duration**: `300ms` (Standard).
- **Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1.0)` (Ease-out).
- **Hover**: Scale `1.02` (Subtle lift).
