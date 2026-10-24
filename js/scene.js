// Hero 3D scene: a wireframe core with three orbiting shapes —
// a slab (mobile), a panel (web) and a stacked cylinder (CRM / database).
(function () {
	const canvas = document.getElementById('hero-canvas');
	if (!canvas || typeof THREE === 'undefined') return;

	const css = getComputedStyle(document.documentElement);
	const token = (name) => new THREE.Color(css.getPropertyValue(name).trim());
	const accent = token('--color-accent-srgb');
	const ink = token('--color-ink-srgb');
	const line = token('--color-line-srgb');

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	} catch (e) {
		return; // no WebGL — the hero still reads fine without the scene
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
	camera.position.set(0, 0, 11);

	scene.add(new THREE.AmbientLight(0xffffff, 0.35));
	const key = new THREE.PointLight(accent, 1.6, 40);
	key.position.set(4, 5, 6);
	scene.add(key);
	const rim = new THREE.DirectionalLight(ink, 0.2);
	rim.position.set(-5, -2, 3);
	scene.add(rim);

	const rig = new THREE.Group();
	scene.add(rig);

	// Core
	const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
	const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
		color: 0x1b1f29, roughness: 0.55, metalness: 0.3, flatShading: true
	}));
	const coreWire = new THREE.LineSegments(
		new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.1, 1)),
		new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.55 })
	);
	rig.add(core, coreWire);

	// Orbit rings
	const ringMat = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.8 });
	function ring(radius, tiltX, tiltZ) {
		const pts = [];
		for (let i = 0; i <= 128; i++) {
			const a = (i / 128) * Math.PI * 2;
			pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
		}
		const r = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
		r.rotation.set(tiltX, 0, tiltZ);
		rig.add(r);
		return r;
	}

	const surface = new THREE.MeshStandardMaterial({ color: 0x232836, roughness: 0.4, metalness: 0.5 });
	const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.6, roughness: 0.3 });

	function withEdges(mesh) {
		mesh.add(new THREE.LineSegments(
			new THREE.EdgesGeometry(mesh.geometry),
			new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.7 })
		));
		return mesh;
	}

	// Mobile slab
	const mobile = new THREE.Group();
	mobile.add(withEdges(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.08), surface)));
	const mobileScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), glow);
	mobileScreen.position.z = 0.045;
	mobileScreen.material = glow.clone();
	mobileScreen.material.emissiveIntensity = 0.25;
	mobile.add(mobileScreen);

	// Web panel
	const web = new THREE.Group();
	web.add(withEdges(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.06), surface)));
	for (let i = 0; i < 3; i++) {
		const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.1 - i * 0.3, 0.07), glow);
		bar.position.set(-0.15 - i * 0.15 + 0.15, 0.22 - i * 0.2, 0.035);
		web.add(bar);
	}

	// CRM / database stack
	const crm = new THREE.Group();
	for (let i = 0; i < 3; i++) {
		const disc = withEdges(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 32), surface));
		disc.position.y = (i - 1) * 0.3;
		crm.add(disc);
	}

	const orbiters = [
		{ obj: mobile, radius: 3.4, speed: 0.32, phase: 0, ring: ring(3.4, 0.35, 0.15) },
		{ obj: web, radius: 4.3, speed: 0.22, phase: 2.1, ring: ring(4.3, -0.25, -0.2) },
		{ obj: crm, radius: 3.0, speed: 0.4, phase: 4.2, ring: ring(3.0, 0.9, 0.5) }
	];
	orbiters.forEach((o) => rig.add(o.obj));

	// Particle field
	const count = 500;
	const positions = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		const r = 6 + Math.random() * 10;
		const t = Math.random() * Math.PI * 2;
		const p = Math.acos(2 * Math.random() - 1);
		positions[i * 3] = r * Math.sin(p) * Math.cos(t);
		positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
		positions[i * 3 + 2] = r * Math.cos(p) - 6;
	}
	const starGeo = new THREE.BufferGeometry();
	starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
		color: ink, size: 0.035, transparent: true, opacity: 0.55
	}));
	scene.add(stars);

	// Layout: scene sits right of the copy on wide screens, behind it on phones
	function resize() {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		const wide = w > 900;
		rig.position.x = wide ? 3.6 : 0;
		rig.position.y = wide ? 0 : -1.2;
		rig.scale.setScalar(wide ? 1 : 0.72);
		canvas.style.opacity = wide ? '1' : '0.45';
	}
	window.addEventListener('resize', resize);
	resize();

	// Pointer parallax
	const pointer = { x: 0, y: 0 };
	window.addEventListener('pointermove', (e) => {
		pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
		pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
	}, { passive: true });

	function place(t) {
		orbiters.forEach((o) => {
			const a = t * o.speed + o.phase;
			const v = new THREE.Vector3(Math.cos(a) * o.radius, 0, Math.sin(a) * o.radius);
			v.applyEuler(o.ring.rotation);
			o.obj.position.copy(v);
			o.obj.rotation.y = -a + Math.PI / 2;
			o.obj.rotation.x = Math.sin(t * 0.6 + o.phase) * 0.25;
		});
	}

	if (reduceMotion) {
		place(1);
		renderer.render(scene, camera);
		return;
	}

	let visible = true;
	new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

	const clock = new THREE.Clock();
	function frame() {
		requestAnimationFrame(frame);
		if (!visible || document.hidden) return;
		const t = clock.getElapsedTime();

		core.rotation.x = t * 0.15;
		core.rotation.y = t * 0.2;
		coreWire.rotation.x = -t * 0.1;
		coreWire.rotation.y = -t * 0.12;
		place(t);
		stars.rotation.y = t * 0.01;

		rig.rotation.y += (pointer.x * 0.35 - rig.rotation.y) * 0.04;
		rig.rotation.x += (pointer.y * 0.2 - rig.rotation.x) * 0.04;

		renderer.render(scene, camera);
	}
	frame();
})();
