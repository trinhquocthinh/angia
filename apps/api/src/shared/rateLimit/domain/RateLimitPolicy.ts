export type RateLimitPolicy = {
  kind:
    | 'data_export_request'
    | 'register'
    | 'invitation_inspect'
    | 'login_failed'
    | 'login_failed_ip'
    | 'invitation_create'
    | 'invitation_accept_invalid'
    | 'email_verification_send'
    | 'password_reset_request_ip'
    | 'password_reset_request_email';
  limit: number;
  windowMs: number;
};
