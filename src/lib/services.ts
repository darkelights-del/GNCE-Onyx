/**
 * Third-party service config for the blog. Both services are free but
 * need accounts only a team member can create. Until the TBD values are
 * filled in, the site shows marked setup notes instead of the widgets.
 * Setup steps live in README.md under "Blog".
 */

/** giscus (comments + reactions, backed by GitHub Discussions). */
export const GISCUS = {
  repo: 'darkelights-del/GNCE-Onyx',
  // From https://giscus.app after enabling Discussions on the repo:
  repoId: 'TBD',
  category: 'Blog comments',
  categoryId: 'TBD',
};

/** GoatCounter (page view counts). Site code from goatcounter.com. */
export const GOATCOUNTER_CODE = 'TBD';

export const giscusReady = GISCUS.repoId !== 'TBD' && GISCUS.categoryId !== 'TBD';
export const goatcounterReady = GOATCOUNTER_CODE !== 'TBD';
