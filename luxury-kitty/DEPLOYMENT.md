# GitHub Pages Deployment Guide

## Setup Instructions

### 1. Add Your Photos
- Upload your 40+ photos to `src/assets/images/`
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- Recommended size: 800x1000px (portrait orientation)
- Keep file sizes under 500KB for fast loading
- The component will automatically detect and load all images

### 2. Install Dependencies
```bash
cd luxury-kitty
npm install
```

### 3. Test Locally
```bash
npm run dev
```
Visit `http://localhost:5173` to preview your site.

### 4. Build for GitHub Pages
```bash
npm run build:gh-pages
```

### 5. Deploy to GitHub Pages

#### Option A: Using GitHub Actions (Recommended)
1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: luxury-kitty/package-lock.json
      - name: Install dependencies
        run: |
          cd luxury-kitty
          npm ci
      - name: Build
        run: |
          cd luxury-kitty
          npm run build:gh-pages
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: luxury-kitty/dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Option B: Manual Deployment
1. Build the project:
   ```bash
   npm run build:gh-pages
   ```

2. Go to your repository Settings ¡÷ Pages

3. Set source to "GitHub Actions" (if using Option A) or "Deploy from a branch"

4. If deploying from branch:
   - Select branch: `gh-pages`
   - Select folder: `/ (root)`
   - Click Save

5. Push the `dist` folder contents to the `gh-pages` branch:
   ```bash
   git subtree push --prefix luxury-kitty/dist origin gh-pages
   ```

### 6. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** ¡÷ **Pages**
3. Under "Source", select:
   - **GitHub Actions** (if using Option A), OR
   - **Deploy from a branch** ¡÷ select `gh-pages` branch ¡÷ `/ (root)` folder
4. Your site will be available at:
   `https://[your-username].github.io/hello-kitty-interactive-website/`

## Troubleshooting

- **Images not loading?** Make sure images are in `src/assets/images/` and the build completed successfully
- **404 errors?** Check that `vite.config.ts` has the correct `base` path for your repository name
- **Build fails?** Run `npm install` to ensure all dependencies are installed

## Notes

- The site is optimized for all devices (mobile, tablet, desktop)
- Images are automatically optimized by Vite during build
- The component supports up to 40 photos and will cycle through available images

