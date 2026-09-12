# Enable Discord sign-in

The frontend button is implemented on `https://connectx.fun/#/login` and `/#/register`. Supabase's Discord provider must be enabled with your own Discord application credentials before sign-in works. No bot, bot token, or additional web host is required.

1. Open https://discord.com/developers/applications and create an application named **ConnectX** (or select your existing application).
2. Under **OAuth2 → Redirects**, add this exact Discord callback and save:

   `https://onvmeffhmruzshqlwakx.supabase.co/auth/v1/callback`

3. Copy the application's **Client ID** and **Client Secret**. In Supabase → Authentication → Sign In / Providers → Discord, enable Discord, enter those values, and save. Put the secret only in Supabase; never commit it to GitHub or paste it into website JavaScript. A bot token is not the client secret.
4. In Supabase → Authentication → URL Configuration, use Site URL `https://connectx.fun` and allow `https://connectx.fun/**` (or the exact return URL `https://connectx.fun/?flow=discord`).
5. Visit ConnectX, choose **Continue with Discord**, confirm eligibility/terms, and approve the Discord consent screen. Cancelling returns to sign-in with a retry message. Successful PKCE exchanges persist the Supabase session and open the feed.

The Discord application redirects to Supabase; Supabase then redirects to ConnectX. These are different URLs. The app requests only `identify email`, not access to servers or messages. Existing Auth linking behavior is controlled by Supabase; the application does not merge accounts using a display name.

OAuth profile creation assigns a normal user role. A generated ConnectX username avoids conflicts; users can choose their handle in Settings. Discord authentication does not grant staff privileges, platform verification, or verified Minecraft ownership.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-discord
