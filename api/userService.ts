import { ApiConstants } from './constants';

// DELETE /user?userId=...
// Wipes every row tied to this user (agenda events + in-progress conversations).
// Returns the total row count the server reports as deleted.
export async function deleteUserData(userId: string): Promise<number> {
  const url = `${ApiConstants.baseUrl}/user?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  const json = (await res.json()) as { deleted?: unknown };
  return typeof json.deleted === 'number' ? json.deleted : 0;
}
