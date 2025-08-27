# GLB Studio — Final (Polished)

This final package is designed to be run on a local static server (required for .gltf with external resources and HDRI).

## Files
- index.html
- style.css
- script.js
- vercel.json (for Vercel static deploy)

## Quick start (local server)
1. Unzip the package to a folder.
2. Open terminal / command prompt and run:
   ```bash
   cd path/to/unzipped-folder
   python -m http.server 8000
   ```
   or using Node.js:
   ```bash
   npx serve .
   ```
3. Open `http://localhost:8000` in your browser and use "Choose File" or drag & drop a .glb/.gltf model.

## Notes & Troubleshooting
- If a `.gltf` references external `.bin` or textures, keep those files in the same folder and serve the folder (don't open via file://).  
- If model doesn't load, open browser DevTools (F12) → Console and paste any errors here. I will help fix them.  
- HDRI loads from an external URL; if offline HDRI will fail but model load still works.
