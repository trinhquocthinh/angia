// Cổng gửi email giao dịch dạng văn bản đã render; không biết loại email.
export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}
