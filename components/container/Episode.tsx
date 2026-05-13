'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import useVideoSourceStore from '@/store/videoSourceStore';
import useAnimeStore from '@/store/animeStore';
import { getMegaPlayUrl, resolveAnimeEpisode } from '@/lib/anime';


interface EpisodeProps {
	episodeId: string;
	id: string;
	movieID?: any;
	type: string;
	episodeNumber?: any;
	seasonNumber?: any;
	getNextEp?: (season: any, episode: any) => void;
}

export default function Episode(props: EpisodeProps) {
	const { id, type, seasonNumber, episodeNumber, getNextEp } = props;

	const iframeRef = useRef<HTMLIFrameElement>(null);

	// Anime store
	const isAnime = useAnimeStore((state) => state.isAnime);
	const animeLang = useAnimeStore((state) => state.animeLang);
	const setAnimeLang = useAnimeStore((state) => state.setAnimeLang);
	const malId = useAnimeStore((state) => state.malId);
	const franchise = useAnimeStore((state) => state.franchise);
	const tmdbSeasonEpCounts = useAnimeStore((state) => state.tmdbSeasonEpCounts);
	const useAbsoluteEp = useAnimeStore((state) => state.useAbsoluteEp);

	// Resolve the correct MAL ID + episode number.
	// Three paths:
	//  1. Absolute mode  — collapse TMDB seasons into one number (One Piece, Naruto, etc.)
	//  2. Franchise mode — walk the sequel chain to find the right MAL entry (JoJo, etc.)
	//  3. Fallback       — use raw malId + episodeNumber (before data loads)
	const resolved = useMemo(() => {
		if (!isAnime) return null;

		// ── Absolute mode ────────────────────────────────────────────
		// For long-runners (One Piece, Naruto, DBZ, etc.) TMDB already uses
		// absolute episode numbers within each season (e.g. Season 10 starts
		// at episode_number 337, not 1). Just pass it straight through.
		if (useAbsoluteEp && malId) {
			return { malId, episode: Number(episodeNumber || 1) };
		}

		// ── Franchise mode ───────────────────────────────────────────
		if (franchise.length > 0) {
			return resolveAnimeEpisode(
				franchise,
				Number(seasonNumber || 1),
				Number(episodeNumber || 1),
				tmdbSeasonEpCounts
			);
		}

		// ── Fallback ─────────────────────────────────────────────────
		if (malId) {
			return { malId, episode: Number(episodeNumber || 1) };
		}

		return null;
	}, [isAnime, useAbsoluteEp, franchise, malId, seasonNumber, episodeNumber, tmdbSeasonEpCounts]);

	const generateUrl = (
		domain: string,
		type: string,
		id: string,
		seasonNumber: string,
		episodeNumber: string
	) => {
		return type === 'movie'
			? `https://${domain}/embed/${type}/${id}`
			: `https://${domain}/embed/${type}?tmdb=${id}&season=${seasonNumber}&episode=${episodeNumber}&autoplay=1&autonext=1`
	};

	const sourcesMap = useMemo(() => {
		// MegaPlay anime source — uses franchise-resolved MAL ID + episode
		const megaplaySources = isAnime && resolved
			? [{
				name: 'megaplay',
				label: 'MegaPlay (Anime)',
				ads: 'false',
				url: getMegaPlayUrl(
					resolved.malId,
					type === 'movie' ? 1 : resolved.episode,
					animeLang
				),
			}]
			: [];

		return [
			...megaplaySources,
			{
				name: 'vidsrcme.su',
				label: 'VIDSRC',
				position: 5,
				url: generateUrl('vidsrcme.su', type, id, seasonNumber, episodeNumber),
			},
			{
				name: 'vidlink',
				label: 'VidLink',
				ads: 'false',
				url:
					type === 'movie'
						? `https://vidlink.pro/movie/${id}`
						: `https://vidlink.pro/tv/${id}/${seasonNumber}/${episodeNumber}?title=true`,
			},
	
			{
				name: 'filmu',
				label: 'FilmU',
				ads: 'false',
				url:
					type === 'movie'
						? `https://embed.filmu.in/movie/${id}`
						: `https://embed.filmu.in/tv/${id}/${seasonNumber}/${episodeNumber}`,
			},

			{
				name: 'SmashyStream',
				label: 'SmashyStream',
				ads: 'false',
				url:
					type === 'movie'
						? `https://player.smashy.stream/movie/${id}`
						: `https://player.smashy.stream/tv/${id}?s=${seasonNumber}&e=${episodeNumber}`,
			},
			{
				name: 'AutoEmbe',
				label: 'FilmL',
				ads: 'false',
				url:
					type === 'movie'
						? `https://player.autoembed.cc/embed/movie/${id}`
						: `https://player.smashy.stream/tv/${id}?s=${seasonNumber}&e=${episodeNumber}`,
			},
		];
	}, [isAnime, resolved, animeLang, type, id, seasonNumber, episodeNumber]);

	// Use Zustand store for persistent source selection
	const selectedSource = useVideoSourceStore((state) => state.selectedSource);
	const setSelectedSource = useVideoSourceStore((state) => state.setSelectedSource);

	// Find the provider based on stored selection, fallback to first source
	const [provider, setProvider] = useState(() => {
		// For anime, default to MegaPlay if available
		if (isAnime && resolved) {
			const megaplay = sourcesMap.find((s) => s.name === 'megaplay');
			if (megaplay) return megaplay;
		}
		const savedProvider = sourcesMap.find((source) => source.name === selectedSource);
		return savedProvider || sourcesMap[0];
	});

	// Auto-select MegaPlay when franchise data (resolved) becomes available
	useEffect(() => {
		if (isAnime && resolved) {
			const megaplay = sourcesMap.find((s) => s.name === 'megaplay');
			if (megaplay) {
				setProvider(megaplay);
				setSelectedSource('megaplay');
			}
		}
	}, [resolved]);

	// When animeLang (sub/dub) changes, update the MegaPlay URL if it's the active provider
	useEffect(() => {
		if (provider.name === 'megaplay' && isAnime && resolved) {
			setProvider((prev) => ({
				...prev,
				url: getMegaPlayUrl(
					resolved.malId,
					type === 'movie' ? 1 : resolved.episode,
					animeLang
				),
			}));
		}
	}, [animeLang, resolved]);

	const handleSelectOnChange = (value: string) => {
		const selectedProvider = sourcesMap.find((source) => source.name === value);
		if (selectedProvider) {
			setProvider(selectedProvider);
			setSelectedSource(selectedProvider.name); // Persist to localStorage
		}
	};

	useEffect(() => {
		const handleIframeLoad = () => {
			if (iframeRef.current) {
				try {
					const iframeWindow = iframeRef.current.contentWindow;
					if (iframeWindow) {
						iframeWindow.onbeforeunload = (e: BeforeUnloadEvent) => {
							e.preventDefault();
						};
					}
				} catch (error) {
					console.error('Error setting up iframe redirect prevention:', error);
				}
			}
		};

		if (iframeRef.current) {
			iframeRef.current.addEventListener('load', handleIframeLoad);
		}
	}, [provider]);

	return (
		<div id="episode-player" className="">
			<div className="flex items-center justify-between mb-2 gap-2">
				{/* Source selector */}
				<Select
					value={provider.name}
					onValueChange={handleSelectOnChange}
				>
					<SelectTrigger className="w-fit h-12 ">
						<Settings className="w-6 h-6 p-1 mr-2" />
						<SelectValue>
							<div className="pr-10">{provider.label}</div>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{sourcesMap.map((source, index) => (
							<SelectItem value={source.name} key={index}>
								<div className="mx-1 flex gap-2">{source.label}</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Sub/Dub toggle — only shown for anime */}
				{isAnime && (
					<div className="flex items-center rounded-lg border border-border overflow-hidden">
						<button
							onClick={() => setAnimeLang('sub')}
							className={`px-3 py-2 text-sm font-medium transition-colors ${
								animeLang === 'sub'
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-muted-foreground hover:bg-muted'
							}`}
						>
							SUB
						</button>
						<button
							onClick={() => setAnimeLang('dub')}
							className={`px-3 py-2 text-sm font-medium transition-colors ${
								animeLang === 'dub'
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-muted-foreground hover:bg-muted'
							}`}
						>
							DUB
						</button>
					</div>
				)}

				{/* Next episode button */}
				{getNextEp && type === 'tv' && (
					<Button
						className="flex gap-2"
						variant={'ghost'}
						onClick={() => getNextEp(seasonNumber, episodeNumber)}
					>
						Next{' '}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill="currentColor"
								d="M20.095 21a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 1 1.5 0v16.5a.74.74 0 0 1-.75.75m-3.4-9.589a2.25 2.25 0 0 1-.85 1.82l-9.11 7.09c-.326.247-.713.4-1.12.44h-.23a2.14 2.14 0 0 1-1-.22a2.2 2.2 0 0 1-.9-.81a2.17 2.17 0 0 1-.33-1.16V5.421a2.2 2.2 0 0 1 .31-1.12a2.25 2.25 0 0 1 .85-.8a2.18 2.18 0 0 1 2.24.1l9.12 6.08c.29.191.53.448.7.75a2.3 2.3 0 0 1 .32.98"
							/>
						</svg>
					</Button>
				)}
			</div>
			<iframe
				key={provider.url}
				ref={iframeRef}
				allowFullScreen
				className="w-full h-full border-primary border rounded-lg aspect-video font-mono"
				src={provider.url}
			/>
		</div>
	);
}
