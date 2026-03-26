'use client';

import { fetchAnimeShows, fetchAnimeByGenre } from '@/lib/utils';
import Row from './Row';
import RowLoader from '../loading/RowLoader';
import { useInView } from 'react-intersection-observer';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

interface AnimeRowProps {
	text: string;
	showRank: boolean;
	sortBy?: string;
	genreId?: string;
	extraParams?: string;
}

const AnimeRow: React.FC<AnimeRowProps> = ({
	text,
	showRank,
	sortBy = 'popularity.desc',
	genreId,
}) => {
	const { ref, inView } = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const fetcher = useCallback(async () => {
		if (genreId) {
			return await fetchAnimeByGenre(genreId);
		}
		return await fetchAnimeShows(1, sortBy);
	}, [genreId, sortBy]);

	const queryKey = ['anime', genreId || sortBy];

	const { data: rowData, error, isLoading } = useQuery({
		queryKey,
		queryFn: fetcher,
		enabled: inView,
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24 * 7,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	if (isLoading) {
		return <RowLoader withHeader />;
	}

	if (error) {
		console.error('Error fetching anime:', error);
		return <div>Error loading anime.</div>;
	}

	return (
		<div ref={ref}>
			{rowData && rowData.length > 0 ? (
				<Row
					isVertical={false}
					text={text}
					shows={showRank ? rowData.slice(0, 10) : rowData}
					type="anime"
					showRank={showRank}
				/>
			) : (
				<RowLoader withHeader />
			)}
		</div>
	);
};

export default AnimeRow;
