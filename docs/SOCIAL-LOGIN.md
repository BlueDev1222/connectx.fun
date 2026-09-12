# Enable Apple, Microsoft Azure, and Google

ConnectX uses Supabase Auth and GitHub Pages. Configure each provider in Supabase Authentication → Sign In / Providers. Credentials belong only in Supabase.

All three provider consoles use this callback URL:

`https://onvmeffhmruzshqlwakx.supabase.co/auth/v1/callback`

In Supabase URL Configuration, set Site URL to `https://connectx.fun` and allow `https://connectx.fun/**`. Return URLs are `https://connectx.fun/?flow=apple`, `?flow=azure`, and `?flow=google`.

## Google

1. In Google Cloud / Google Auth Platform, configure the consent screen, audience, and requested basic identity scopes.
2. Create an OAuth client of type Web application. Add JavaScript origin `https://connectx.fun` and the callback URL above as an authorized redirect URI.
3. Enter its Client ID and Client Secret in Supabase's Google provider and enable it.
4. While the Google app is in testing, add your test accounts. Publish the consent app for the intended public audience when ready.

[Official Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Microsoft Azure / Entra ID

The ConnectX button is labelled Microsoft.

1. In Microsoft Entra ID → App registrations, register ConnectX. For a public community, select accounts in any organizational directory and personal Microsoft accounts.
2. Add a Web redirect URI using the callback above.
3. Create a client secret. Copy its secret VALUE, not its secret ID. Enter the Application (client) ID and secret value in Supabase's Azure provider.
4. For the public audience use tenant URL `https://login.microsoftonline.com/common`. A specific tenant URL restricts access to that tenant.
5. Configure the optional ID-token claims `email` and `xms_edov` using the official guide. The app requests the required email scope.
6. Enable the Azure provider and renew its client secret before it expires.

[Official Azure setup and claim configuration](https://supabase.com/docs/guides/auth/social-login/auth-azure).

## Apple

1. Use an Apple Developer account. Register an App ID with Sign in with Apple enabled, then create an associated Services ID for the website.
2. Configure that Services ID's Website URLs with domain `onvmeffhmruzshqlwakx.supabase.co` and the callback above as the return URL.
3. Create a Sign in with Apple signing key and securely retain its .p8 file. Use your Team ID, Key ID, and Services ID to generate an Apple client-secret JWT using the tool in the official guide.
4. In Supabase's Apple provider, enter the Services ID first in Client IDs and the generated secret, then enable it.
5. Rotate the generated OAuth secret before its expiration, at most six months. The signing key is not the client-secret JWT.

Apple's OAuth flow does not supply a full name. ConnectX uses a generated profile name that the user can edit in Settings.

[Official Apple setup and secret generator](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## Verify

For each enabled provider, use ConnectX's login page to sign in with a test account. Confirm a successful return to the feed, refresh persistence, logout, and cancellation handling. Disabled providers display a helpful message. End-to-end login requires valid provider credentials; code tests cannot verify those credentials.

New social accounts receive the normal user role. Names and provider metadata never grant administrator, owner, or verification privileges. Existing account linking remains governed by Supabase Auth.
