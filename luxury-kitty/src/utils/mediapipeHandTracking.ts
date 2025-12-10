import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface HandTrackingResult {
  zoom: number;
  rotation: { x: number; y: number };
  handUp: boolean;
  gesture: string;
}

let handLandmarker: HandLandmarker | null = null;
let videoElement: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let isRunning = false;
let callback: ((result: HandTrackingResult) => void) | null = null;

export async function initializeHandTracking(
  onResult: (result: HandTrackingResult) => void,
  onVideoReady?: (video: HTMLVideoElement) => void
): Promise<void> {
  try {
    callback = onResult;

    // Initialize MediaPipe Hand Landmarker
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });

    // Get user media
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });

    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true;
    await videoElement.play();

    // Notify that video is ready
    if (onVideoReady) {
      onVideoReady(videoElement);
    }

    isRunning = true;
    detectHands();

    return Promise.resolve();
  } catch (error) {
    console.error('Failed to initialize hand tracking:', error);
    return Promise.reject(error);
  }
}

function detectHands() {
  if (!isRunning || !handLandmarker || !videoElement || !callback) return;

  const result = handLandmarker.detectForVideo(videoElement, performance.now()) as any;

  // Detect gestures
  const gesture = detectGesture(result);
  const zoom = detectZoom(result);
  const rotation = detectRotation(result);
  const handUp = detectHandUp(result);

  callback({
    zoom,
    rotation,
    handUp,
    gesture,
  });

  requestAnimationFrame(detectHands);
}

function detectGesture(result: any): string {
  if (!result.landmarks || result.landmarks.length === 0) {
    return 'No hand detected';
  }

  const landmarks = result.landmarks[0];

  // Pinch gesture (thumb and index finger close)
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const pinchDistance = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y,
    thumbTip.z - indexTip.z
  );

  if (pinchDistance < 0.05) {
    return 'Pinch detected';
  }

  // Hand up (wrist higher than middle finger)
  const wrist = landmarks[0];
  const middleFinger = landmarks[12];
  if (wrist.y < middleFinger.y - 0.1) {
    return 'Hand up';
  }

  // Open hand (all fingers extended)
  const fingersExtended = [4, 8, 12, 16, 20].every((tipIndex) => {
    const tip = landmarks[tipIndex];
    const pip = landmarks[tipIndex - 2];
    return tip.y < pip.y;
  });

  if (fingersExtended) {
    return 'Open hand';
  }

  return 'Hand detected';
}

function detectZoom(result: any): number {
  if (!result.landmarks || result.landmarks.length < 2) return 0;

  // Calculate distance between two hands
  const hand1 = result.landmarks[0];
  const hand2 = result.landmarks[1];
  const wrist1 = hand1[0];
  const wrist2 = hand2[0];

  const distance = Math.hypot(
    wrist1.x - wrist2.x,
    wrist1.y - wrist2.y,
    wrist1.z - wrist2.z
  );

  // Normalize and return zoom value (0-1)
  return Math.max(0, Math.min(1, (0.3 - distance) / 0.2));
}

function detectRotation(result: any): { x: number; y: number } {
  if (!result.landmarks || result.landmarks.length === 0) {
    return { x: 0, y: 0 };
  }

  const landmarks = result.landmarks[0];
  const wrist = landmarks[0];
  const middleFinger = landmarks[12];

  // Calculate rotation based on hand orientation
  const dx = middleFinger.x - wrist.x;
  const dy = middleFinger.y - wrist.y;

  return {
    x: Math.max(-1, Math.min(1, dx * 2)),
    y: Math.max(-1, Math.min(1, dy * 2)),
  };
}

function detectHandUp(result: any): boolean {
  if (!result.landmarks || result.landmarks.length === 0) return false;

  const landmarks = result.landmarks[0];
  const wrist = landmarks[0];
  const middleFinger = landmarks[12];

  // Hand is up if wrist is significantly higher than middle finger
  return wrist.y < middleFinger.y - 0.15;
}

export function cleanupHandTracking(): void {
  isRunning = false;

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
    videoElement = null;
  }

  handLandmarker = null;
  callback = null;
}

export function getVideoElement(): HTMLVideoElement | null {
  return videoElement;
}

