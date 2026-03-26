/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { SearchCommandBox } from '@/components/container/home-container/search-command-box';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

const categories = [
	{ title: 'Movies', href: '/movie' },
	{ title: 'TV', href: '/tv' },
	{ title: 'Anime', href: '/anime' },
];

export const Header = () => {
	const pathname = usePathname();
	const isActiveRoute = (href: string) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	return (
		<div
			className="sticky top-0 z-50 backdrop-blur-sm"
			style={{ backgroundColor: 'rgba(12, 12, 12, 0.5)' }}
		>
			<div className="flex items-center mx-auto max-w-7xl justify-between px-3 py-1 z-30">
				{/* Logo */}
				<Link
					key={'/'}
					className="cursor-pointer z-40 relative flex-shrink-0"
					href={'/'}
				>
					<motion.div
						className="flex items-center"
						transition={{ type: 'spring', stiffness: 300, damping: 20 }}
					>
						<img
							className="h-10 w-auto sm:h-10 md:h-12 object-contain"
							alt=""
							src="/Cinema.webp"
						/>
						<img
							className="h-10 w-auto sm:h-14 md:h-20 max-w-[200px] sm:max-w-[260px] md:max-w-[380px] object-contain"
							alt="Kinotime"
							src="/logo.webp"
						/>
					</motion.div>
				</Link>

				{/* Nav + Search */}
				<div className="flex items-center gap-2 sm:gap-4">
					{categories.map((el) => (
						<Link key={el.href} className="cursor-pointer z-40 relative" href={el.href}>
							<motion.div
								className={`flex items-center gap-1 h-10 border-b-2 px-1 text-sm sm:text-base ${
									isActiveRoute(el.href) ? 'text-primary' : 'border-transparent'
								}`}
								transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							>
								<span>{el.title}</span>
								{isActiveRoute(el.href) && (
									<motion.div
										className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
										layoutId="underline"
										initial={false}
										transition={{ type: 'spring', stiffness: 300, damping: 30 }}
									/>
								)}
							</motion.div>
						</Link>
					))}

					<SearchCommandBox searchType={isActiveRoute('/anime') ? 'anime' : 'tvshow'}>
						<div className="bg-primary cursor-pointer p-2 rounded-full hover:scale-95 duration-150 hover:bg-primary/80 flex-shrink-0">
							<MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
						</div>
					</SearchCommandBox>
				</div>
			</div>
		</div>
	);
};
