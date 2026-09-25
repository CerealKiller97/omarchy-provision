/**
 * Minimal YAML tokenizer for the flat format `toYaml` emits (comments, `key: value`,
 * `- item`, `a|b|c` entries). Returns plain tokens so the UI can render them as text
 * nodes; user input never goes through {@html}.
 */

export type TokenKind = 'comment' | 'key' | 'punct' | 'string' | 'bool' | 'number' | 'sep' | 'plain';
export type Token = { kind: TokenKind; text: string };

const COMMENT = /^(\s*)(#.*)$/;
const ITEM = /^(\s*)(-)(\s+)(.*)$/;
const PAIR = /^(\s*)([\w-]+)(:)(\s*)(.*)$/;

function value(text: string): Token[] {
	if (!text) return [];
	if (text === 'true' || text === 'false') return [{ kind: 'bool', text }];
	if (/^-?\d+(\.\d+)?$/.test(text)) return [{ kind: 'number', text }];
	// Pipe-separated entries (webapps / tuis): highlight the separators.
	return text
		.split(/(\|)/)
		.filter(Boolean)
		.map((part) => ({ kind: part === '|' ? 'sep' : 'string', text: part }));
}

function line(text: string): Token[] {
	let m: RegExpMatchArray | null;
	if ((m = text.match(COMMENT)))
		return [
			{ kind: 'plain', text: m[1] },
			{ kind: 'comment', text: m[2] }
		];
	if ((m = text.match(ITEM)))
		return [
			{ kind: 'plain', text: m[1] },
			{ kind: 'punct', text: m[2] },
			{ kind: 'plain', text: m[3] },
			...value(m[4])
		];
	if ((m = text.match(PAIR)))
		return [
			{ kind: 'plain', text: m[1] },
			{ kind: 'key', text: m[2] },
			{ kind: 'punct', text: m[3] },
			{ kind: 'plain', text: m[4] },
			...value(m[5])
		];
	return [{ kind: 'plain', text }];
}

export const highlightYaml = (yaml: string): Token[][] =>
	yaml.split('\n').map((l) => line(l).filter((t) => t.text));

/** Colors for the dark code surface; only neutral and status tokens from the design system. */
export const TOKEN_CLASS: Record<TokenKind, string> = {
	comment: 'text-code-muted',
	key: 'text-white font-medium',
	punct: 'text-code-muted',
	string: 'text-success',
	bool: 'text-warning',
	number: 'text-warning',
	sep: 'text-code-muted',
	plain: ''
};
