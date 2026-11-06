import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Kéo để xoay, chụm để phóng; không kéo lệch tâm, không tự xoay (Design §10.4).
export function CameraControls() {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 0.6;
    controls.maxDistance = 3;
    controls.target.set(0, 0.5, 0);
    controls.update();
    const redraw = () => invalidate();
    controls.addEventListener('change', redraw);
    return () => {
      controls.removeEventListener('change', redraw);
      controls.dispose();
    };
  }, [camera, gl, invalidate]);
  return null;
}
