type EnrollmentSession = {
  account: { isSystemAdmin: boolean };
  authMethod: 'local' | 'oidc';
  hasLocalCredential: boolean;
  features: { localEnrollmentEnabled: boolean };
};

export function resolveEnrollmentRedirect(
  session: EnrollmentSession | null,
  pathname: string,
  deferred: boolean,
  returning: boolean,
): '/account/local-password' | null {
  if (
    pathname !== '/' ||
    !session ||
    session.account.isSystemAdmin ||
    session.authMethod !== 'oidc' ||
    session.hasLocalCredential ||
    !session.features.localEnrollmentEnabled
  )
    return null;
  return returning || !deferred ? '/account/local-password' : null;
}
