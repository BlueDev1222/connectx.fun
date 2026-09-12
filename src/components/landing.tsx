import Link from "@/lib/link";
import {
  ArrowUpRight,
  Blocks,
  ShieldCheck,
  Users,
  Compass,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="ConnectX home">
          <img src="/connectx-logo.webp" alt="" width="42" height="42" style={{borderRadius:10,marginRight:10,objectFit:"cover"}} />
          Connect<span className="lime">X</span>
        </Link>
        <nav>
          <Link href="/explore">Explore</Link>
          <Link href="/communities">Communities</Link>
          <Link href="/servers">Servers</Link>
        </nav>
        <Link className="button secondary" href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="tiny-block" /> YOUR WORLD. YOUR PEOPLE.
          </div>
          <h1>
            Made of blocks.
            <br />
            Built on <span>connection.</span>
          </h1>
          <p>
            The social network built for Minecraft. Share what you’re making,
            find your people, and discover where to play next.
          </p>
          <div className="button-row">
            <Link className="button" href="/register">
              Create your account <ArrowUpRight size={18} />
            </Link>
            <Link className="button secondary" href="/explore">
              Explore ConnectX
            </Link>
          </div>
          <div className="hero-note">
            For the builders, the redstoners, and the “one more block” crowd.
          </div>
          <div className="hero-feed">
            <div className="mini-label">
              <Blocks size={18} /> AROUND THE BLOCK{" "}
              <span>Community preview</span>
            </div>
            <article>
              <span className="avatar violet">S</span>
              <div>
                <b>
                  Spruce & Stone <ShieldCheck size={16} className="lime" />
                </b>
                <small>@spruceandstone · Builder</small>
                <p>
                  After 40 hours, the survival base finally feels like home.
                  Anyone else spend more time on the roof than the rest of the
                  build?
                </p>
                <Link href="/explore?q=Builders" className="lime">
                  #Builders #Survival
                </Link>
              </div>
            </article>
            <img
              className="landing-build"
              src="/community-build.png"
              alt="Illustrated voxel survival house on a lush floating island with a waterfall"
              width="1536"
              height="1024"
            />
            <div className="feed-foot">
              <span>Every build has a story.</span>
              <Link href="/explore">
                Find yours <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        <section className="landing-section">
          <div className="eyebrow">A PLACE TO BELONG</div>
          <h2>
            Your next connection
            <br />
            starts here.
          </h2>
          <div className="feature-grid">
            {[
              [
                Blocks,
                "Share the process",
                "First dirt hut or a thousand-hour megabuild. Post images, videos, polls, and updates worth sharing.",
              ],
              [
                Users,
                "Find your community",
                "Public and private spaces for builders, PvP players, mod developers, and every playstyle in between.",
              ],
              [
                Compass,
                "Discover your next world",
                "Explore server profiles, follow creators, and find conversations around the things you love.",
              ],
              [
                Fingerprint,
                "Bring your Minecraft identity",
                "Add your Minecraft username, favorite version, skin, server affiliations, and playstyle to your profile.",
              ],
              [
                MessageCircle,
                "Keep the conversation going",
                "Following, bookmarks, notifications, and private messages keep your people within reach.",
              ],
              [
                ShieldCheck,
                "Play well together",
                "Reporting, blocking, privacy controls, and community moderation help you shape your space.",
              ],
            ].map(([Icon, title, description]) => {
              const I = Icon as typeof Blocks;
              return (
                <article key={String(title)}>
                  <I size={26} />
                  <h3>{String(title)}</h3>
                  <p>{String(description)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="join-banner">
          <div>
            <span className="eyebrow">CONNECT. CREATE. PLAY.</span>
            <h2>There’s room in this world for you.</h2>
          </div>
          <Link href="/register" className="button">
            Join ConnectX <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Link href="/" className="brand" aria-label="ConnectX home">
          <img src="/connectx-logo.webp" alt="" width="38" height="38" style={{borderRadius:9,marginRight:10,objectFit:"cover"}} />
          Connect<span className="lime">X</span>
        </Link>
        <div>
          {[
            "About",
            "Help Center",
            "Safety",
            "Community Guidelines",
            "Terms of Service",
            "Privacy Policy",
            "Cookie Policy",
            "Contact",
            "Status",
            "Developers",
          ].map((x) => (
            <Link key={x} href={"/" + x.toLowerCase().replaceAll(" ", "-")}>
              {x}
            </Link>
          ))}
        </div>
        <small>
          © {new Date().getFullYear()} ConnectX. An independent community. Not
          affiliated with Mojang or Microsoft.
        </small>
      </footer>
    </div>
  );
}
