export type RateLimitPolicy = {
  kind:
    | 'data_export_request'
    | 'register'
    | 'login_failed'
    | 'email_verification_send'
    | 'password_reset_request_ip'
    | 'password_reset_request_email';
  limit: number;
  windowMs: number;
};
