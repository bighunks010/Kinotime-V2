import Details from '@/components/common/Details';
import { fetchDetailsTMDB } from '@/lib/utils';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

export const generateMetadata = async ({
	params: { id },
}: any): Promise<Metadata> => {
	try {
		const data = await fetchDetailsTMDB(id, 'tv');
		return {
			title: `${data?.name || data?.title}`,
			description: data.overview,
		};
	} catch (e) {
		return {
			title: 'Anime',
			description: 'Anime Details',
		};
	}
};

export default async function AnimeDetails({
	params,
}: {
	params: { id: string };
}) {
	// Anime are TV shows on TMDB, so we fetch as type "tv"
	const tmdb = await fetchDetailsTMDB(params.id, 'tv');
	if (!tmdb) return notFound();

	// Pass type as "tv" so the Details/Episode pipeline works correctly with TMDB IDs
	return <Details data={tmdb} id={params.id} type={'tv'} />;
}
