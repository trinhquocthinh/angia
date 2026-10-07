import { InvitationRequestError } from '../application/InvitationRequestError';
export async function readInvitationResponse<T>(result: { data?: T; response: Response }): Promise<T> {
  if (result.response.ok && result.data !== undefined) return result.data;
  throw new InvitationRequestError(result.response.status);
}
