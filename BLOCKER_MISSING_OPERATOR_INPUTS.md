# BLOCKER: Missing required operator inputs

**Assigned to:** Operator / Backend Owner
**Status:** BLOCKED

## Description
Per the Master Execution Instructions (Section 4), the following items are strictly required before any frontend code can be written or any PR created. NONE of them have been provided.

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

## Impact
**API-dependent implementation is blocked. Infrastructure setup continues.**

Work on **Phase 0 - Environment & Baseline Setup** (Skeleton, CI, README) will proceed. Only API integration and contract verification steps are paused.

## Resolution Required
The Operator must provide these values immediately. Once provided, the frontend team will verify connectivity and contract compliance before resuming Step A (Environment Verification).
