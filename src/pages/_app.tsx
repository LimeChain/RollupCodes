import '@styles/globals.scss'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { Inter, Chakra_Petch } from 'next/font/google'
import classNames from 'classnames'
import { MDXProvider } from '@mdx-js/react'
import MDXShortcodes from '@components/MDXShortcodes'

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
        <ThemeProvider attribute="class">
            <style jsx global>{`
                :root {
                    --font-chakra-petch: ${chakraPetch.style.fontFamily};
                }
                html {
                    font-family: ${inter.style.fontFamily};
                }
            `}</style>
            <MDXProvider components={MDXShortcodes}>
                <main className={classNames('main')}>
                    <Component {...pageProps} />
                </main>
            </MDXProvider>
        </ThemeProvider>
    )
}
