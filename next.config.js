
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    outputFileTracingRoot: __dirname,
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        })

        return config
    },
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    }
}

module.exports = nextConfig
