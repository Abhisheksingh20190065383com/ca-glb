// HDRI-ready GLB Studio — fully wired buttons and toasts
let scene, camera, renderer, controls, mixer, currentRoot;
let gridHelper, hemiLight, dirLight, pmremGenerator;
let autoRotate = false;
let shadowsOn = true;

const viewer = document.getElementById('viewer');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const toastEl = document.getElementById('toast');

function showToast(msg, timeout=2500){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> toastEl.classList.remove('show'), timeout);
}

initScene();
animate();
setupUI();

function initScene(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050a);

  const w = Math.max(400, window.innerWidth * 0.55);
  const h = Math.max(300, window.innerHeight * 0.5);
  camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 2000);
  camera.position.set(3,2.2,4);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(viewer.clientWidth || w, viewer.clientHeight || h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewer.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.target.set(0,0.9,0);

  // lights
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5,10,7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048,2048);
  scene.add(dirLight);

  // ground
  const groundGeo = new THREE.PlaneGeometry(200,200);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  gridHelper = new THREE.GridHelper(10, 20, 0x222222, 0x111111);
  gridHelper.position.y = 0.001; scene.add(gridHelper);

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  window.addEventListener('resize', onResize);
  showToast('Scene ready');
}

function onResize(){
  const w = viewer.clientWidth || Math.max(400, window.innerWidth * 0.55);
  const h = viewer.clientHeight || Math.max(300, window.innerHeight * 0.5);
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}

function animate(){
  requestAnimationFrame(animate);
  controls.autoRotate = !!autoRotate;
  const delta = 0.016;
  if(mixer) mixer.update(delta);
  controls.update();
  renderer.render(scene, camera);
}

/* UI */
function setupUI(){
  document.getElementById('chooseBtn').addEventListener('click', ()=> fileInput.click());
  document.getElementById('uploadSmall').addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (e)=> { if(e.target.files && e.target.files[0]) handleFile(e.target.files[0]); });

  dropArea.addEventListener('click', ()=> fileInput.click());
  ;['dragenter','dragover','dragleave','drop'].forEach(evt=> dropArea.addEventListener(evt, (e)=>{ e.preventDefault(); e.stopPropagation(); }));
  ;['dragenter','dragover'].forEach(evt=> dropArea.addEventListener(evt, ()=> dropArea.classList.add('ring','ring-2','ring-white/6')));
  ;['dragleave','drop'].forEach(evt=> dropArea.addEventListener(evt, ()=> dropArea.classList.remove('ring','ring-2','ring-white/6')));
  dropArea.addEventListener('drop', (e)=> { const f = e.dataTransfer.files?.[0]; if(f) handleFile(f); });

  document.getElementById('autoRotate').addEventListener('click', ()=> {
    autoRotate = !autoRotate; document.getElementById('autoRotate').textContent = 'Auto Rotate: ' + (autoRotate ? 'On' : 'Off');
    showToast('Auto-rotate ' + (autoRotate ? 'enabled' : 'disabled'));
  });
  document.getElementById('gridToggle').addEventListener('click', ()=> {
    gridHelper.visible = !gridHelper.visible; document.getElementById('gridToggle').textContent = 'Grid: ' + (gridHelper.visible ? 'On' : 'Off');
    showToast('Grid ' + (gridHelper.visible ? 'visible' : 'hidden'));
  });
  document.getElementById('wireToggle').addEventListener('click', ()=> {
    const state = toggleWireframe(currentRoot); document.getElementById('wireToggle').textContent = 'Wire: ' + (state ? 'On' : 'Off');
    showToast('Wireframe ' + (state ? 'enabled' : 'disabled'));
  });
  document.getElementById('resetView').addEventListener('click', ()=> {
    controls.reset(); camera.position.set(3,2.2,4); controls.target.set(0,0.9,0); showToast('View reset');
  });
  document.getElementById('screenshot').addEventListener('click', ()=> {
    const dataURL = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a'); a.href = dataURL; a.download = 'glb-studio-screenshot.png'; a.click(); showToast('Screenshot saved');
  });
  document.getElementById('clearBtn').addEventListener('click', ()=> { clearScene(); showToast('Scene cleared'); });
  document.getElementById('exportBtn').addEventListener('click', ()=> { exportGLB(); });

  document.getElementById('themeToggle').addEventListener('click', ()=> { toggleTheme(); });
  document.getElementById('toggleShadows').addEventListener('click', ()=> { toggleShadows(); });

  document.getElementById('loadHdri').addEventListener('click', ()=> { loadHdri(); });
}

function clearScene(){
  if(currentRoot){
    scene.remove(currentRoot);
    currentRoot.traverse(obj=>{ if(obj.geometry) obj.geometry.dispose(); if(obj.material){ if(Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose()); else obj.material.dispose(); } });
    currentRoot = null; mixer = null; document.getElementById('modelInfo').textContent = 'No model loaded';
  }
}

