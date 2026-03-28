import { Show } from './types';

const ANIMATION_GENRE_ID = 16;

export interface FranchiseEntry {
	malId: number;
	episodes: number;
}

/* ─── Manual override map ────────────────────────────────────────── */

export interface AnimeOverride {
	malId: number;
	/**
	 * If true, TMDB already uses absolute episode numbers (e.g. S10E337 for
	 * One Piece) so we pass episodeNumber straight to MegaPlay.
	 */
	useAbsoluteEp?: boolean;
	/**
	 * Manual franchise list. When provided, Details.tsx skips the AniList
	 * sequel-chain fetch and uses these entries directly. Needed when the
	 * auto-discovered chain is broken (e.g. ONA-format seasons in JoJo).
	 */
	manualFranchise?: FranchiseEntry[];
}

/**
 * TMDB TV-show ID → override.
 *
 * Add entries here when:
 *  - AniList title search returns the wrong MAL ID (remakes / shared names)
 *  - A long-running show needs absolute episode numbering
 *
 * You can find TMDB IDs in the URL: themoviedb.org/tv/{id}
 * MAL IDs are in the URL: myanimelist.net/anime/{id}
 */
export const ANIME_OVERRIDES: Record<number, AnimeOverride> = {
	/* ── Long-runners (absolute episode numbering) ──────────────────── */
	37854: { malId: 21, useAbsoluteEp: true },       // One Piece
	12609: { malId: 223, useAbsoluteEp: true },       // Dragon Ball
	12971: { malId: 813, useAbsoluteEp: true },       // Dragon Ball Z
	12607: { malId: 225, useAbsoluteEp: true },       // Dragon Ball GT
	62715: { malId: 30694, useAbsoluteEp: true },     // Dragon Ball Super
	61709: { malId: 6033, useAbsoluteEp: true },      // Dragon Ball Z Kai
	46260: { malId: 20, useAbsoluteEp: true },        // Naruto
	31910: { malId: 1735, useAbsoluteEp: true },      // Naruto Shippūden
	70881: { malId: 34566, useAbsoluteEp: true },     // Boruto

	/* ── Absolute episode numbering (TMDB uses absolute ep numbers) ── */
	46298: { malId: 11061, useAbsoluteEp: true },     // Hunter × Hunter (2011)

	/* ── Disambiguation (shared names / wrong AniList match) ────────── */
	45952: { malId: 136 },                             // Hunter × Hunter (1999)
	60862: { malId: 2187 },                            // JoJo's Bizarre Adventure (1993 OVA)

	/* ── Manual franchise (AniList chain broken by ONA/format gaps) ── */
	45790: {
		malId: 14719,
		manualFranchise: [
			{ malId: 14719, episodes: 26 },   // S1: Phantom Blood + Battle Tendency
			{ malId: 20899, episodes: 24 },   // S2: Stardust Crusaders
			{ malId: 26055, episodes: 24 },   //     Stardust Crusaders: Egypt Arc
			{ malId: 31933, episodes: 39 },   // S3: Diamond is Unbreakable
			{ malId: 37991, episodes: 39 },   // S4: Golden Wind
			{ malId: 48661, episodes: 12 },   // S5: Stone Ocean Part 1
			{ malId: 51367, episodes: 12 },   //     Stone Ocean Part 2
			{ malId: 53273, episodes: 14 },   //     Stone Ocean Part 3
			{ malId: 61469, episodes: 52 },   // S6: Steel Ball Run
		],
	},  // JoJo's Bizarre Adventure
};

/** Look up an override by TMDB show ID. Returns null if none exists. */
export function getAnimeOverride(tmdbId: number): AnimeOverride | null {
	return ANIME_OVERRIDES[tmdbId] ?? null;
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
 *
 * When a year is provided the query is tried with AniList's `seasonYear`
 * filter first, which solves the remake / shared-name problem (e.g.
 * Hunter × Hunter 1999 vs 2011).  Falls back to a plain title search if
 * the year-filtered query returns nothing.
 */
export async function fetchMalId(
	title: string,
	alternateTitle?: string,
	year?: number
): Promise<number | null> {
	const queryWithYear = `
		query ($search: String, $seasonYear: Int) {
			Media(search: $search, type: ANIME, seasonYear: $seasonYear) {
				id
				idMal
				title { romaji english native }
			}
		}
	`;

	const queryNoYear = `
		query ($search: String) {
			Media(search: $search, type: ANIME) {
				id
				idMal
				title { romaji english native }
			}
		}
	`;

	const searchTitle = async (term: string, yr?: number): Promise<number | null> => {
		// Try with year first (more precise)
		if (yr) {
			const data = await queryAniList(queryWithYear, { search: term, seasonYear: yr });
			const malId = data?.data?.Media?.idMal;
			if (malId) return malId;
		}
		// Fallback to plain search
		const data = await queryAniList(queryNoYear, { search: term });
		return data?.data?.Media?.idMal || null;
	};

	let id = await searchTitle(title, year);
	if (id) return id;

	if (alternateTitle && alternateTitle !== title) {
		id = await searchTitle(alternateTitle, year);
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
