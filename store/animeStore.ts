import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FranchiseEntry } from '@/lib/anime';

interface AnimeState {
	/** Whether the current show is detected as anime */
	isAnime: boolean;
	setIsAnime: (value: boolean) => void;

	/** Sub or Dub preference — persisted across sessions */
	animeLang: 'sub' | 'dub';
	setAnimeLang: (lang: 'sub' | 'dub') => void;

	/** MyAnimeList ID for the current show (null if not found or not anime) */
	malId: number | null;
	setMalId: (id: number | null) => void;

	/** Ordered franchise entries (season 1 → last) from AniList sequel chain */
	franchise: FranchiseEntry[];
	setFranchise: (franchise: FranchiseEntry[]) => void;

	/** Episode count per TMDB season (index 0 = season 1, etc.) */
	tmdbSeasonEpCounts: number[];
	setTmdbSeasonEpCounts: (counts: number[]) => void;
}

const useAnimeStore = create<AnimeState>()(
	persist(
		(set) => ({
			isAnime: false,
			setIsAnime: (value) => set({ isAnime: value }),

			animeLang: 'sub',
			setAnimeLang: (lang) => set({ animeLang: lang }),

			malId: null,
			setMalId: (id) => set({ malId: id }),

			franchise: [],
			setFranchise: (franchise) => set({ franchise }),

			tmdbSeasonEpCounts: [],
			setTmdbSeasonEpCounts: (counts) => set({ tmdbSeasonEpCounts: counts }),
		}),
		{
			name: 'anime-lang-storage',
			// Only persist the sub/dub preference; everything else is per-show
			partialize: (state) => ({ animeLang: state.animeLang }),
		}
	)
);

export default useAnimeStore;
