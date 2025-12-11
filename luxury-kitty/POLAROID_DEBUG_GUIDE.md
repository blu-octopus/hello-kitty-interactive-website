# Polaroid Photo Display Debugging Guide

## 3 Most Likely Reasons Photos Aren't Showing:

### 1. **Image URL Path Issues** (Most Common)
**Problem**: The `imageUrl` from `import.meta.glob` might not be resolving correctly, especially on GitHub Pages.

**How to Debug:**
- Open browser DevTools (F12)
- Go to **Console** tab
- Look for these messages:
  - `"Loading polaroid image: [URL]"` - Shows what URL is being loaded
  - `"Successfully loaded image: [URL]"` - Confirms successful load
  - `"Failed to load image [URL]: [error]"` - Shows loading failure
- Go to **Network** tab
- Filter by "Img" or "image"
- Check if image requests return 404 (Not Found) or other errors
- Look at the actual URL being requested vs. the file path

**Where to Check in Code:**
- Line 1136: `console.log('Loading polaroid image:', imageUrl);`
- Line 1141: `console.log('Successfully loaded image:', imageUrl);`
- Line 1206: `console.warn('Failed to load image ${imageUrl}:', error);`
- Line 1437-1440: `import.meta.glob` path definition
- Line 1601: `imageUrl: imageInfo.url` - Check if `imageInfo.url` is populated

**Fix:**
- Ensure images are in `/src/assets/images/` folder
- Check that `import.meta.glob` pattern matches your file names
- For GitHub Pages, URLs might need `/hello-kitty-interactive-website/` prefix

---

### 2. **Z-Position / Depth Fighting** (Visibility Issue)
**Problem**: The photo mesh might be rendering behind the frame or at the wrong depth, causing it to be hidden.

**How to Debug:**
- Open browser DevTools (F12)
- Go to **Console** tab
- Type: `document.querySelector('canvas')` to get the canvas
- In **3D Scene Inspector** (if available) or use React DevTools
- Check the photo mesh z-position relative to frame

**Where to Check in Code:**
- Line 1307: `position={[0, 0.15, 0.03]}` - Photo mesh position
  - Z = 0.03 (should be in front of frame at z=0)
  - If frame is at z=0, photo should be at z > 0.05 to be clearly visible
- Line 1296-1305: Frame mesh at z=0 (default)
- Line 1320: `side={THREE.DoubleSide}` - Should render both sides

**Fix:**
- Increase photo z-position to `0.05` or `0.06` to ensure it's in front
- Check if frame is rendering on top (might need to adjust render order)
- Verify camera is looking at the correct angle

---

### 3. **Texture Not Applied / Material Issues** (Rendering Issue)
**Problem**: The texture loads but doesn't display due to material settings or texture not being set correctly.

**How to Debug:**
- Open browser DevTools (F12)
- Go to **Console** tab
- Check if `texture` state is set:
  - Look for `"Successfully loaded image"` messages
  - Check if `setTexture(loadedTexture)` is called
- In **Elements** tab, inspect the canvas
- Use React DevTools to check `PhotoFrame` component state
  - Look for `texture` state value (should be a THREE.Texture object, not null)

**Where to Check in Code:**
- Line 1128: `const [texture, setTexture] = useState<THREE.Texture | null>(null);`
- Line 1202: `setTexture(loadedTexture);` - Should be called on success
- Line 1310: `map={texture || null}` - Texture applied to material
- Line 1315: `transparent={!texture}` - Should be false when texture exists
- Line 1316: `opacity={texture ? 1 : 0.95}` - Should be 1 when texture exists

**Fix:**
- Ensure `texture` state is not null when image loads
- Check material `map` property is correctly set
- Verify `transparent` and `opacity` settings
- Check if texture needs `needsUpdate = true`

---

## How to Navigate and Find Errors:

### Step 1: Check Browser Console
1. Open DevTools (F12 or Right-click ¡÷ Inspect)
2. Go to **Console** tab
3. Look for:
   - Red errors (image loading failures)
   - Yellow warnings (path issues)
   - Blue info logs (loading progress)

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Filter by "Img" or type "image" in filter
3. Look for:
   - 404 errors (file not found)
   - 403 errors (permission denied)
   - CORS errors (cross-origin issues)
   - Check the actual URL being requested

### Step 3: Check React Component State
1. Install React DevTools browser extension
2. Open React DevTools
3. Find `PhotoFrame` component
4. Check:
   - `texture` state (should be THREE.Texture object)
   - `imageUrl` prop (should be valid URL string)
   - `isZoomed` prop (affects visibility)

### Step 4: Check 3D Scene
1. In browser console, you can inspect Three.js objects:
   ```javascript
   // Get the scene
   const scene = document.querySelector('canvas').__reactInternalInstance;
   // Or use React DevTools to find the Canvas component
   ```
2. Check if meshes are in the scene
3. Verify camera position and rotation

### Step 5: Check File Paths
1. Verify images exist in `/src/assets/images/` folder
2. Check file names match the pattern in `import.meta.glob`:
   - Pattern: `/src/assets/images/*.{jpg,jpeg,png,webp,gif}`
   - Should match: `image.png`, `image copy.png`, etc.
3. For GitHub Pages, check if base path is correct in `vite.config.ts`

---

## Quick Debug Checklist:

- [ ] Console shows "Loading polaroid image: [URL]" for each image
- [ ] Console shows "Successfully loaded image: [URL]" (not errors)
- [ ] Network tab shows images loading (status 200, not 404)
- [ ] `texture` state in React DevTools is not null
- [ ] Photo mesh z-position (0.03) is greater than frame z-position (0)
- [ ] Material `map` property is set to texture object
- [ ] Images exist in `/src/assets/images/` folder
- [ ] File names match `import.meta.glob` pattern
- [ ] For GitHub Pages: base path includes `/hello-kitty-interactive-website/`

---

## Common Fixes:

1. **If images return 404:**
   - Check file paths in `import.meta.glob`
   - Verify images are in correct folder
   - For GitHub Pages, ensure base path is set in `vite.config.ts`

2. **If texture is null:**
   - Check image loading error messages
   - Verify image format is supported (jpg, png, webp, gif)
   - Check CORS settings if loading from external source

3. **If photo is behind frame:**
   - Increase photo mesh z-position from `0.03` to `0.05` or `0.06`
   - Check render order in Three.js scene

4. **If photo description not showing:**
   - Check `photoDescriptions.json` file exists
   - Verify JSON structure matches expected format
   - Check `isZoomed` prop is true when viewing
   - Verify `customText` and `personalizedMessage` props are passed

---

## Code Locations to Check:

- **Image Loading**: Lines 1134-1236 (`useEffect` in `PhotoFrame`)
- **Image Path Loading**: Lines 1434-1453 (`loadGalleryImages`)
- **Photo Rendering**: Lines 1307-1320 (Photo mesh with texture)
- **Text Display**: Lines 1386-1429 (Custom text and personalized messages)
- **Gallery Setup**: Lines 1490-1628 (`PhotoGallery` component)

