/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.module.rules.push({
                test: /\.worker\.(js|ts)$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        filename: 'static/[hash].worker.js',
                        publicPath: '/_next/',
                    }
                },
            });
        }

        config.output.globalObject = 'self';

        return config;
    },
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