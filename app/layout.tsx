import './globals.css';
import type { Metadata } from 'next';""

import { Toaster } from '@/components/ui/toaster';

import TanstackQueryProvider from '@/components/providers/TanstackQueryProvider';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Kinotime - Stream all the kino into your silly eyeballs KINO',
	description:
		'Kino tv and films inbound for your eyeballs.',
	keywords: ['streaming', 'movies', 'TV shows', 'entertainment', 'Kinotime'],
	authors: [{ name: 'Kinotime Team' }],
	creator: 'Kinolicious',
	publisher: 'Kinotime',
	openGraph: {
		title: 'Kinotime - Pure Cinema',
		description:
			'Non-stop entertainment. No limits. Just KINO.',
		url: 'https://www.kinotime.vercel.app',
		siteName: 'Kinotime',
		images: [
			{
			  url: "https://kinotime.vercel.app/kino2.png", 
			  width: 1600,
			  height: 1600,
			  alt: "Kinotime Preview",
			},
		  ],
		type: 'website',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/icon512_maskable.png"></link>
				<meta name="theme-color" content="#e63946" />
				<meta name="referrer" content="origin" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
				/>
			</head>
			<body>
					
					<TanstackQueryProvider>
						<Suspense>
							
						</Suspense>
						
						{children}
						<Toaster />
					</TanstackQueryProvider>
			
			</body>
		</html>
	);
}
