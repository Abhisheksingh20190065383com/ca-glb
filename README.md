# GLB Studio — ZIP (3-file structure)

Files:
- index.html
- style.css
- script.js
- vercel.json

Quick start (local server):
1. Unzip.
2. Run: `python -m http.server 8000` or `npx serve .`
3. Open http://localhost:8000/ and upload a .glb or .gltf file.

Notes:
- For .gltf files that reference external .bin or textures, serve the folder (don't open file://).
- HDRI uses an external URL; if offline HDRI load will fail but model loading still works.
- Deploy to Vercel by pushing repo and connecting to Vercel (static site).