/* wireframe toggle returns new state */
function toggleWireframe(root){
  if(!root) return false;
  let enabled = false;
  root.traverse(obj=>{
    if(obj.isMesh && obj.material){
      if(Array.isArray(obj.material)) obj.material.forEach(m=> { m.wireframe = !m.wireframe; enabled = m.wireframe; });
      else { obj.material.wireframe = !obj.material.wireframe; enabled = obj.material.wireframe; }
    }
  });
  return enabled;
}

function toggleShadows(){ shadowsOn = !shadowsOn; dirLight.castShadow = shadowsOn; document.getElementById('toggleShadows').textContent = 'Shadows: ' + (shadowsOn ? 'On' : 'Off'); showToast('Shadows ' + (shadowsOn ? 'enabled' : 'disabled')); }

/* loader */
function handleFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  const url = URL.createObjectURL(file);
  const loader = new THREE.GLTFLoader();
  try{ const draco = new THREE.DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); loader.setDRACOLoader(draco); }catch(e){}

  showToast('Loading ' + file.name + ' ...');
  loader.load(url, (gltf)=>{
    clearScene();
    currentRoot = gltf.scene || gltf.scenes[0];
    currentRoot.name = file.name;
    currentRoot.traverse(obj=>{ if(obj.isMesh){ obj.castShadow = true; obj.receiveShadow = true; } });
    scene.add(currentRoot);
    if(gltf.animations && gltf.animations.length){ mixer = new THREE.AnimationMixer(currentRoot); gltf.animations.forEach(c=> mixer.clipAction(c).play()); }
    fitCameraToObject(currentRoot);
    updateModelInfo(currentRoot, gltf);
    showToast('Model loaded: ' + file.name);
  }, (xhr)=>{}, (err)=>{ alert('Failed to load model: ' + (err.message || err)); console.error(err); showToast('Load failed'); });
}

/* Fit camera */
function fitCameraToObject(object, offset=1.4){
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI/180);
  let cameraZ = Math.abs(maxDim / (2*Math.tan(fov/2)));
  cameraZ *= offset;
  camera.position.set(center.x + cameraZ, center.y + cameraZ*0.6, center.z + cameraZ);
  controls.target.copy(center); controls.update();
}

/* Model info */
function updateModelInfo(root, gltf){
  let tris=0, verts=0, meshes=0, matSet=new Set();
  root.traverse(obj=>{
    if(obj.isMesh){ meshes++; const geom=obj.geometry; if(geom && geom.index) tris += geom.index.count/3; if(geom && geom.attributes && geom.attributes.position) verts += geom.attributes.position.count; if(obj.material){ if(Array.isArray(obj.material)) obj.material.forEach(m=>matSet.add(m.uuid)); else matSet.add(obj.material.uuid); } }
  });
  document.getElementById('modelInfo').innerHTML = `<div style="font-weight:600">${root.name}</div><div class="text-sm opacity-80">Meshes: ${meshes} • Verts: ${verts.toLocaleString()} • Tris: ${Math.round(tris).toLocaleString()}</div><div class="text-sm opacity-80">Materials: ${matSet.size} • Animations: ${ (gltf.animations?.length)||0 }</div>`;
}

/* Export */
function exportGLB(){
  if(!currentRoot){ showToast('No model to export'); return; }
  const exporter = new THREE.GLTFExporter();
  exporter.parse(currentRoot, (result)=>{
    let blob, filename;
    if(result instanceof ArrayBuffer){ blob = new Blob([result], {type:'model/gltf-binary'}); filename = 'export.glb'; }
    else { const json = JSON.stringify(result, null, 2); blob = new Blob([json], {type:'application/json'}); filename = 'export.gltf'; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); showToast('Export started');
  }, { binary:true });
}

/* HDRI loader */
function loadHdri(){
  const hdriUrl = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr';
  showToast('Loading HDRI... (may take a few seconds)');
  try{
    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.setDataType(THREE.UnsignedByteType);
    rgbeLoader.load(hdriUrl, (texture)=>{
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      showToast('HDRI applied');
    }, undefined, (err)=>{ console.error(err); showToast('HDRI load failed'); });
  }catch(e){ console.error(e); showToast('HDRI not supported'); }
}

/* Theme toggle */
function toggleTheme(){
  document.body.classList.toggle('light');
  if(document.body.classList.contains('light')){
    document.body.style.background = 'linear-gradient(180deg,#f7fafc,#e6f0ff)'; document.body.style.color = '#0b1220';
  } else {
    document.body.style.background = 'linear-gradient(180deg,#030313,#080812)'; document.body.style.color = '#e6eef8';
  }
  showToast('Theme toggled');
}

/* init resize */
window.addEventListener('load', ()=> onResize());
window.addEventListener('resize', ()=> onResize());
