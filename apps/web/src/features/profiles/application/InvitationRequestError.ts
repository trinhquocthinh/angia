export class InvitationRequestError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 404
        ? 'Link không còn khả dụng hoặc đã hết hạn.'
        : 'Không thể xử lý lời mời. Vui lòng thử lại.',
    );
    this.name = 'InvitationRequestError';
  }
}
