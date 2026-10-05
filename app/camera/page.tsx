import { Suspense } from "react";
import { CameraView } from "@/components/camera/CameraView";

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <CameraView />
    </Suspense>
  );
}
