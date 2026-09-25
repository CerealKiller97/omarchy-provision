/**
 * Light / dark / system color mode. app.html applies the saved mode before first paint;
 * this keeps it in sync afterwards and follows the OS setting while on "system".
 */

export type Mode = 'light' | 'dark' | 'system';

const KEY = 'omarchy-provision:mode';
const query = () => matchMedia('(prefers-color-scheme: dark)');

function read(): Mode {
	try {
		const v = localStorage.getItem(KEY);
		if (v === 'light' || v === 'dark') return v;
	} catch {
		/* storage unavailable */
	}
	return 'system';
}

function apply(mode: Mode) {
	const dark = mode === 'dark' || (mode === 'system' && query().matches);
	const root = document.documentElement;
	// Suspend transitions for a frame so every surface flips together instead of fading unevenly.
	root.classList.add('mode-switching');
	root.classList.toggle('dark', dark);
	root.style.colorScheme = dark ? 'dark' : 'light';
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a0a' : '#ffffff');
	requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('mode-switching')));
}

class ColorMode {
	current = $state<Mode>('system');

	/** Call once on mount; returns a cleanup for the OS listener. */
	init() {
		this.current = read();
		const mq = query();
		const onChange = () => this.current === 'system' && apply('system');
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}

	set(mode: Mode) {
		this.current = mode;
		try {
			if (mode === 'system') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, mode);
		} catch {
			/* still applies for this visit */
		}
		apply(mode);
	}
}

export const colorMode = new ColorMode();
