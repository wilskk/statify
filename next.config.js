/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Middleware-Preflight',
                        value: '1',
                    },
                ],
            },
        ];
    },

    // If you're using the app router, you might need these:
    experimental: {
        // ...other experimental options
        skipTrailingSlashRedirect: true,
        skipMiddlewareUrlNormalize: true,
    }
}

module.exports = nextConfig