(function () {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Mobile menu
	const nav = document.querySelector('.nav');
	const toggle = document.querySelector('.nav-toggle');
	function setMenu(open) {
		nav.classList.toggle('is-open', open);
		toggle.setAttribute('aria-expanded', String(open));
		toggle.textContent = open ? 'Close' : 'Menu';
	}
	toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
	nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && nav.classList.contains('is-open')) {
			setMenu(false);
			toggle.focus();
		}
	});

	// Fade-in on scroll
	const reveals = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			});
		}, { rootMargin: '0px 0px -10% 0px' });
		reveals.forEach((el) => io.observe(el));
	} else {
		reveals.forEach((el) => el.classList.add('is-visible'));
	}

	// 3D tilt on service tiles (fine pointers only)
	if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
		document.querySelectorAll('[data-tilt]').forEach((tile) => {
			tile.addEventListener('pointermove', (e) => {
				const r = tile.getBoundingClientRect();
				const x = (e.clientX - r.left) / r.width - 0.5;
				const y = (e.clientY - r.top) / r.height - 0.5;
				tile.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
				tile.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
			});
			tile.addEventListener('pointerleave', () => {
				tile.style.setProperty('--ry', '0deg');
				tile.style.setProperty('--rx', '0deg');
			});
		});
	}

	// Copy email — silent success, label swaps back
	const copyBtn = document.querySelector('.copy-btn');
	if (copyBtn) {
		const label = copyBtn.querySelector('.copy-label');
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(copyBtn.dataset.copy);
				copyBtn.dataset.state = 'success';
				label.textContent = 'Copied';
			} catch (e) {
				window.location.href = 'mailto:' + copyBtn.dataset.copy;
				return;
			}
			setTimeout(() => {
				delete copyBtn.dataset.state;
				label.textContent = 'Copy email';
			}, 1800);
		});
	}

	document.getElementById('year').textContent = new Date().getFullYear();
})();
