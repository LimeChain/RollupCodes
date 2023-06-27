
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    serverRuntimeConfig: {
        APP_ROOT: __dirname,
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        })

        return config
    }
}

module.exports = nextConfig
