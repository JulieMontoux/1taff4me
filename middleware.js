export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/search',
    '/map',
    '/companies/:path*',
    '/settings/:path*',
  ],
}
