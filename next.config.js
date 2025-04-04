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
    async redirects() {
        return [
            {
                source: '/data',
                destination: '/dashboard/data',
                permanent: true,
            },
            {
                source: '/data/:path*',
                destination: '/dashboard/data/:path*',
                permanent: true,
            },
            {
                source: '/result',
                destination: '/dashboard/result',
                permanent: true,
            },
            {
                source: '/results',
                destination: '/dashboard/results',
                permanent: true,
            },
            {
                source: '/variables',
                destination: '/dashboard/variables',
                permanent: true,
            }
        ];
    },
}

module.exports = nextConfig