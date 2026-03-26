'use client';
import React, { useEffect } from 'react';
import { Separator } from '../ui/separator';
import ShowContainer from './ShowContainer';
import MoreDetailsContainer from '../container/MoreDetailsContainer';
import ShowDetails from '../container/tv-details.tsx/TVDetails';
import RelatedShowsComponent from '../container/RelatedShowContainer';
import useAnimeStore from '@/store/animeStore';
import { isAnimeShow, fetchMalId, fetchAnimeFranchise } from '@/lib/anime';
import ReviewsSection from '../container/ReviewsSection';

const Details = (props: any) => {
	const { data, type, id } = props;
	const { setIsAnime, setMalId, setFranchise, setTmdbSeasonEpCounts } = useAnimeStore();

	// Detect anime, fetch MAL ID, then fetch franchise (sequel chain) for episode mapping
	useEffect(() => {
		const anime = isAnimeShow(data);
		setIsAnime(anime);

		if (anime) {
			// Extract TMDB season episode counts (skip specials at season 0)
			const epCounts: number[] =
				data.seasons
					?.filter((s: any) => s.season_number > 0)
					.sort((a: any, b: any) => a.season_number - b.season_number)
					.map((s: any) => s.episode_count ?? 0) ?? [];
			setTmdbSeasonEpCounts(epCounts);

			const primaryTitle = data.name || data.title;
			const alternateTitle = data.original_name || data.original_title;

			fetchMalId(primaryTitle, alternateTitle).then(async (malId) => {
				setMalId(malId);
				if (malId) {
					const franchiseData = await fetchAnimeFranchise(malId);
					setFranchise(franchiseData);
				}
			});
		} else {
			setMalId(null);
			setFranchise([]);
			setTmdbSeasonEpCounts([]);
		}
	}, [data, setIsAnime, setMalId, setFranchise, setTmdbSeasonEpCounts]);

	const renderContent = (selected: string) => {
		switch (selected) {
			case 'Recommendations':
				return <RelatedShowsComponent relation="recommendations" type={type} show={data} />;
			case 'Reviews':
				return <ReviewsSection showId={String(data?.id)} type={type === 'anime' ? 'tv' : type} />;
			default:
				return <div>No Content</div>;
		}
	};
	return (
		<div className="max-w-9xl w-full space-y-10  mx-auto">
			<ShowDetails id={data?.id} show={data} language={'en'} type={type} />
			<Separator className="max-w-9xl w-full  mx-auto" />
			<ShowContainer id={data?.id} type={type} seasons={data.seasons} />
			<Separator className="max-w-9xl w-full  mx-auto" />
			<MoreDetailsContainer renderContent={renderContent} type={type} show={data} />
		</div>
	);
};
export default Details;
