/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { Command } from "cmdk";
import { Loader2 } from "lucide-react";
import { searchShows } from "@/lib/utils";
import { tmdbImage } from "@/lib/tmdb-image";
import useSearchStore from "@/store/recentsSearchStore";
import { Show, Anime } from "@/lib/types";

import {
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
export const SearchCommandBox = ({ children, searchType = 'tvshow' }: { children: any, searchType: "tvshow" | "anime" }) => {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const recentlySearched = useSearchStore((state) => state.recentlySearched);
    const addToRecentlySearched = useSearchStore((state) => state.addToRecentlySearched);

    const { data: searchResults, isFetching, error } = useQuery({
        queryKey: ["search", query, searchType],
        queryFn: async () => {
            if (searchType === "tvshow") {
                const results = await searchShows(query);
                return {
                    ...results,
                    results: results.results.filter((item: any) =>
                        item.media_type === "tv" || item.media_type === "movie"
                    )
                };
            }
            // Anime search not yet implemented
            return { results: [] };
        },
        enabled: query.trim().length > 0,
    });

    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setQuery(value.length >= 2 ? value : '');
        }, 750),
        []
    );

    const handleInputChange = (value: string) => {
        setInputValue(value);
        debouncedSearch(value);
    };

    const handleSelectShow = (show: Show | Anime) => {
        addToRecentlySearched(show);
        setOpen(false);
        setQuery('');
        setInputValue('');
    };

    
    const getFormattedDate = (item: { releaseDate?: string; first_air_date?: string; release_date?: string; }) => {
        const dateString = item.releaseDate || item.first_air_date || item.release_date;
        if (!dateString) return null;
        if (typeof dateString !== 'string') return null;
        if (/^\d{4}$/.test(dateString)) return dateString;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.getFullYear().toString();
    };

    const renderSearchResults = () => {
        if (isFetching) return <Command.Item>Loading <Loader2 className="w-4 h-4 animate-spin ml-1" /></Command.Item>;
        if (error) return <Command.Empty>Error: {(error as Error).message}</Command.Empty>;
        return (query ?
            <CommandGroup heading={`Search Results for ${query}`}>
                {searchResults?.results.map((item: any) => {
                    const show = {
                        id: item.id,
                        title: typeof ( item.name || item.title ) === 'string' ?  item.name || item.title || '' : (item.title?.userPreferred || item.title?.english || item.title?.romaji || 'Unknown Title'),
                        type: item.media_type || 'anime',
                        date: getFormattedDate(item),
                    };

                    return (
                        <CommandItem
                            key={show.id}
                            onSelect={() => handleSelectShow(item)}
                            value={show.title}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <Link
                                href={`/${show.type}/${show.id}${show.type === "tv" ? "?season=1&episode=1" : ""}`}
                                className="flex items-center gap-3 w-full"
                            >
                                {item.poster_path && (
                                    <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-secondary animate-pulse">
                                        <Image
                                            src={tmdbImage(item.poster_path, "w500")}
                                            alt={show.title}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjU2IiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                                            onLoadingComplete={(img) => {
                                                img.parentElement?.classList.remove('animate-pulse');
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {show.title} {show.date && `(${show.date})`}
                                    </span>
                                    <span
                                        className={`px-2 text-xs py-1 h-fit rounded flex-shrink-0 ${show.type === "tv" ? "bg-blue-100 text-blue-900" : show.type === "movie" ? "bg-secondary" : "bg-red-100 text-red-900"}`}
                                    >
                                        {show.type}
                                    </span>
                                </div>
                            </Link>
                        </CommandItem>

                    );
                })}
            </CommandGroup> : <CommandGroup heading={'Previous Searches'}>
                {recentlySearched.map((item: any) => {
                    const show = {
                        id: item.id,
                        title: typeof ( item.name || item.title ) === 'string' ?  item.name || item.title || '' : (item.title?.userPreferred || item.title?.english || item.title?.romaji || 'Unknown Title'),
                        type: item.media_type || 'anime',
                        date: getFormattedDate(item),
                    };
                    return (
                        <CommandItem
                            key={show.id}
                            onSelect={() => handleSelectShow(item)}
                            value={show.title}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <Link
                                href={`/${show.type}/${show.id}${show.type === "tv" ? "?season=1&episode=1" : ""}`}
                                className="flex items-center gap-3 w-full"
                            >
                                {item.poster_path && (
                                    <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-secondary animate-pulse">
                                        <Image
                                            src={tmdbImage(item.poster_path, "w500")}
                                            alt={show.title}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjU2IiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                                            onLoadingComplete={(img) => {
                                                img.parentElement?.classList.remove('animate-pulse');
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {show.title} {show.date && `(${show.date})`}
                                    </span>
                                    <span
                                        className={`px-2 text-xs py-1 h-fit rounded flex-shrink-0 ${show.type === "tv" ? "bg-blue-100 text-blue-900" : show.type === "movie" ? "bg-secondary" : "bg-red-100 text-red-900"}`}
                                    >
                                        {show.type}
                                    </span>
                                </div>
                            </Link>
                        </CommandItem>

                    );
                })}
            </CommandGroup>)
    };
    
    return (
        <>
            <Command>
                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput onValueChange={handleInputChange} value={inputValue} placeholder={`Search For ${searchType === 'anime' ? "Anime" : "Movies / TV show"}`} />
                    <CommandList>
                        {renderSearchResults()}
                    </CommandList>
                </CommandDialog >
                <div onClick={() => setOpen(true)} >{children}</div>
            </Command>
        </>
    );
};
