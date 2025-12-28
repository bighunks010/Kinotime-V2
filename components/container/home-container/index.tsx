/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/common/header';
import RecentlyWatchedTV from '@/components/common/RecentlyWatched';
import WatchList from '@/components/common/WatchList';
import { Separator } from '@/components/ui/separator';
import MinimalSocialsFooter from '@/components/common/Footer';
import { fetchGenres } from "@/lib/utils";
import GenresPage from '../Genre';
import FetchAndRenderRow from "@/components/container/FetchAndRenderRow";


export default function HomeContainer() {
	
	return (
				
		
		(

			<div className="">

			
				<div className="mx-auto max-w-9xl space-y-4 px-4 lg:px-0">

					<Separator className="my-5" />

					<div className=" w-full">
						<div className=" space-y-4 w-full">
							<RecentlyWatchedTV />
							<WatchList type="movie" />
							<WatchList type="tv" />
						</div>
					</div>

					<FetchAndRenderRow
						apiEndpoint="trending/movie/week"
						text="Popular Trending Movies"
						showRank={false}
						type="movie"
					/>


					<FetchAndRenderRow
						apiEndpoint="trending/tv/week"
						text="Popular Trending TV Shows"
						showRank={false}
						type="tv"
					/>

					<FetchAndRenderRow
						apiEndpoint="movie/top_rated"
						text="All Time Top Rated Movies"
						showRank={true}
						type="movie"
					/>

					<FetchAndRenderRow
						apiEndpoint="tv/1396/recommendations"
						text="All Time Most Popular Shows"
						showRank={true}
						type="tv"
					/>

					<FetchAndRenderRow
						apiEndpoint="tv/1399/recommendations"
						text="Shows Similar to Game of Thrones"
						showRank={true}
						type="tv"
					/>

					<FetchAndRenderRow
						apiEndpoint="tv/top_rated"
						text="People Shouldn't be allowed to rank things"
						showRank={true}
						type="tv"
					/>


					<Suspense>
						<GenresPage />
					</Suspense>
				</div>
				<MinimalSocialsFooter />
			
			</div>
		)
	);
}
