export const homePath = "/";
export const settingsPath = "/settings";
export const adminPath = "/admin";
export const profileSelfPath = "/profile";
export const profilePathById = (userId: string) => `/profile/${encodeURIComponent(userId)}`;
export const profilePathBySlug = (slug: string) => `/u/${encodeURIComponent(slug)}`;
export const articlePathBySlug = (slug: string) => `/article/${encodeURIComponent(slug)}`;
// Fallback path when only ID is known
export const articlePathById = (id: string) => `/article/id/${encodeURIComponent(id)}`;

export function navigate(path: string) {
  if (typeof window === "undefined") return;
  try {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch (e) {
    // As a fallback, assign location
    window.location.assign(path);
  }
}
