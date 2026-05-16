import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const currentDate = new Date();

  const paths = [
    '',
    '/features',
    '/pricing',
    '/faq',
    '/blog',
    '/products',
    '/support',
  ];

  return paths.map((path, i) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: i === 0 ? 'daily' : 'weekly',
    priority: i === 0 ? 1 : 0.85,
  }));
}
