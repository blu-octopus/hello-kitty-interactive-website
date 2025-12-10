# Camera Feed Preview - Testing Checklist

## Quick Location Check
- **Where**: Bottom-right corner of the page
- **Size**: 240px ¡Ñ 180px
- **Style**: Pink border (#FFB6C1), rounded corners, dark background
- **When**: Only visible on **desktop** (hidden on mobile)

## Pre-Testing Checklist

### 1. **Device Check**
- [ ] Are you on a **desktop/laptop**? (Camera feed is hidden on mobile)
- [ ] Is your device's camera working? (Test in another app like Photo Booth)
- [ ] Do you have a webcam connected?

### 2. **Browser Check**
- [ ] Using Chrome, Firefox, Edge, or Safari (desktop)
- [ ] Browser is up to date
- [ ] No browser extensions blocking camera access

### 3. **Permissions Check**
- [ ] Browser will ask for camera permission - **click "Allow"**
- [ ] Check browser address bar for camera icon
- [ ] If blocked, go to browser settings and allow camera for this site

## Step-by-Step Testing

### Step 1: Open the App
- [ ] Open `http://localhost:5173` (or your dev server URL)
- [ ] Page loads without errors
- [ ] Console shows: `? Initializing MediaPipe hand tracking...`

### Step 2: Grant Camera Permission
- [ ] Browser shows permission popup: "Allow camera access?"
- [ ] Click **"Allow"** or **"Permit"**
- [ ] If you clicked "Block", you need to:
  1. Click the camera icon in browser address bar
  2. Select "Always allow" for this site
  3. Refresh the page

### Step 3: Check Console Logs
Open DevTools Console (F12) and look for:
- [ ] `? Initializing MediaPipe hand tracking...`
- [ ] `? Camera video element ready: [HTMLVideoElement]`
- [ ] If you see `? MediaPipe initialization failed:` - see troubleshooting below

### Step 4: Look for Camera Feed
- [ ] Look at **bottom-right corner** of the page
- [ ] You should see a small box (240¡Ñ180px) with:
  - Pink border
  - Dark background
  - Your camera feed (mirrored, like a selfie)
  - Text at bottom showing detected gesture

### Step 5: Test Gesture Detection
- [ ] Wave your hand in front of camera
- [ ] Text at bottom of camera feed should update:
  - "No hand detected" ¡÷ when no hand
  - "Hand detected" ¡÷ when hand is visible
  - "Pinch detected" ¡÷ when thumb and index finger are close
  - "Hand up" ¡÷ when hand is raised
  - "Open hand" ¡÷ when all fingers are extended

### Step 6: Test Gesture Controls
- [ ] **Pinch gesture**: Pinch fingers together ¡÷ scene should zoom
- [ ] **Hand rotation**: Wave hand left/right ¡÷ scene should rotate
- [ ] **Hand up**: Raise hand while holding "Hold to Explore" ¡÷ photos should advance

## Troubleshooting

### ? Camera Feed Not Showing

**Check 1: Is it mobile?**
- Camera feed is **hidden on mobile devices**
- Check console for: `isMobile: true` or window width < 768px
- **Solution**: Test on desktop/laptop

**Check 2: Camera Permission**
- Look for camera icon in browser address bar
- If blocked, click it and allow camera
- **Solution**: 
  1. Click camera icon in address bar
  2. Select "Always allow"
  3. Refresh page

**Check 3: Console Errors**
- Open DevTools Console (F12)
- Look for red errors
- Common errors:
  - `getUserMedia is not defined` ¡÷ Browser doesn't support camera API
  - `Permission denied` ¡÷ Camera permission blocked
  - `MediaPipe initialization failed` ¡÷ See MediaPipe troubleshooting

**Check 4: MediaPipe Not Loading**
- Check Network tab for `@mediapipe` requests
- Should see requests to `cdn.jsdelivr.net/npm/@mediapipe`
- If failed, check internet connection
- **Solution**: MediaPipe needs internet to load models

**Check 5: Video Element Not Set**
- In Console, type: `document.querySelector('video[ref]')`
- Should return a video element
- If null, video element wasn't created
- **Solution**: Check MediaPipe initialization logs

### ? Camera Feed Shows But Black/No Video

**Check 1: Camera in Use**
- Another app might be using the camera
- Close other apps using camera (Zoom, Teams, etc.)
- **Solution**: Close other apps, refresh page

**Check 2: Video Stream Not Attached**
- In Console, check: `displayVideoRef.current?.srcObject`
- Should not be null
- **Solution**: Check if `cameraVideoRef` is set (see console logs)

**Check 3: Video Element Not Playing**
- Check Console for video play errors
- **Solution**: Try refreshing the page

### ? Gesture Detection Not Working

**Check 1: Hand Visible**
- Make sure your hand is clearly visible in camera feed
- Good lighting helps
- **Solution**: Improve lighting, move closer to camera

**Check 2: MediaPipe Model Loading**
- Check Network tab for MediaPipe model file
- Should see request to `hand_landmarker.task`
- If failed, MediaPipe can't detect gestures
- **Solution**: Check internet connection, wait for model to load

**Check 3: Gesture Text Not Updating**
- Text should update in real-time
- If stuck on "No hand detected", MediaPipe might not be running
- **Solution**: Check console for MediaPipe errors

## Expected Console Output

When everything works, you should see:
```
? Initializing MediaPipe hand tracking...
? Camera video element ready: <video>
? Gesture detected: Hand detected
? Gesture detected: Pinch detected
? Gesture detected: Hand up
```

## Quick Debug Commands

Open Console (F12) and try:

```javascript
// Check if mobile
console.log('Is Mobile:', window.innerWidth < 768);

// Check camera permission
navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('Camera permission:', result.state);
});

// Check if video element exists
const video = document.querySelector('video[ref]');
console.log('Video element:', video);
console.log('Video srcObject:', video?.srcObject);

// Check MediaPipe status
console.log('MediaPipe initialized:', typeof window !== 'undefined' && window.HandLandmarker);
```

## Success Criteria

? Camera feed visible in bottom-right corner  
? Video shows your camera feed (mirrored)  
? Gesture detection text updates in real-time  
? Gestures control the scene (zoom, rotate, advance photos)  
? No console errors  
? Camera permission granted  

## If Still Not Working

1. **Check browser compatibility**: Chrome/Edge recommended
2. **Try incognito mode**: Disables extensions that might block camera
3. **Check firewall/antivirus**: Might be blocking camera access
4. **Restart browser**: Sometimes fixes permission issues
5. **Check system camera settings**: Make sure camera isn't disabled in OS settings

