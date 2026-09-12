export type Row = Record<string, any>;
export type Profile = Row & {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  verified: boolean;
  status: string;
  avatar_path?: string;
  banner_path?: string;
  created_at: string;
};
export type Post = Row & {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
  community?: Row;
};
export const playstyles = [
  "Builder",
  "PvP",
  "Crystal PvP",
  "Survival",
  "SMP",
  "Anarchy",
  "Redstone",
  "Modding",
  "Development",
  "Speedrunning",
  "Hardcore",
  "Creative",
];
export const navItems = [
  ["Home", "/home"],
  ["Explore", "/explore"],
  ["Notifications", "/notifications"],
  ["Messages", "/messages"],
  ["Communities", "/communities"],
  ["Minecraft", "/servers"],
  ["Bookmarks", "/bookmarks"],
  ["Profile", "/profile"],
  ["Settings", "/settings"],
];
