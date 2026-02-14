# BLOCKER: Missing required operator inputs

**Assigned to:** Operator / Backend Owner
**Status:** BLOCKED (API Dependent Tasks)

## Description
Per the Master Execution Instructions (Section 4), the following items are strictly required before any **API-dependent frontend implementation can begin. Bootstrap PR creation is allowed.**

## Missing Items
The following environment variables and documentation are missing:

1.  **API_BASE_URL (staging URL)**
2.  **TEST_USER_EMAIL**
3.  **TEST_USER_PASSWORD**
4.  **OpenAPI/Swagger JSON/YAML** or **Postman Collection** covering all required endpoints:
    *   `/auth/login`
    *   `/auth/signup`
    *   `/auth/refresh`
    *   `/auth/logout`
    *   `/business` (+ sub-resources)
    *   `/chat/message`
    *   `/decisions/validate`

## Allowed Work (NOT BLOCKED)
- Repository bootstrap
- .env.example creation
- package.json scripts
- CI workflow stub
- App shell setup
- Local environment verification

## Blocked Work
- Login/Signup UI
- Business Setup UI
- Chat Interface
- Decision Validator Modal
- Any API client or endpoint integration

## Affected Phases
- Phase 0: PARTIAL (Bootstrap allowed)
- Phase 1–4: FULLY BLOCKED

## Enforcement Rules
- No UI components may be committed.
- No API calls may be implemented.
- No endpoint assumptions allowed.

## Operator Delivery Format
Provide:
- API_BASE_URL
- TEST_USER_EMAIL
- TEST_USER_PASSWORD
- OpenAPI file placed at `/docs/api-openapi.yaml`

## Audit Metadata
**Created By:** Antigravity Agent
**Date:** 2026-02-14
**Related Phase:** Phase 0

## Escalation Policy
If inputs are not provided within 24h, escalate to CTO review.
