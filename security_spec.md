# Security Specification & Threat Model: MenuQR

## 1. Data Invariants
1. **Public Readability for Diners**: Any diner who scans a restaurant's QR code must be able to retrieve the restaurant menu (`/restaurants/{slug}`) and its ratings (`/restaurants/{slug}/ratings/{ratingId}`) without being authenticated (`allow get: if true;`).
2. **Owner Isolation (Multi-Tenancy)**: Only the verified owner of a restaurant (`request.auth.uid == resource.data.ownerUid`) may update or delete their restaurant record.
3. **No Impersonation on Creation**: When creating a restaurant, `request.resource.data.ownerUid` must match `request.auth.uid`. No user can create a restaurant on behalf of another user.
4. **Immutable Ownership and Slug**: Once created, `ownerUid` and `slug` cannot be changed during an update (`incoming().ownerUid == existing().ownerUid && incoming().slug == existing().slug`).
5. **Secure Queries**: Unauthenticated users or non-owners cannot list all restaurants (`allow list: if isSignedIn() && resource.data.ownerUid == request.auth.uid;`).
6. **Rating Integrity**: Ratings must belong to an existing restaurant (`exists(/databases/$(database)/documents/restaurants/$(slug))`), have a valid score between 1 and 5, and string fields within safe length boundaries.
7. **Document ID Hardening**: Document IDs and path variables must adhere to `isValidId()` to prevent injection attacks.

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Payload 1: Unauthenticated Restaurant Creation**
   - Attempt: `POST /restaurants/bistro-hacker` without auth credentials.
   - Target: Reject with PERMISSION_DENIED.

2. **Payload 2: Identity Spoofing on Create**
   - Attempt: Authenticated User A (`uid_alice`) submits `ownerUid: 'uid_bob'`.
   - Target: Reject with PERMISSION_DENIED.

3. **Payload 3: Tampering / Hijacking Existing Restaurant**
   - Attempt: Authenticated User A (`uid_alice`) attempts `UPDATE /restaurants/bobs-grill` owned by `uid_bob`.
   - Target: Reject with PERMISSION_DENIED.

4. **Payload 4: Ownership Transfer Attack**
   - Attempt: Bob tries to update `bobs-grill` changing `ownerUid` to someone else.
   - Target: Reject with PERMISSION_DENIED.

5. **Payload 5: Slug Mutation Attack**
   - Attempt: Bob tries to update `bobs-grill` changing `slug` to `alices-bistro`.
   - Target: Reject with PERMISSION_DENIED.

6. **Payload 6: Unauthorized Deletion**
   - Attempt: User A attempts `DELETE /restaurants/bobs-grill`.
   - Target: Reject with PERMISSION_DENIED.

7. **Payload 7: Unrestricted List Query Scraping**
   - Attempt: Unauthenticated user or malicious user queries `collection('restaurants')` without filtering by their own `ownerUid`.
   - Target: Reject with PERMISSION_DENIED.

8. **Payload 8: Path Injection / ID Poisoning Attack**
   - Attempt: Write with document ID containing path traversal `../` or excessive size (1000+ chars).
   - Target: Reject with PERMISSION_DENIED.

9. **Payload 9: Rating Score Out of Range Attack**
   - Attempt: Submit rating with `stars: 99` or `stars: -5`.
   - Target: Reject with PERMISSION_DENIED.

10. **Payload 10: Orphaned Rating Write**
    - Attempt: Submit a rating for a non-existent restaurant `/restaurants/fake-nonexistent-xyz/ratings/123`.
    - Target: Reject with PERMISSION_DENIED.

11. **Payload 11: Oversized Payload / Denial of Wallet**
    - Attempt: Create a restaurant with 10,000 items or 50MB description string.
    - Target: Reject with PERMISSION_DENIED.

12. **Payload 12: Rating Tampering by Other User**
    - Attempt: User A attempts to update or delete a rating created by User B.
    - Target: Reject with PERMISSION_DENIED.

---

## 3. Test Runner Specification
The suite verifies that all 12 negative test cases are blocked by rules while legitimate flows (public diners reading menu, owner updating their own menu, diner submitting a 1-5 star review) succeed.
