export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/search',
    '/map',
    '/companies',
    '/companies/:path*',
    '/settings',
    '/settings/:path*',
  ],
}
