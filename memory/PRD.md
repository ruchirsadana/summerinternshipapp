# TH Field Intelligence — Product Requirements Document

## Product
A mobile-first retail intern intelligence platform for Tommy Hilfiger store floor research. Captures consumer surveys, customer database, competitive visits, personal KPIs, dead-hour patterns, B2B leads, AI-generated insights, and a 12-week internship timeline — all offline-first.

## Stack
- **Frontend**: Expo 54 / React Native / Expo Router (file-based routing), AsyncStorage (100% offline), react-native-svg, @react-native-community/slider, expo-sharing, expo-file-system, expo-clipboard.
- **Backend**: FastAPI + Claude Sonnet 4.5 via Emergent Universal Key (single endpoint `/api/ai/insights`).
- **Brand**: Navy `#1B2A4A` · Red `#C8102E` · White · Gold accents.

## Architecture
- 4-tab bottom nav: **Home · Analytics · Customers · More**. 16 screens nested inside Stack navigator with home button for in-survey exit.
- All 11 original + 5 expansion screens implemented. Data lives in device-local AsyncStorage keyed by entity.

## 16 Screens
1. **Home** — hero, stat cards, target progress, 12 quick-access tiles
2. **New Survey** — 5-section stepper (17 questions from `TH Customer Survey 2.docx` verbatim), NPS slider with color coding, star ratings, dirty-state exit confirm
3. **Analytics** — NPS gauge, promoter/passive/detractor donut, attribute bar chart, age distribution, spend bracket, top visit reasons, discovery channels, repeat split
4. **Responses List** — searchable, filterable by age group + NPS band
5. **Response Detail** — 5-section card layout, word associations as tags
6. **Competitive Tracker** — star-rated VM/Staff/Range, footfall + price point, scorecard per store
7. **Performance** — Bills/Units/ASP/ATV/UPT entry, ATV line chart, personal best day
8. **Export** — CSV via native share sheet / copy / web download + auto weekly report
9. **Customer Database (Tiered)** — **Platinum** (₹85K+ & 3+ visits) · **Gold** (₹25K+) · **Silver** (₹10K+) · **Bronze** (new). Visit logger with spend input. Birthday-this-month filter.
10. **Dead Hour Tracker** — 10am-10pm hourly logs with conversion heatmap
11. **AI Insights Feed** — Claude-powered cards (tones: positive/negative/opportunity/neutral)
12. **Brand Health** — Week-on-week delta arrows for NPS, perception, unaided recall, repeat rate + NPS trend line chart
13. **Occasion Mapper** — purchase reason → category → spend pattern view
14. **Field Notes** — captain's log (observation / idea / anomaly)
15. **Presentation Mode** — read-only one-page snapshot for store manager reviews
16. **B2B Pipeline** — lead tracker with ₹ pipeline value (tap to advance stage)
17. **Project Timeline** — 12-week milestones with completion toggles + elapsed %
18. **Settings** — intern name, store, survey target, internship start date

## Key design decisions
- Offline-first — no login, no cloud sync (single-user internship use case)
- AI insights are opt-in (manual trigger) to control LLM spend
- Tier thresholds customisable via code (currently ₹10K/₹25K/₹85K+3v)
- All interactive elements have `testID`

## Wow moment / revenue angle
The **B2B Pipeline Tracker** surfaces total open pipeline in ₹ — the single screen an ASM opens when asking "what business impact did you create?" This is the screen that converts a survey internship into a career conversation.
