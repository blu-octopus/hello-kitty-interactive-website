# BeepBox Music Testing Checklist

## Quick Test Steps

### 1. **Visual Indicators Check**
- [ ] Open the app in your browser
- [ ] Look at the top-left corner below "Hello Kitty" title
- [ ] You should see a music state indicator showing: `? Music: OFF`
- [ ] The music button (top-right) should show a crossed-out music note icon (gray/faded)

### 2. **Console Logging Check**
- [ ] Open browser DevTools (F12 or Cmd+Option+I)
- [ ] Go to the Console tab
- [ ] Click the music button once
- [ ] You should see: `? Music State Changed: background`
- [ ] You should see: `? Loading background song...`
- [ ] You should see: `? Background song iframe loaded` (after iframe loads)

### 3. **Music Button Cycling Test**
- [ ] **First Click**: Button should change from gray (off) to pink (background song)
  - Icon changes to music note (not crossed out)
  - Indicator shows: `? Music: Background Song`
  - Console shows background song loading
  
- [ ] **Second Click**: Button should change to birthday mode
  - Icon changes to star/cake icon
  - Button has pink glow effect (`boxShadow` with glow)
  - Indicator shows: `? Music: Happy Birthday ?`
  - Console shows birthday song loading
  
- [ ] **Third Click**: Button should return to off state
  - Icon changes back to crossed-out music note (gray/faded)
  - Indicator shows: `? Music: OFF`
  - Console shows music stopped

### 4. **Audio Playback Test**

#### Background Song Test:
- [ ] Click music button once (should be in "background" state)
- [ ] **Listen for music**: You should hear the background BeepBox song playing
- [ ] **Note**: BeepBox may require user interaction to start (browser autoplay policy)
- [ ] If no sound, try clicking the button again or refreshing the page

#### Birthday Song Test:
- [ ] Click music button twice (should be in "birthday" state)
- [ ] **Listen for music**: You should hear the Happy Birthday BeepBox song
- [ ] **Visual check**: Button should have a pink glow effect
- [ ] Music should be different from the background song

#### Music Off Test:
- [ ] Click music button three times (should be in "off" state)
- [ ] **Listen**: Music should stop
- [ ] Button should return to gray/faded state

### 5. **Iframe Inspection (Advanced)**
- [ ] Open DevTools ¡÷ Elements/Inspector tab
- [ ] Search for `<iframe>` element
- [ ] When music is ON, iframe should have:
  - `src` attribute pointing to BeepBox URL
  - `opacity: 0.01` (nearly invisible but visible for audio)
  - `position: absolute`, `top: 0`, `left: 0`
- [ ] When music is OFF, iframe should have:
  - `src="about:blank"` or empty
  - `opacity: 0`

### 6. **Sound Effects Test (Separate from Music)**
- [ ] Make sure sound effects are NOT muted (speaker icon should be pink)
- [ ] Click and hold the "Hold to Explore" button
- [ ] **Listen**: You should hear a woosh sound effect
- [ ] This should work independently of the music state

### 7. **Browser Compatibility**
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] **Note**: Some browsers may block autoplay - user interaction may be required

## Troubleshooting

### ? No Music Playing?

1. **Check Console for Errors**
   - Look for any red error messages
   - Check if iframe is loading: `? Background song iframe loaded`

2. **Browser Autoplay Policy**
   - Most browsers require user interaction before playing audio
   - Try clicking the music button again after page load
   - Some browsers may show a muted autoplay indicator

3. **Check Iframe Source**
   - In DevTools, inspect the iframe element
   - Verify `src` attribute contains the BeepBox URL
   - Try opening the URL directly in a new tab to verify it works

4. **Network Issues**
   - Check Network tab in DevTools
   - Verify BeepBox URLs are loading (status 200)
   - Check for CORS errors

5. **Volume Check**
   - Make sure your system volume is up
   - Check browser tab volume (some browsers allow per-tab muting)
   - Verify no browser extensions are blocking audio

### ? Expected Console Output

When clicking through states, you should see:
```
? Music State Changed: background
? Loading background song... https://www.beepbox.co/player/#song=9n31s0k0l00e03t2wa7g0fj07r1i0o432T1v1u34f0q0x10n51d08AcFhB3Q01a5P9939E2b776T1v1u39f0qwx10l611d08A0F0B0Q38e0Pa610E3b8618626T5v1ua4f62ge2ec2f02j01960meq8141d36HT-Iqijriiiih99h0E0T3v1u03f12a6qwx10t511d08SjPrrW9V800ah0a0E1b7b4h400000000h4g000000014h000000004h400000000p215FE-x7khQBZt9794tpvs0CKVBVCzEkOYCy0FILAhFKrW8QSLO0FHPxuPnA15WqYALObbM0...
? Background song iframe loaded

? Music State Changed: birthday
? Loading birthday song... https://www.beepbox.co/player/#song=9n31s6k0l00e03t1ga7g0fj07r0i0o432T7v1u33f10m6q011d08HYw004000030000h0I4E0T1v1u39f0qwx10l611d08A0F0B0Q38e0Pa610E3b8618626T5v0ua4f62ge2ec2f02j01960meq8141d36HT-Iqijriiiih99h0E0T3v3ufaf0qwx10t511d08SjPrrW9V800ah0a0E1b7b4h400000000h4g000000014h000000004h400000000p21FLp-pT2p-U4tCvB8tCD-FCNZ1lXf_uvPlU_cWePjUvYZw2oWqvAVuwRM4DsSfY66jLr7OGkkOvaGyv2eZU1jesbW2ZPehn5-knQ5-hZ5U0...
? Birthday song iframe loaded

? Music State Changed: off
? Music stopped
```

## Quick Test Script

1. Open app ¡÷ Check visual indicator shows "OFF"
2. Click music button ¡÷ Check indicator shows "Background Song" + console logs
3. Listen for background music
4. Click music button again ¡÷ Check indicator shows "Happy Birthday" + glow effect
5. Listen for birthday music (different song)
6. Click music button again ¡÷ Check indicator shows "OFF" + music stops
7. Test sound effects separately (hold button, hear woosh)

## Success Criteria

? Music button cycles correctly: off ¡÷ background ¡÷ birthday ¡÷ off  
? Visual indicators update correctly  
? Console logs show state changes  
? Music plays when enabled (may require user interaction)  
? Music stops when set to off  
? Birthday mode has special glow effect  
? Sound effects work independently  

