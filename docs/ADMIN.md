# Initial owner setup

1. Register through ConnectX and verify the email address. Sign in once and confirm the intended account in Supabase Authentication → Users.
2. Copy the account's immutable Auth UUID. Do not identify the owner only by a public username, profile field, or user metadata claim.
3. With a trusted database administrator connection, run `scripts/bootstrap-owner.sql` through psql:

```sh
psql "$DATABASE_URL" -v owner_id="THE_VERIFIED_AUTH_UUID" -f scripts/bootstrap-owner.sql
```

The script locks role changes, checks the account exists and has verified email, refuses to run if an owner already exists, promotes only the supplied UUID, and records an audit entry in one transaction. It is not an API endpoint. Do not put the database URL in source control or command logs shared with others.

Alternatively, use the SQL editor to execute the script body after replacing the psql variable setup with `select set_config('cx.bootstrap_owner_id','THE_VERIFIED_AUTH_UUID',true);` inside the transaction. Remove the psql `\set` line. Review the UUID before execution.

4. Refresh ConnectX and open `/#/admin`. The navigation reveals Admin only after loading the database role, but the database and authenticated Edge Functions are the actual security boundary.
5. The owner can assign user/moderator/admin roles through the Users panel. There is no frontend operation that grants the owner role. Ordinary admins cannot change other admins or the owner.

## Operational roles

- `user`: normal account.
- `moderator`: reserved platform staff designation; community authority is granted explicitly by a community role and permissions. It does not automatically expose the administrator dashboard.
- `admin`: platform moderation, verification, reports, support, configuration.
- `owner`: admin capabilities plus assignment of non-owner platform roles.

Community moderators have independent permissions: `manage_members`, `delete_posts`, `edit_community`, `view_reports`, and `view_logs`. Owners and community administrators have all community capabilities. Only the community owner can assign staff or transfer ownership; moderators cannot promote themselves. Banning or muting a member prevents community posting. Transfers require an active existing member.

## Verification

Use Users or Communities in `/#/admin`. Choose verified/unverified, category, and internal notes. Notes are readable only by active administrators. Each change writes a verification record and audit entry. Minecraft identity ownership remains separate from official platform verification.

## Recovery and owner transfer

Never change roles based on a support message alone. Independently authenticate the requester. A trusted DB operator can transfer the platform owner role in a reviewed transaction: lock `cx_roles`, verify both Auth UUIDs and the recipient's email, promote the recipient, demote the former owner, and add a `cx_audit` record. Keep at least one active owner.

Suspended/deactivated users can create support tickets while signed in. Reactivation is an administrator status change. If account deletion fails after deactivation, inspect Storage availability, finish storage cleanup, remove owned server records, revoke sessions, and retry Auth deletion using server/admin credentials. Do not reactivate a partially deleted account without checking data consistency.
