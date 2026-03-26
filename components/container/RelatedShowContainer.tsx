'use client';

import React, { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { fetchRecommendations } from '@/lib/utils';
import { Show } from '@/lib/types';
import ShowCard from '../common/Card';
import GridLoader from '../loading/GridLoader';
import { Loader2 } from 'lucide-react';

export default function RelatedShowsComponent(props: {
  show: any;
  type: string;
  relation: string;
}) {
  const { ref, inView } = useInView({ threshold: 0 });

  // Map 'anime' type to 'tv' for TMDB API calls
  const apiType = props.type === 'anime' ? 'tv' : props.type;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['recommendations', apiType, props.show.id, props.relation],
    queryFn: ({ pageParam = 1 }) =>
      fetchRecommendations(String(props.show.id), apiType, props.relation, pageParam),
    getNextPageParam: (lastPage: any) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  // Auto-fetch next page when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <GridLoader />;
  if (isError) return <div className="text-sm text-muted-foreground">Error loading recommendations.</div>;

  const allShows: Show[] =
    data?.pages.flatMap((page: any) => page.results) ?? [];

  if (allShows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No recommendations found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-2 gap-y-10 md:grid-cols-3">
        {allShows.map(
          (show: Show, index: number) =>
            show?.backdrop_path && (
              <ShowCard
                key={`${show.id}-${index}`}
                showRank={false}
                show={show}
                type={props.type}
                index={index}
                isVertical={true}
              />
            )
        )}
      </div>

      {/* Sentinel element for infinite scroll */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-6">
          {isFetchingNextPage ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="h-10" />
          )}
        </div>
      )}
    </div>
  );
}
