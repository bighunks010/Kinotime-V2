import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Episode, Show } from './types';

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
export async function fetchRecommendations(id: string, showType: string, type: string, page: number = 1) {
	try {
		const url = `https://api.themoviedb.org/3/${showType}/${id}/${type}?language=en-US&page=${page}`;
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

export async function fetchReviews(id: string, type: string, page: number = 1) {
	try {
		const url = `https://api.themoviedb.org/3/${type}/${id}/reviews?language=en-US&page=${page}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json',
			},
		});
		if (!response.ok) {
			console.error(`Failed to fetch reviews for ${type}/${id}:`, response.status);
			throw new Error(`Failed to fetch reviews: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('fetchReviews error:', error);
		throw error;
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
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				accept: 'application/json',
			},
		});
		if (!response.ok) throw new Error(`Failed to fetch season ${seasonNumber}`);
		const data = await response.json();
		if (data?.episodes) {
			return data.episodes;
		}
		throw new Error('No episodes data found in the response');
	} catch (error) {
		console.error('Error fetching season episodes:', error);
		throw error;
	}
};

/**
 * Fetch anime shows from TMDB using the discover endpoint.
 * Anime = Japanese language (ja) + Animation genre (16).
 */
export async function fetchAnimeShows(page: number = 1, sortBy: string = 'popularity.desc') {
	const headers = {
		Authorization: `Bearer ${getApiKey()}`,
		accept: 'application/json',
	};

	const queryParams = new URLSearchParams({
		include_adult: 'false',
		include_video: 'false',
		language: 'en-US',
		page: page.toString(),
		sort_by: sortBy,
		with_genres: '16',
		with_original_language: 'ja',
	});

	const url = `https://api.themoviedb.org/3/discover/tv?${queryParams.toString()}`;

	const res = await fetch(url, {
		headers,
		next: { revalidate: 60 * 60 * 6 }, // 6 hour cache
	});

	if (!res.ok) {
		throw new Error('Failed to fetch anime shows');
	}

	const data = await res.json();
	return data.results;
}

/**
 * Fetch anime by a specific sub-category (e.g. action anime, comedy anime).
 * Combines the anime base filter (ja + Animation) with an additional genre.
 */
export async function fetchAnimeByGenre(genreId: string, page: number = 1) {
	const headers = {
		Authorization: `Bearer ${getApiKey()}`,
		accept: 'application/json',
	};

	const queryParams = new URLSearchParams({
		include_adult: 'false',
		include_video: 'false',
		language: 'en-US',
		page: page.toString(),
		sort_by: 'popularity.desc',
		with_genres: `16,${genreId}`,
		with_original_language: 'ja',
	});

	const url = `https://api.themoviedb.org/3/discover/tv?${queryParams.toString()}`;

	const res = await fetch(url, { headers });

	if (!res.ok) {
		throw new Error('Failed to fetch anime by genre');
	}

	const data = await res.json();
	return data.results;
}
