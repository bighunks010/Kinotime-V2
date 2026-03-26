import { Show } from './types';

const ANIMATION_GENRE_ID = 16;

export interface FranchiseEntry {
	malId: number;
	episodes: number;
}

/**
 * Detect if a show is anime based on TMDB data.
 * A show is anime if it's originally Japanese AND has the Animation genre.
 * This avoids false positives from:
 * - Japanese live-action dramas (no Animation genre)
 * - Non-Japanese animation like Disney/Pixar (not Japanese language)
 */
export function isAnimeShow(show: Show): boolean {
	const isJapanese = show.original_language === 'ja';
	const hasAnimationGenre =
		show.genres?.some(
			(g: any) => g.id === ANIMATION_GENRE_ID || g.name === 'Animation'
		) || show.genre_ids?.some((id: number) => id === ANIMATION_GENRE_ID);
	return isJapanese && !!hasAnimationGenre;
}

/* ─── AniList GraphQL helpers ────────────────────────────────────── */

const ANILIST_URL = 'https://graphql.anilist.co';

/** Small helper to POST a query to AniList. */
async function queryAniList(
	query: string,
	variables: Record<string, unknown>
): Promise<any | null> {
	try {
		const res = await fetch(ANILIST_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables }),
		});
		if (!res.ok) return null;
		return res.json();
	} catch {
		return null;
	}
}

/**
 * Fetch MyAnimeList ID by searching with the show's title.
 * Uses AniList's free GraphQL API (no auth required) which conveniently
 * exposes the MAL ID via the `idMal` field.
 * Tries the primary title first, then falls back to an alternate title.
 */
export async function fetchMalId(
	title: string,
	alternateTitle?: string
): Promise<number | null> {
	const query = `
		query ($search: String) {
			Media(search: $search, type: ANIME) {
				id
				idMal
				title { romaji english native }
			}
		}
	`;

	const searchTitle = async (term: string): Promise<number | null> => {
		const data = await queryAniList(query, { search: term });
		return data?.data?.Media?.idMal || null;
	};

	let id = await searchTitle(title);
	if (id) return id;

	if (alternateTitle && alternateTitle !== title) {
		id = await searchTitle(alternateTitle);
	}
	return id;
}

/* ─── Franchise (sequel chain) fetching ──────────────────────────── */

const RELATION_QUERY = `
	query ($malId: Int) {
		Media(idMal: $malId, type: ANIME) {
			id
			idMal
			episodes
			format
			relations {
				edges {
					relationType
					node { id idMal episodes format }
				}
			}
		}
	}
`;

interface AniListMedia {
	id: number;
	idMal: number | null;
	episodes: number | null;
	format: string | null;
	relations?: {
		edges: {
			relationType: string;
			node: AniListMedia;
		}[];
	};
}

/**
 * Walk AniList's PREQUEL / SEQUEL chain from an initial MAL ID
 * and return an ordered list of franchise entries (first season → last).
 *
 * Only follows TV-format entries to avoid OVAs/movies/specials polluting
 * the episode count. Caps at 15 iterations to prevent runaway loops.
 */
export async function fetchAnimeFranchise(
	initialMalId: number
): Promise<FranchiseEntry[]> {
	const MAX_HOPS = 15;
	const visited = new Set<number>();

	/** Fetch a single entry + its direct relations by MAL ID. */
	const fetchEntry = async (
		malId: number
	): Promise<AniListMedia | null> => {
		const data = await queryAniList(RELATION_QUERY, { malId });
		return data?.data?.Media ?? null;
	};

	/** Find a TV-format relation of a given type. */
	const findRelation = (
		media: AniListMedia,
		type: 'PREQUEL' | 'SEQUEL'
	): number | null => {
		const edge = media.relations?.edges?.find(
			(e) =>
				e.relationType === type &&
				e.node.format === 'TV' &&
				e.node.idMal != null
		);
		return edge?.node?.idMal ?? null;
	};

	// ── 1. Walk backwards (PREQUEL) to find the very first season ──
	let currentMalId: number = initialMalId;
	for (let i = 0; i < MAX_HOPS; i++) {
		if (visited.has(currentMalId)) break;
		visited.add(currentMalId);

		const media = await fetchEntry(currentMalId);
		if (!media) break;

		const prequelMalId = findRelation(media, 'PREQUEL');
		if (prequelMalId && !visited.has(prequelMalId)) {
			currentMalId = prequelMalId;
		} else {
			break;
		}
	}

	// ── 2. Walk forwards (SEQUEL) collecting every season ───────────
	const franchise: FranchiseEntry[] = [];
	visited.clear();

	for (let i = 0; i < MAX_HOPS; i++) {
		if (visited.has(currentMalId)) break;
		visited.add(currentMalId);

		const media = await fetchEntry(currentMalId);
		if (!media) break;

		franchise.push({
			malId: media.idMal ?? currentMalId,
			episodes: media.episodes ?? 0,
		});

		const sequelMalId = findRelation(media, 'SEQUEL');
		if (sequelMalId && !visited.has(sequelMalId)) {
			currentMalId = sequelMalId;
		} else {
			break;
		}
	}

	return franchise;
}

/* ─── Episode resolution ─────────────────────────────────────────── */

/**
 * Map a TMDB season + episode into the correct MAL ID + episode number.
 *
 * 1. Computes the "absolute" episode number across all TMDB seasons
 *    (using the episode counts you extracted from TMDB's `seasons` array).
 * 2. Walks the franchise list subtracting each entry's episode count
 *    until it finds the right MAL entry.
 *
 * Falls back to `franchise[0]` with the raw episode number if the math
 * doesn't line up (e.g. episode counts mismatch between TMDB & AniList).
 */
export function resolveAnimeEpisode(
	franchise: FranchiseEntry[],
	seasonNumber: number,
	episodeNumber: number,
	tmdbSeasonEpCounts: number[]
): { malId: number; episode: number } {
	// ── compute absolute episode across TMDB seasons ──
	let absoluteEp = episodeNumber;
	for (let i = 0; i < seasonNumber - 1 && i < tmdbSeasonEpCounts.length; i++) {
		absoluteEp += tmdbSeasonEpCounts[i];
	}

	// ── walk franchise to find the right MAL entry ──
	let remaining = absoluteEp;
	for (const entry of franchise) {
		if (entry.episodes <= 0) continue;
		if (remaining <= entry.episodes) {
			return { malId: entry.malId, episode: remaining };
		}
		remaining -= entry.episodes;
	}

	// Fallback — use last entry with whatever remains
	const last = franchise[franchise.length - 1];
	return { malId: last.malId, episode: remaining };
}

/**
 * Generate MegaPlay embed URL for anime.
 * Uses the MAL endpoint: /stream/mal/{mal-id}/{ep-num}/{language}
 */
export function getMegaPlayUrl(
	malId: number,
	episodeNumber: number | string,
	language: 'sub' | 'dub'
): string {
	return `https://megaplay.buzz/stream/mal/${malId}/${episodeNumber}/${language}`;
}
