import CarousalComponent from '@/components/common/CarousalComponent';
import WatchList from '@/components/common/WatchList';
import AnimeRow from '@/components/container/AnimeRow';
import RowLoader from '@/components/loading/RowLoader';
import { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Kino Anime',
	description: 'Watch any Anime Kino',
};

/** Anime sub-genres: TMDB genre IDs for TV that pair well with Animation (16) + Japanese */
const animeGenres = [
	{ id: '10759', name: 'Action & Adventure' },
	{ id: '10765', name: 'Sci-Fi & Fantasy' },
	{ id: '35', name: 'Comedy' },
	{ id: '18', name: 'Drama' },
	{ id: '9648', name: 'Mystery' },
	{ id: '10768', name: 'War & Politics' },
];

export default function AnimePage() {
	return (
		<>
			<div className="mx-auto max-w-9xl space-y-4 px-4 lg:px-0">
				<div className="flex flex-col space-y-12 pt-8">
					<WatchList type="tv" />

					<Suspense fallback={<RowLoader withHeader />}>
						<AnimeRow
							text="Trending Anime"
							sortBy="popularity.desc"
							showRank={false}
						/>
					</Suspense>

					<Suspense fallback={<RowLoader withHeader />}>
						<AnimeRow
							text="Top Rated Anime"
							sortBy="vote_average.desc"
							showRank={true}
							extraParams="&vote_count.gte=200"
						/>
					</Suspense>

					{animeGenres.map((genre) => (
						<Suspense key={genre.id} fallback={<RowLoader withHeader />}>
							<AnimeRow
								text={`${genre.name} Anime`}
								genreId={genre.id}
								showRank={false}
							/>
						</Suspense>
					))}
				</div>
			</div>
		</>
	);
}
