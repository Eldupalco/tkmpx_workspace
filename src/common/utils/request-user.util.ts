/** Claims attached to `req.user` by JwtAuthGuard */
export interface RequestUser {
  sub: string;
  email?: string;
  role: string;
}

/**
 * User whose data a request targets.
 * Employees always get their own id; admins may target another user via `requestedId`.
 * With `allowAll`, an admin without `requestedId` gets undefined (= every user).
 */
export function resolveUserId(user: RequestUser, requestedId?: string): string;
export function resolveUserId(
  user: RequestUser,
  requestedId: string | undefined,
  options: { allowAll: true },
): string | undefined;
export function resolveUserId(
  user: RequestUser,
  requestedId?: string,
  options: { allowAll?: boolean } = {},
): string | undefined {
  if (user?.role !== 'admin') return user.sub;
  if (requestedId) return requestedId;
  return options.allowAll ? undefined : user.sub;
}
