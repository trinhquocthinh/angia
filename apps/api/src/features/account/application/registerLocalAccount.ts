import { computeSessionExpiry } from '@src/shared/auth/domain/computeSessionExpiry.js';
import type { RegistrationInput } from '../domain/RegistrationInput.js';
import { validateRegistrationInput } from '../domain/validateRegistrationInput.js';
import type { LocalAccountSession, RegisterLocalAccountDeps, RegisterLocalAccountOutcome } from './ports.js';

export async function registerLocalAccount(
  deps: RegisterLocalAccountDeps,
  input: RegistrationInput,
): Promise<RegisterLocalAccountOutcome> {
  const validation = validateRegistrationInput(input);
  if (!validation.ok) return validation;
  const validated = validation.value;

  const isOpen = await deps.gate.isOpen();
  const invitation = input.invitationToken
    ? await deps.invitationVerifier.verify(input.invitationToken)
    : null;
  if (!isOpen && !invitation) {
    return { ok: false, code: 'ERR_REGISTRATION_CLOSED' };
  }

  const currentLegal = await deps.legalVersions.current();
  if (
    input.legalAcceptance.termsVersionId !== currentLegal.termsVersionId ||
    input.legalAcceptance.privacyVersionId !== currentLegal.privacyVersionId
  ) {
    return {
      ok: false,
      code: 'ERR_LEGAL_VERSION_OUTDATED',
      details: { current: currentLegal },
    };
  }

  if (await deps.accounts.isUsernameTaken(validated.usernameNormalized)) {
    return { ok: false, code: 'ERR_USERNAME_TAKEN' };
  }

  const passwordHash = await deps.hasher.hash(validated.password);
  const recordResult = await deps.accounts.register({
    usernameNormalized: validated.usernameNormalized,
    passwordHash,
    displayName: validated.displayName,
    email: validated.email ?? null,
    invitationToken: input.invitationToken,
    legalAcceptance: currentLegal,
  });
  if (!recordResult.ok) return recordResult;

  const account = recordResult.account;
  const csrfToken = deps.generateToken();
  const expiresAt = computeSessionExpiry(deps.now());
  const sessionRow = await deps.sessions.create({
    accountId: account.id,
    csrfToken,
    expiresAt,
    authMethod: 'local',
  });
  const session: LocalAccountSession = { sessionId: sessionRow.id, csrfToken, expiresAt };
  return { ok: true, value: { account, session } };
}
