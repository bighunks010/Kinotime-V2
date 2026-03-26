'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReviews } from '@/lib/utils';
import { Star, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { tmdbImage } from '@/lib/tmdb-image';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewAuthorDetails {
	name: string;
	username: string;
	avatar_path: string | null;
	rating: number | null;
}

interface Review {
	author: string;
	author_details: ReviewAuthorDetails;
	content: string;
	created_at: string;
	id: string;
	updated_at: string;
	url: string;
}

interface ReviewsResponse {
	id: number;
	page: number;
	results: Review[];
	total_pages: number;
	total_results: number;
}

function getAvatarUrl(avatarPath: string | null): string | null {
	if (!avatarPath) return null;
	// TMDB sometimes stores full URLs (starting with /http), handle both cases
	if (avatarPath.startsWith('/http')) {
		return avatarPath.slice(1);
	}
	return tmdbImage(avatarPath, 'w500');
}

function RatingStars({ rating }: { rating: number | null }) {
	if (rating === null || rating === undefined) return null;
	const stars = Math.round(rating / 2); // Convert 1-10 to 1-5 stars
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={i}
					className={`w-3.5 h-3.5 ${
						i < stars
							? 'fill-yellow-500 text-yellow-500'
							: 'text-muted-foreground/30'
					}`}
				/>
			))}
			<span className="text-xs text-muted-foreground ml-1">{rating}/10</span>
		</div>
	);
}

function ReviewCard({ review }: { review: Review }) {
	const [expanded, setExpanded] = useState(false);
	const isLong = review.content.length > 400;
	const displayContent =
		isLong && !expanded ? review.content.slice(0, 400) + '...' : review.content;
	const avatarUrl = getAvatarUrl(review.author_details.avatar_path);

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-lg border bg-card p-4 sm:p-5 space-y-3"
		>
			{/* Header: Avatar, Name, Date, Rating */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					{/* Avatar */}
					<div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
						{avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={avatarUrl}
								alt={review.author}
								className="w-full h-full object-cover"
							/>
						) : (
							<span className="text-sm font-bold text-muted-foreground">
								{review.author.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
					{/* Name + Date */}
					<div>
						<p className="font-semibold text-sm">{review.author_details.name || review.author}</p>
						<p className="text-xs text-muted-foreground">
							{format(new Date(review.created_at), 'MMM d, yyyy')}
						</p>
					</div>
				</div>
				{/* Rating */}
				{review.author_details.rating !== null && (
					<Badge variant="secondary" className="flex-shrink-0">
						<Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
						{review.author_details.rating}/10
					</Badge>
				)}
			</div>

			{/* Content */}
			<div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
				{displayContent}
			</div>

			{/* Expand/Collapse */}
			{isLong && (
				<button
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
				>
					{expanded ? (
						<>
							Show less <ChevronUp className="w-3.5 h-3.5" />
						</>
					) : (
						<>
							Read more <ChevronDown className="w-3.5 h-3.5" />
						</>
					)}
				</button>
			)}
		</motion.div>
	);
}

export default function ReviewsSection({
	showId,
	type,
}: {
	showId: string;
	type: string;
}) {
	const [page, setPage] = useState(1);

	const { data, isLoading, isError } = useQuery<ReviewsResponse>({
		queryKey: ['reviews', type, showId, page],
		queryFn: () => fetchReviews(showId, type, page),
		staleTime: 1000 * 60 * 60,
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="rounded-lg border bg-card p-5 space-y-3 animate-pulse"
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-muted" />
							<div className="space-y-2">
								<div className="h-4 w-24 bg-muted rounded" />
								<div className="h-3 w-16 bg-muted rounded" />
							</div>
						</div>
						<div className="space-y-2">
							<div className="h-3 w-full bg-muted rounded" />
							<div className="h-3 w-4/5 bg-muted rounded" />
							<div className="h-3 w-3/5 bg-muted rounded" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-sm text-muted-foreground">
				Unable to load reviews.
			</div>
		);
	}

	if (!data || data.results.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
				<p className="text-sm text-muted-foreground">No reviews yet for this title.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<AnimatePresence>
				{data.results.map((review) => (
					<ReviewCard key={review.id} review={review} />
				))}
			</AnimatePresence>

			{/* Pagination */}
			{data.total_pages > 1 && (
				<div className="flex items-center justify-center gap-3 pt-4">
					<Button
						variant="outline"
						size="sm"
						disabled={page === 1}
						onClick={() => setPage((p) => p - 1)}
					>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page} of {data.total_pages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= data.total_pages}
						onClick={() => setPage((p) => p + 1)}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
