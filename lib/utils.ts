import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Episode, Show } from './types';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Centralized API key - always use environment variable
const getApiKey = () => {
	const token = process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN;
	if (!token) {
		throw new Error('NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN is not defined in environment variables');
	}
	return token;
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function fetchRowData(link: string) {
	try {
		const url = new URL(
			`https://api.themoviedb.org/3/${link}?language=en-US&include_adult=false&include_video=false`
		);
		const headers = {
			Authorization: `Bearer ${getApiKey()}`,
		};
		const response = await fetch(url.toString(), {
			headers,
			next: { revalidate: 60 * 60 * 24 * 7 },
		});
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();

		return data.results;
	} catch (error) {
		console.log(error);
	}
}
export function useRowData(link: string) {
	return useQuery({
		queryKey: ['rowData', link],
		queryFn: () => fetchRowData(link),
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
	});
}

export async function fetchDetails(id: string, type: string) {
	try {
		const url = new URL(
			`https://consumet-taupe-seven.vercel.app/meta/tmdb/info/${id}?type=${type}`
		);
		const response = await fetch(url.toString(), { cache: 'no-cache' });
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}
export async function fetchDetailsTMDB(id: string, type: string) {
	try {
		const url = `https://api.themoviedb.org/3/${type}/${id}`;
		const response = await fetch(url, { 
			cache: 'no-cache',
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json'
			}
		});
		if (!response.ok) {
			console.error(`TMDB API Error: ${response.status} ${response.statusText}`);
			throw new Error(`Failed to fetch data: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('fetchDetailsTMDB error:', error);
		throw error;
	}
}
export async function fetchRecommendations(id: string, showType: string, type: string) {
	try {
		const url = `https://api.themoviedb.org/3/${showType}/${id}/${type}?language=en-US&page=1`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json'
			}
		});
		if (!response.ok) {
			console.error(`Failed to fetch ${type} for ${showType}/${id}:`, response.status, response.statusText);
			throw new Error(`Failed to fetch data: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('fetchRecommendations error:', error);
		throw error;
	}
}
export async function fetchMovieLinks(movie: string, longID: string, callback: any) {
	try {
		const url = new URL(
			`https://consumet-taupe-seven.vercel.app/movies/flixhq/watch?episodeId=${movie}&mediaId=${longID}&server=vidcloud`
		);
		const response = await fetch(url.toString());
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();
		callback(null, data);
	} catch (error) {
		callback(error);
	}
}
export async function fetchsusflixLinks(movie: string) {
	try {
		const url = new URL(`https://susflix.tv/api/movie?id=${movie}`);
		const response = await fetch(url.href);
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function fetchShowData(endpoint: string) {
	const response = await fetch(
		`https://api.themoviedb.org/3/${endpoint}?language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&watch_region=US&page=1`,
		{ 
			next: { revalidate: 21600 },
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch data for ${endpoint}`);
	}

	const { results } = await response.json();
	return results;
}

export async function getNewAndPopularShows() {
	try {
		const topRatedTV = await fetchShowData('tv/top_rated');
		const topRatedMovie = await fetchShowData('movie/top_rated');
		const trendingMovie = await fetchShowData('trending/movie/week');
		const trendingTv = await fetchShowData('trending/tv/week');

		return {
			topRatedTV,
			topRatedMovie,
			trendingTv,
			trendingMovie,
		};
	} catch (error: any) {
		throw new Error('Failed to fetch shows: ' + error.message);
	}
}

export async function searchShows(query: string) {
	const res = await fetch(
		`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}`,
		{
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json'
			}
		}
	);

	if (!res.ok) {
		throw new Error('Failed to find shows');
	}

	const shows = (await res.json()) as { results: Show[] };

	const popularShows = shows.results.sort((a, b) => b.popularity - a.popularity);

	return {
		results: popularShows,
	};
}

export function formatRelativeTime(airDate: string): string {
	const now = new Date();
	const episodeDate = new Date(airDate);
	const timeDifference = episodeDate.getTime() - now.getTime();
	const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
	if (daysDifference > 1) {
		return `${daysDifference} days`;
	} else if (daysDifference === 1) {
		return '1 day';
	} else {
		const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
		if (hoursDifference >= 0) return `${hoursDifference} hours`;
		else return '';
	}
}

export async function fetchCarousalData(category: string, type: string) {
	try {
		const url = new URL(
			`https://api.themoviedb.org/3/${category}/${type}?language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`
		);
		const headers = {
			Authorization: `Bearer ${getApiKey()}`,
		};
		const response = await fetch(url.toString(), {
			headers,
			next: { revalidate: 60 * 60 * 24 * 7 },
		});
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await fetchShowData('tv/top_rated');
		console.log(data);
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function fetchGenres(type: string) {
	const headers = {
		Authorization: `Bearer ${getApiKey()}`,
	};
	const res = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?language=en`, {
		headers,
		next: { revalidate: 60 * 60 * 24 * 14 },
	});

	if (!res.ok) {
		throw new Error('Failed to find shows');
	}

	const genres = await res.json();
	return genres.genres;
}

export async function fetchGenreById(type: string, id: string, page: number = 1) {
	const headers = {
		Authorization: `Bearer ${getApiKey()}`,
	};

	const queryParams = new URLSearchParams({
		include_adult: 'true',
		include_video: 'false',
		language: 'en-US',
		page: page.toString(),
		sort_by: 'popularity.desc',
	});

	if (id) {
		queryParams.set('with_genres', id);
	}

	const url = `https://api.themoviedb.org/3/discover/${type}?${queryParams.toString()}`;

	const res = await fetch(url, { headers });

	if (!res.ok) {
		throw new Error('Failed to fetch shows');
	}

	const data = await res.json();
	return data.results;
}


export const fetchSeasonEpisodes = async (
	showId: string,
	seasonNumber: number
): Promise<Episode[]> => {
	try {
		const url = `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?language=en-US`;
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json'
			}
		});
		if (response.data && response.data.episodes) {
			return response.data.episodes;
		} else {
			throw new Error('No episodes data found in the response');
		}
	} catch (error) {
		console.error('Error fetching season episodes:', error);
		throw error;
	}
};
