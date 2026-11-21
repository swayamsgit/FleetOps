import 'server-only';

// Public viewer identity grants no write privileges; the API rejects mutations.
export async function getWorkspaceUser() {
  return { displayName: 'Public visitor' };
}
export async function requireWorkspaceUser() {
  return getWorkspaceUser();
}
