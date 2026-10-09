import { useState } from 'react';
import type { ReactNode } from 'react';
import type { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyCanvas } from './PrivacyCanvas';
import { PrivacyInspector } from './PrivacyInspector';
import { PrivacyEditorControls } from './PrivacyEditorControls';
import { PrivacyStudioHeading } from './PrivacyStudioHeading';
import './privacy-editor.css';
type Props = {
  workspace: ReturnType<typeof usePrivacyWorkspace>;
  documentId: string;
  inputPending: boolean;
  onInputPending: (pending: boolean) => void;
  children?: ReactNode;
};
export function PrivacyEditPanel({ workspace, documentId, inputPending, onInputPending, children }: Props) {
  const [mode, setMode] = useState<'crop' | 'mask'>('mask');
  const [preview, setPreview] = useState(false);
  const { state, dispatch, busy } = workspace;
  return (
    <PrivacyEditorControls
      state={state}
      dispatch={dispatch}
      mode={mode}
      setMode={setMode}
      disabled={busy || !preview}
      onInputPending={onInputPending}
    >
      {(toolbar, fields) => (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:p-6">
            <PrivacyStudioHeading />
            <PrivacyCanvas
              documentId={documentId}
              edits={state.edits}
              mode={mode}
              disabled={busy || inputPending || (mode === 'mask' && state.edits.masks.length >= 32)}
              onPreview={setPreview}
              onBegin={() => {
                onInputPending(false);
                dispatch({ type: 'invalidate' });
              }}
              onRectangle={(rectangle) => {
                onInputPending(false);
                dispatch({ type: mode, rectangle });
              }}
            />
            {toolbar}
            <p className="text-[13px] leading-5 text-[#404945]">
              Kéo trên ảnh để cắt hoặc che thông tin. Xoay ảnh sẽ đặt lại toàn bộ vùng cắt và vùng che. Bạn có
              thể tinh chỉnh qua các ô số bên phải. Bản xem trước dùng để chỉnh sửa; hãy kiểm tra đúng ảnh
              server trước khi gửi AI.
            </p>
          </section>
          <PrivacyInspector
            workspace={workspace}
            preview={preview}
            inputPending={inputPending}
            fields={fields}
          >
            {children}
          </PrivacyInspector>
        </div>
      )}
    </PrivacyEditorControls>
  );
}
