# LoginScreen Specification

## Overview
- Target file: `src/components/LoginScreen.tsx`
- Screenshots: `docs/design-references/login-desktop.png`, `login-mobile.png`
- Interaction model: form input + click submit

## DOM Structure
`main` centers a bordered card. Card header contains orange login icon, title, and subtitle. Body contains email/password fields and remember checkbox. Footer contains submit and registration copy.

## Computed Styles
- Canvas: `#f6f8fa`, min-height 100vh, padding 16px, Inter.
- Card: 446px desktop, `calc(100vw - 32px)` mobile, white, 1px `#d0d7de`, radius 6px.
- Header: two-column, 16px padding, minimum 112px, bottom border.
- Title: 20px/24px, 700. Subtitle: 15px/21.75px, muted.
- Labels: 11px/11px, 600, uppercase visual treatment, margin-bottom 8px.
- Inputs: 32px high, `#eaedf2` inset surface, 1px border, radius 6px, 13px text, horizontal padding 12px plus 36px icon inset.
- Primary button: 32px high, orange `#ea580c`, white 13px/500, radius 6px, horizontal padding 16px.

## States & Behaviors
- Disabled submit: opacity .5.
- Focus: orange 1px ring, 150ms transition.
- Submit: route by mock role; never persist the entered password.

## Text Content
`З поверненням`, `Увійдіть для доступу до каталогу запчастин BRP`, `Електронна пошта`, `Пароль`, `Запам'ятати на 30 днів`, `Увійти`, `Немає акаунту?`, `Зареєструватися`.

## Responsive
- Desktop: 446px card centered.
- Mobile: full available width with the same compact field sizes.
