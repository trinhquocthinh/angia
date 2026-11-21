import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { WorkerConfig } from '@src/shared/config/loadWorkerConfig.js';
import type { Mailer } from './Mailer.js';

// Mailpit không cần auth; SMTP_SECURE=false vẫn cho phép STARTTLS của relay.
export function createSmtpMailer(
  config: NonNullable<WorkerConfig['smtp']>,
  createTransport: (options: SMTPTransport.Options) => {
    sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
  } = nodemailer.createTransport,
): Mailer {
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user && config.password ? { auth: { user: config.user, pass: config.password } } : {}),
  });
  return {
    async send(message) {
      await transport.sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    },
  };
}
