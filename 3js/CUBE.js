const scene = new THREE.Scene();
scene.background = new THREE.Color(0x00000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Set a fixed camera position
camera.position.set(2, 2, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(10, 5, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.1;
mainLight.shadow.camera.far = 20;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// Main red cube
const mainGeometry = new THREE.BoxGeometry(1, 1, 1);
const mainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    metalness: 0.1,
    roughness: 0.5
});
const mainCube = new THREE.Mesh(mainGeometry, mainMaterial);
mainCube.castShadow = true;
mainCube.receiveShadow = true;
scene.add(mainCube);

// Smaller orb cube
const orbGeometry = new THREE.BoxGeometry(0.65, 0.65, 0.65);
const orbMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0077ff,
    metalness: 0.1,
    roughness: 0.5
});
const orbCube = new THREE.Mesh(orbGeometry, orbMaterial);
orbCube.castShadow = true;
orbCube.receiveShadow = true;
scene.add(orbCube);

// Create a group for the orb cube
const orbitGroup = new THREE.Group();
orbitGroup.add(orbCube);
scene.add(orbitGroup);

// Position the orb cube
orbCube.position.x = 2; // This will be the orbit radius

// Improved plane with better material
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    metalness: 0,
    roughness: 1
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;

    // Rotate the orb cube around the main cube
    orbitGroup.rotation.y = time * 1.5; // Adjust speed by changing multiplier
    
    // Add a slight tilt to the orb cube's rotation
    orbCube.rotation.x = time * 2;
    orbCube.rotation.y = time * 2;
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

animate();