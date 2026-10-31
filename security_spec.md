# Firebase Security Specification & TDD Suite

## 1. Data Invariants
1. **Default-Deny Catch-All**: All unlisted paths reject all reads and writes unconditionally.
2. **Identity Integrity**: User profile `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId` or an authenticated administrator.
3. **No Blanket Reads**: Question and quiz queries require authenticated users with valid identity, and updates must validate schema integrity.
4. **Questions Authority**: Only verified teachers and admins can create, update, or approve questions. Questions cannot be created with falsified author IDs.
5. **Validation Blueprint**: Standalone `isValidQuestion`, `isValidUser`, `isValidQuiz` helper functions enforce property bounds, required fields, and non-empty strings.
6. **Path Variable Hardening**: Document IDs must pass `isValidId()` (size <= 128, matching alphanumeric + hyphen/underscore).
7. **Connection Test**: Public read for `/test/connection` to enable client offline/online bootstrap probes without exposing sensitive data.

## 2. The "Dirty Dozen" Payloads (Must be REJECTED with PERMISSION_DENIED)
1. **Unauthenticated Read on Users**: Anonymous user attempts `get` on `/users/admin-01`.
2. **User Profile Impersonation**: User A (`auth.uid = "user-a"`) attempts `set` on `/users/user-b`.
3. **Ghost Field Injection (Shadow Update)**: User attempts to write an extra unauthorized property `isAdmin: true` into `/users/{uid}`.
4. **Oversized String Injection (Denial of Wallet)**: Attacker attempts to send a 2MB string in question `content`.
5. **Path ID Poisoning**: Attacker attempts document ID containing path traversal `../evil/doc` or characters exceeding 128 bytes.
6. **Forged Question Author**: Teacher B creates a question with `author_id: "teacher-a"`.
7. **Invalid Question Type Enum**: Attacker attempts to submit question with `question_type: "arbitrary_script_injection"`.
8. **Negative Points Injection**: Attacker sets `points: -100` on a question to corrupt quiz grading.
9. **Unauthorized Question Approval**: Non-teacher/unverified user attempts to switch question status from `pending_review` to `approved`.
10. **State Corruption on Quiz**: Attacker updates closed quiz with invalid negative duration or tampered status.
11. **Blanket Query Scraping**: Unauthenticated client attempts collection query on `/questions`.
12. **Tampering with Immutable Timestamps**: Client tries to mutate `createdAt` to a historical or future timestamp.

## 3. Test Runner Specification
The test file `firestore.rules.test.ts` validates that each of these 12 malicious vectors receives `PERMISSION_DENIED`.
