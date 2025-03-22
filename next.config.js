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
}

module.exports = nextConfig