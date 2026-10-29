import { useState } from 'react';
import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { PrivacyCanvas } from './PrivacyCanvas';
import { PrivacyInspector } from './PrivacyInspector';
import { PrivacyEditorControls } from './PrivacyEditorControls';
import { PrivacyStudioHeading } from './PrivacyStudioHeading';
import './privacy-editor.css';
type Props = {
  state: PrivacyEditorState;
  dispatch: (action: PrivacyEditorAction) => void;
  src: string;
  onImageError: () => void;
  onNext: () => void;
  onCancel: () => void;
};
export function PrivacyEditPanel({ state, dispatch, src, onImageError, onNext, onCancel }: Props) {
  const [mode, setMode] = useState<'crop' | 'mask'>('mask');
  const [preview, setPreview] = useState(false);
  const [inputPending, setInputPending] = useState(false);
  return (
    <PrivacyEditorControls
      state={state}
      dispatch={dispatch}
      mode={mode}
      setMode={setMode}
      disabled={!preview}
      onInputPending={setInputPending}
    >
      {(toolbar, fields) => (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:p-6">
            <PrivacyStudioHeading />
            <PrivacyCanvas
              key={src}
              src={src}
              edits={state.edits}
              mode={mode}
              disabled={inputPending || (mode === 'mask' && state.edits.masks.length >= 32)}
              onPreview={(loaded) => {
                setPreview(loaded);
                if (!loaded) onImageError();
              }}
              onBegin={() => setInputPending(false)}
              onRectangle={(rectangle) => {
                setInputPending(false);
                dispatch({ type: mode, rectangle });
              }}
            />
            {toolbar}
            <p className="text-[13px] leading-5 text-[#404945]">
              Kéo trên ảnh để cắt hoặc che thông tin. Xoay ảnh sẽ đặt lại toàn bộ vùng cắt và vùng che. Bạn có
              thể tinh chỉnh qua các ô số bên phải. Ảnh vẫn chỉ nằm trên máy của bạn cho tới khi tải lên.
            </p>
          </section>
          <PrivacyInspector
            preview={preview}
            inputPending={inputPending}
            fields={fields}
            onNext={onNext}
            onCancel={onCancel}
          />
        </div>
      )}
    </PrivacyEditorControls>
  );
}
