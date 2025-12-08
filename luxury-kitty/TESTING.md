# How to Test the App Locally

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd luxury-kitty
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The terminal will show a URL like: `http://localhost:5173`
   - Open this URL in your browser
   - You should see the Hello Kitty Luxury Card with your uploaded images!

## What You Should See

- **3D Hello Kitty** made of sparkling particles in the center
- **Floating Polaroid frames** around Hello Kitty showing your uploaded images
- **"GRAND LUXURY"** title at the top left
- **"HOLD TO UNLEASH"** button at the bottom
- **Chinese text banner** ("??¤@?§Î?") at the bottom left

## Interactive Features to Test

1. **Mouse Movement**: Move your mouse around - the 3D scene should rotate with parallax effect
2. **Hold to Unleash**: Click and hold the "HOLD TO UNLEASH" button - particles should scatter into chaos
3. **Release**: Let go of the button - particles should smoothly reform into Hello Kitty shape
4. **Touch Support**: On mobile/tablet, touch and hold the button for the same effect

## Troubleshooting

### Port Already in Use
If port 5173 is busy:
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Images Not Showing?
- Make sure images are in `src/assets/images/` folder
- Check browser console for any errors
- Images should be `.jpg`, `.png`, or `.webp` format
- The component will show colored placeholders if images fail to load

### Build Errors?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui
```

## Next Steps

Once you've verified everything works locally:
1. Add more images to `src/assets/images/` (up to 40 total)
2. Customize colors/styling if needed
3. Build for production: `npm run build`
4. Deploy to GitHub Pages (see `DEPLOYMENT.md`)

