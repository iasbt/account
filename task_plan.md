# Task Plan: Account System Phase 3 Implementation
<!-- 
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.
-->

## Goal
<!-- 
  WHAT: One clear sentence describing what you're trying to achieve.
  WHY: This is your north star. Re-reading this keeps you focused on the end state.
-->
Complete Phase 3 of the Account System roadmap, focusing on Gallery SSO Integration, Dashboard improvements, and future app readiness.

## Current Phase
<!-- 
  WHAT: Which phase you're currently working on (e.g., "Phase 1", "Phase 3").
  WHY: Quick reference for where you are in the task. Update this as you progress.
-->
Phase 3

## Phases
<!-- 
  WHAT: Break your task into 3-7 logical phases. Each phase should be completable.
  WHY: Breaking work into phases prevents overwhelm and makes progress visible.
  WHEN: Update status after completing each phase: pending → in_progress → complete
-->

### Phase 1: Admin Backend & Portal Completion
<!-- 
  WHAT: Finalize the Admin Panel and backend support.
  WHY: Critical for managing users and apps.
-->
- [x] Basic Infrastructure: Role Middleware & Admin Routes
- [x] User Management: User List Query
- [x] Frontend Entry: AdminPanel Prototype
- [x] Admin Features: User Edit/Delete (Verified via DB check)
- [x] Admin Features: App Management (Register/Edit/Delete Apps/Rotate Secret - Verified via scripts)
- [x] Verify Admin Portal E2E (Verified backend logic and frontend integration)
- **Status:** complete

### Phase 2: Album Integration (Cloudflare R2)
<!-- 
  WHAT: Integrate Cloudflare R2 for photo storage.
  WHY: Essential for the "Album" feature in the ecosystem.
-->
- [ ] Verify Cloudflare R2 Access/Credentials
- [ ] Implement Image Upload API (with resizing/optimization)
- [ ] Implement Image Retrieval/Serving
- [ ] Frontend Integration for Album
- **Status:** pending (HOLD per user request)

### Phase 3: SSO Extension & Ecosystem
<!-- 
  WHAT: Extend SSO to other apps (Gallery, Toolbox, Life OS).
  WHY: Enable seamless login across the ecosystem.
-->
- [x] Fix Account Dashboard (Stats & Apps Launchpad)
- [x] Create Final Account-Gallery SSO Integration Guide (v1.1 Corrected)
- [ ] Verify Cross-Domain Auth (Gallery Integration)
- [ ] Implement SSO for Toolbox (Future)
- [ ] Implement SSO for Life OS (Future)
- **Status:** in_progress

### Phase 4: Technical Debt & Documentation
<!-- 
  WHAT: Improve code quality and observability.
  WHY: Long-term stability and maintainability.
-->
- [x] Increase Test Coverage (Unit tests for Token/Helpers/AuthService)
- [x] Complete API Swagger/OpenAPI Documentation (docs/openapi.yaml)
- [x] Integrate APM & Log Aggregation (Winston + Prometheus)
- **Status:** complete

### Phase 5: Delivery & Deployment
<!-- 
  WHAT: Final review and deployment.
  WHY: Ensure production readiness.
-->
- [x] Full Regression Test (21/21 Unit Tests Passed)
- [x] Deploy to Production (Release v1.8.6)
- [x] Verify Production Health (Confirmed via /api/health)
- **Status:** complete

## Key Questions
<!-- 
  WHAT: Important questions you need to answer during the task.
  WHY: These guide your research and decision-making. Answer them as you go.
-->
1. Is the Cloudflare R2 configuration already present in .env?
2. What specific optimization library should we use for images (sharp)?

## Decisions Made
<!-- 
  WHAT: Technical and design decisions you've made, with the reasoning behind them.
  WHY: You'll forget why you made choices. This table helps you remember and justify decisions.
-->
| Decision | Rationale |
|----------|-----------|
| Use `sharp` for images | Standard Node.js library for high-performance image processing. |
| Account-First SSO | Supabase backend deprecated; Account System becomes sole IdP and Key Source. |
| Dashboard Apps Source | Fetch active apps from DB + local metadata enrichment. |
