/**
 * Sidebar / route configuration.
 *
 * To add a new page:
 *   1. Drop an HTML partial into ./content/<slug>.html
 *   2. Add an entry below — `slug` matches the file name (no extension).
 *
 * That's it. The router handles the rest.
 */
export const NAV = [
  {
    heading: 'Start here',
    items: [
      { slug: 'home', title: 'Introduction' },
      { slug: 'getting-started', title: 'Quick start' },
      { slug: 'patterns', title: 'Patterns & examples' },
    ],
  },
  {
    heading: 'Core (runmq)',
    items: [
      { slug: 'connection', title: 'Connection & lifecycle' },
      { slug: 'processors', title: 'Processors' },
      { slug: 'publishing', title: 'Publishing' },
      { slug: 'advanced', title: 'Advanced features' },
    ],
  },
  {
    heading: 'NestJS (nestjs-runmq)',
    items: [
      { slug: 'nestjs', title: 'Getting started' },
      { slug: 'nestjs-processors', title: 'Decorators in depth' },
      { slug: 'nestjs-config', title: 'Async configuration' },
    ],
  },
  {
    heading: 'Reference',
    items: [
      { slug: 'benchmarks', title: 'Benchmarks' },
      { slug: 'api', title: 'API reference' },
      { slug: 'errors', title: 'Errors & lifecycle' },
    ],
  },
];

/** Build a flat list of routes for the router. */
export function flatRoutes() {
  return NAV.flatMap((g) => g.items);
}
