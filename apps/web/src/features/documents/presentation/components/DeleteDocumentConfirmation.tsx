type Props = {
  inputId: string;
  value: string;
  busy: boolean;
  canConfirm: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
};

export function DeleteDocumentConfirmation(props: Props) {
  return (
    <>
      <label htmlFor={props.inputId} className="text-sm">
        Nhập XÓA để xác nhận
      </label>
      <input
        id={props.inputId}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        disabled={props.busy}
        autoComplete="off"
        spellCheck={false}
        className="min-h-11 rounded-lg border border-[#738780] px-3"
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={props.busy}
          onClick={props.onCancel}
          className="min-h-11 rounded-lg border px-4"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={!props.canConfirm}
          className="min-h-11 rounded-lg bg-[#a32622] px-4 font-semibold text-white disabled:opacity-55"
        >
          {props.busy ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
        </button>
      </div>
    </>
  );
}
