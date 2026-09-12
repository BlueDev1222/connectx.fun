# Minecraft identity integration

The default profile associates a self-declared Minecraft username with a ConnectX account. It does not establish account ownership. Official ConnectX verification and `identity_verified` are separate concepts; the lookup adapter always sets `identity_verified` to false.

To enable skin/UUID lookup, configure, in Supabase Edge Function secrets, a trusted HTTPS `MINECRAFT_LOOKUP_URL` and optional `MINECRAFT_LOOKUP_TOKEN`. The application appends a validated `username` query parameter. The response contract is:

```json
{"username":"ExamplePlayer","uuid":"32 hexadecimal characters","skinUrl":"https://textures.minecraft.net/texture/…","capeUrl":null}
```

The adapter rejects redirects, invalid UUIDs, mismatched usernames, and nonofficial texture hosts. The server persists identity fields using its server-only credential after authentication. The settings interface lets the player request a lookup after saving their username. Without a provider, the interface gives a clear configuration message; no fake skin or verified identity is created.

A future verified ownership flow must use an audited Microsoft/Xbox/Minecraft OAuth exchange with state, PKCE, server-only tokens, issuer/audience validation, and an ownership proof tied to the current ConnectX account. The client ID/secret placeholders are reserved for that future integration. Never accept a browser-supplied verification flag, raw Microsoft password, or Minecraft password.
