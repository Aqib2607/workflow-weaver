
# 🔥 AI Integration Guidance for FlowBuilder (Workflow Weaver)

**Goal:** Add AI-powered workflow generation: chat interface, OpenAI API integration (or similar), parser for NL-to-node conversion, generate workflow visually — all with zero-cost constraints.

---

## ✅ Phase 1: Research & Planning

- [ ] Review AI workflow requirements image
- [ ] Audit existing frontend/backend structure
- [ ] List compatible student/free-tier AI APIs and services (OpenAI, Azure, Hugging Face, Cohere, Anthropic, etc.)
- [ ] Register for required student memberships (GitHub Student Pack, Google Cloud, Azure, etc.)
- [ ] Confirm eligibility for free API keys and premium trials

## ✅ Phase 2: Setup Free API Access

- [ ] Acquire a free (or student) API key for OpenAI or a similar service
- [ ] Document/track API limits and trial periods
- [ ] Add .env variables for API keys securely (avoid hardcoding)

## ✅ Phase 3: AI Chat Interface (Frontend)

- [ ] Choose chat library/component (React, shadcn/ui or similar)
- [ ] Create a new Chat component (`src/components/ChatAI.tsx`)
- [ ] Design minimal chat UI for prompt/input and displaying AI response
- [ ] Connect chat API endpoint to Laravel backend
- [ ] Handle error/limit feedback for users (show remaining tokens, trial info, etc.)

## ✅ Phase 4: Backend API Integration (Laravel)

- [ ] Set up Laravel HTTP client for AI APIs
- [ ] Add backend API route `/api/ai/chat` that proxies frontend chat requests to the AI provider (OpenAI/Hugging Face/etc)
- [ ] Implement basic authentication for the AI chat route
- [ ] Safely use API keys from .env
- [ ] Handle edge cases: rate limits, quota errors, failed responses

## ✅ Phase 5: Natural Language-to-Node Parser

- [ ] Research or prototype parsing strategies (regex, trees, LLMs)
- [ ] Implement JS/TS parser in frontend to take AI output and map to node structure (`src/lib/parser.ts`)
- [ ] Validate parser output with sample prompts ("Create workflow to tweet on Mondays")
- [ ] Provide UI to review/fix auto-generated nodes/workflows

## ✅ Phase 6: Visual Workflow Auto-Generation

- [ ] Connect parser result to workflow canvas/components
- [ ] Add feature to auto-generate workflow from parsed data
- [ ] Show preview and allow edits before saving workflow
- [ ] Save generated workflow using backend API

## ✅ Phase 7: Documentation and Testing

- [ ] Write and update README with all new AI features
- [ ] Document free API acquisition process for future students
- [ ] Add unit/integration tests for AI endpoints and parser
- [ ] Document sample prompts and usage scenarios

---

# 💡 Notes, Tips, and Free AI Credits

- Use GitHub Student Pack for free Github Copilot access and possible API perks.
- Many providers (OpenAI, Azure, Google, HuggingFace) offer $15-$300 credits for student mail — confirm trial expiry and usage rules.
- Consider Hugging Face Inference API (some free models, lower cost, easy switch from OpenAI endpoint).
- Always monitor usage/quota and inform users when nearing limits.

---

_Last updated: 2025-11-14_
