export const pages: Record<
  string,
  {
    title: string;
    intro: string;
    sections: [string, string][];
    legal?: boolean;
  }
> = {
  about: {
    title: "Made for your Minecraft world.",
    intro:
      "ConnectX brings Minecraft players and communities together. Connect. Create. Play.",
    sections: [
      [
        "One shared world",
        "Builders, PvP players, server owners, creators, mod developers, and curious newcomers all have a place here. Share your work, discover communities, and find your next server.",
      ],
      [
        "Independent by design",
        "ConnectX is an independent community platform. It is not affiliated with, endorsed by, or operated by Mojang or Microsoft.",
      ],
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    legal: true,
    intro:
      "Draft template for the ConnectX operator. Professional legal review and operator details are required before production use.",
    sections: [
      [
        "Eligibility",
        "The registration flow requires confirmation that you are at least 13. The operator must review regional age requirements and any additional consent requirements before launch.",
      ],
      [
        "Account responsibilities",
        "Keep your credentials secure and provide accurate registration information. Do not share accounts to evade restrictions or impersonate another person.",
      ],
      [
        "User content",
        "You retain your rights in your content. A reviewed license must define how ConnectX may host, display, and distribute content to provide the service. Do not post content you lack permission to share.",
      ],
      [
        "Prohibited activity",
        "Do not harass, threaten, dox, scam, distribute malware, exploit children, post unlawful sexual content, or manipulate the service through spam. Follow the Community Guidelines and local community rules.",
      ],
      [
        "Moderation and suspension",
        "Authorized staff may review reports, remove content, restrict accounts, and suspend communities. Moderation actions are logged. Submit an appeal through Contact.",
      ],
      [
        "Intellectual property and copyright",
        "Respect trademarks, copyrights, and other rights. Submit copyright complaints using the Copyright contact category. The operator must add its legally required notice and counter-notice procedures.",
      ],
      [
        "Availability and liability",
        "Service interruptions may occur. The operator must obtain legal review of warranties, liability limitations, dispute resolution, governing law, and mandatory consumer rights before publishing binding terms.",
      ],
      [
        "Changes and contact",
        "The operator must define how users receive material updates. Contact support through the Contact page. Operator legal name, address, effective date, and jurisdiction: to be supplied before launch.",
      ],
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    legal: true,
    intro:
      "Draft template reflecting this implementation. Complete the operator and processor details and obtain professional legal review before production use.",
    sections: [
      [
        "Account and profile information",
        "Supabase Auth processes email addresses, credentials, and sessions. ConnectX stores a username, display name, optional profile details, Minecraft identity fields, preferences, and registration metadata. Minecraft passwords are never requested.",
      ],
      [
        "Content and interactions",
        "The service stores posts, media, messages, follows, community memberships, reactions, reports, and support tickets. Public content is visible according to account and community privacy settings. Staff verification notes are not public.",
      ],
      [
        "Technical information and cookies",
        "Authentication stores session tokens in your browser's local storage. A theme preference may also be stored on your device. GitHub Pages and Supabase may process request logs and technical information. This codebase does not add an analytics SDK or advertising tracker. Google Fonts requests may disclose IP address and browser information; self-host fonts if this is not acceptable for your deployment.",
      ],
      [
        "Messages and security",
        "Messages are restricted to conversation participants using database policies. They are not end-to-end encrypted. The platform operator and its database infrastructure can access stored data. Reports and staff workflows require careful access management.",
      ],
      [
        "Retention and deletion",
        "Account deletion removes the account, profile, authored posts, conversations, messages, and uploaded files in the active service. Communities must be transferred first. Audit records retain action and reason while the actor reference is removed. The operator must define backup expiry and legally required retention; immediate removal from backups is not claimed.",
      ],
      [
        "Data requests",
        "Signed-in users can export core account data in Settings. Use the Privacy contact category for access, correction, or deletion questions. The operator must review applicable statutory rights and response periods.",
      ],
      [
        "Processors and transfers",
        "Supabase provides authentication, database, realtime, and storage services. The selected hosting provider processes web requests. The operator must list actual providers, locations, agreements, and international transfer safeguards before launch.",
      ],
      [
        "Children and contact",
        "Registration requires an age confirmation. Do not create an account if you are under 13. The operator must review applicable child privacy obligations and regional age limits. Privacy controller name, contact address, and effective date: to be supplied before launch.",
      ],
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    legal: true,
    intro:
      "Draft template. Review against the cookies and third-party services used in your deployed environment.",
    sections: [
      [
        "Essential authentication",
        "This static version stores Supabase authentication session tokens in browser local storage to maintain and refresh your signed-in session. This storage is needed for account features. Third-party services may have their own cookie practices.",
      ],
      [
        "Preferences",
        "ConnectX stores a local theme preference. You can clear browser storage to remove it, which may also sign you out.",
      ],
      [
        "Analytics and advertising",
        "No analytics SDK or advertising tracker is included in this implementation. Hosting infrastructure and any future integrations must be reviewed separately.",
      ],
    ],
  },
  "community-guidelines": {
    title: "Build something good together.",
    intro:
      "These guidelines apply to posts, profiles, communities, and private conversations.",
    sections: [
      [
        "Respect the player",
        "No harassment, hate, threats, or sharing personal information without consent. Debate ideas without attacking people.",
      ],
      [
        "Keep it safe",
        "No scams, malicious downloads, credential theft, sexual exploitation, NSFW content, or unlawful content. Never ask for someone’s Minecraft or Microsoft password.",
      ],
      [
        "Be yourself",
        "No impersonation or misleading verification claims. Self-declared Minecraft identities do not prove account ownership.",
      ],
      [
        "Give credit",
        "Share work you have rights to share and credit creators. Community rules can add expectations beyond these platform guidelines.",
      ],
      [
        "Report and appeal",
        "Use the report action on a post, account, community, or message. Use Contact to appeal moderation. Avoid submitting abusive or knowingly false reports.",
      ],
    ],
  },
  safety: {
    title: "Your space. Your boundaries.",
    intro: "Tools to help you decide who you connect with and what you see.",
    sections: [
      [
        "Report a concern",
        "Use the options on posts, profiles, communities, and messages to send a report. Reports enter the moderation queue; urgent real-world danger should be handled through appropriate local emergency channels.",
      ],
      [
        "Block and mute",
        "Blocking removes follows in both directions and prevents new direct messages. Muting filters accounts, words, and hashtags from your feed.",
      ],
      [
        "Privacy controls",
        "Choose a private account, control who can send messages or mention notifications, and manage the visibility of likes and memberships in Settings.",
      ],
      [
        "Community moderation",
        "Community owners appoint moderators with scoped permissions. Membership changes and content moderation are logged. Only ConnectX administrators assign official verification.",
      ],
      [
        "Account security",
        "Use a strong unique password. Sign out other devices through Account settings if needed. Verified Microsoft/Minecraft account ownership is not available yet.",
      ],
    ],
  },
  developers: {
    title: "Build with ConnectX.",
    intro:
      "A public developer API is planned. No public API keys or third-party developer endpoints are issued by this release.",
    sections: [
      [
        "Future possibilities",
        "Potential integrations include public profiles, public posts, communities, and Minecraft server information. Any future API must honor account privacy and community permissions.",
      ],
      [
        "Current application access",
        "The internal application API is for ConnectX itself. It is authenticated, rate-limited, and not a stable third-party contract. Do not embed server secrets in client applications.",
      ],
      [
        "Get in touch",
        "Use the Business contact category to discuss an integration.",
      ],
    ],
  },
  "help-center": {
    title: "A little help along the way.",
    intro: "Search common questions about your corner of Minecraft.",
    sections: [
      [
        "How do I create an account?",
        "Choose Create account, enter a unique username, and confirm your email. Check spam folders if your verification email does not arrive.",
      ],
      [
        "How do I connect Minecraft?",
        "Open Settings → Edit profile and add your Minecraft username, favorite version, server, and playstyle. This is a self-declared identity; verified ownership is not yet enabled.",
      ],
      [
        "How do communities work?",
        "Public communities allow immediate joins. Private and request-to-join communities require approval. Owners must transfer ownership before leaving or deleting their account.",
      ],
      [
        "Who can message me?",
        "Settings → Privacy offers Everyone, People I follow, or Nobody. Blocks prevent messages in both directions.",
      ],
      [
        "How do I get verified?",
        "Official verification is assigned only by ConnectX administrators. Contact the team using the Verification category. Never give someone your password to get a badge.",
      ],
      [
        "How do I report or appeal?",
        "Report actions are available on posts, profiles, communities, and messages. For an appeal, send an Account Support or Safety ticket with relevant details.",
      ],
      [
        "How do I delete my data?",
        "Settings → Account management offers a JSON export, deactivation, and permanent deletion. Transfer community ownership before deleting.",
      ],
      [
        "Why can’t I post or sign in?",
        "Check the Status page and retry. Accounts require an active status; rate limits may temporarily slow repeated actions. Contact support if the issue continues.",
      ],
    ],
  },
  "403": {
    title: "403 · This area is restricted.",
    intro: "Your account does not have access to this page.",
    sections: [],
  },
  "500": {
    title: "We hit an unexpected block.",
    intro: "Please retry in a moment. Your changes may not have been saved.",
    sections: [],
  },
  suspended: {
    title: "Account access is restricted.",
    intro:
      "This account is suspended or unavailable. Contact support to ask about an appeal.",
    sections: [],
  },
  "suspended-community": {
    title: "Community unavailable.",
    intro:
      "This community is suspended or no longer available. Contact support for help.",
    sections: [],
  },
  maintenance: {
    title: "A little world maintenance.",
    intro:
      "ConnectX is being updated. Please check the Status page for current service information.",
    sections: [],
  },
};
