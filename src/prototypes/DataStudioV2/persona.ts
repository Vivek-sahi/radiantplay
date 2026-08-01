/**
 * The demo's persona — one definition, read everywhere.
 *
 * The run-of-show is Maya Chen's story end to end, but the identity was hardcoded
 * separately at every header and avatar, so it drifted: the canvas header said "Royal
 * Enfield" while every other screen said Maya Chen. Anyone presenting moved between
 * identities mid-demo.
 *
 * `tenant` is "Acme" because the demo's own Jira instance is acme.atlassian.net — it isn't
 * invented, it's what the script already says on screen.
 *
 * The avatar is a local file, deliberately. The Spotter prototype pulls its profile picture
 * from an external stock-photo service, which is a broken image on conference wifi in the
 * last 45 seconds of the demo.
 */
export const PERSONA = {
  /** Shown in every header's profile menu. */
  userName: 'Maya Chen',
  /** Shown wherever the workspace/tenant is named. */
  tenant: 'Acme',
  /**
   * Same asset the agent thread's user bubbles use (`_agentic/UserBubble`), so the person
   * in the conversation and the person in the header are visibly the same person.
   */
  userAvatar: '/spotter-assets/User avatar.png',
} as const;
