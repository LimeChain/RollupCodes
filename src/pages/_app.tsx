import '@styles/globals.scss'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { Inter, Chakra_Petch, Roboto_Mono } from 'next/font/google'
import classNames from 'classnames'
import Head from 'next/head'

const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    style: 'normal',
    weight: ['100', '200', '300', '400', '500', '600', '700'],
    variable: '--font-roboto-mono',
})

const chakraPetch = Chakra_Petch({
    subsets: ['latin'],
    style: 'normal',
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-chakra-petch',
})

const inter = Inter({
    subsets: ['latin'],
    style: 'normal',
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-inter',
})

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            themes={['light', 'dark']}
        >
            <Head>
                <link rel="icon" href="/images/favicon.ico" />

                <title>RollupCodes</title>
                <meta
                    name="description"
                    content="Rollup Codes: Interactive Reference of the Ethereum Rollup Ecosystem. A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />

                <meta
                    property="og:url"
                    content="https://rollup.codes"
                    key="ogurl"
                />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="RollupCodes: Interactive Reference of the Ethereum Rollup Ecosystem"
                    key="ogtitle"
                />
                <meta
                    property="og:description"
                    content="A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                    key="ogdesc"
                />
                <meta
                    property="og:image"
                    content="/images/thumbnail.png"
                    key="ogimage"
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />

                <meta name="twitter:card" content="summary" key="twcard" />
                {/*
                <meta name="twitter:card" content="summary_large_image" />
                <meta property="twitter:domain" content="rollup.codes" />
                <meta property="twitter:url" content="https://rollup.codes" />
                <meta
                    name="twitter:title"
                    content="RollupCodes: Interactive Reference of the Ethereum Rollup Ecosystem"
                />
                <meta
                    name="twitter:description"
                    content="A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />
                <meta
                    name="twitter:image"
                    content='images/thumbnail.png'
                /> */}

                <meta name="robots" content="index, follow" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <script src="/js/googleAnalytics.js" async />
            </Head>
            <style jsx global>{`
                :root {
                    --font-chakra-petch: ${chakraPetch.style.fontFamily};
                    --font-roboto-mono: ${robotoMono.style.fontFamily};
                }
                html {
                    font-family: ${inter.style.fontFamily};
                }
            `}</style>
            <main className={classNames('main')}>
                <Component {...pageProps} />
            </main>
        </ThemeProvider>
    )
}
