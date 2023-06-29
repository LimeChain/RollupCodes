import Footer from '@components/Footer'
import Nav from '@components/Nav'
import Head from 'next/head'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useEffect, useState } from 'react'
import Loading from '@components/Loading'
import TopLeftCornerLight from '/public/images/top-left-corner-light.svg'
import BottomRightCornerLight from '/public/images/bottom-right-corner-light.svg'
import TopLeftCornerDark from '/public/images/top-left-corner-dark.svg'
import BottomRightCornerDark from '/public/images/bottom-right-corner-dark.svg'
import { useTheme } from 'next-themes'
import { ThemeMode } from '@utils/types'

interface ILayout {
    children: React.ReactNode
    loading?: boolean
}

const Layout = ({ children, loading }: ILayout) => {
    const { theme } = useTheme()
    const isDark = Boolean(theme === ThemeMode[ThemeMode.DARK])

    const [mounted, setMounted] = useState(false)
    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const topLeftShadow = isDark ? (
        <TopLeftCornerDark className={'topLeftShadow'} />
    ) : (
        <TopLeftCornerLight className={'topLeftShadow'} />
    )

    const bottomRightShadow = isDark ? (
        <BottomRightCornerDark className={'bottomRightShadow'} />
    ) : (
        <BottomRightCornerLight className={'bottomRightShadow'} />
    )

    return (
        <>
            <Head>
                <link rel="icon" href="/images/favicon.ico" />

                <title>RollupCodes</title>
                <meta
                    name="description"
                    content="Rollup Codes: Interactive Reference of the Ethereum Rollup Ecosystem. A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />

                <meta property="og:url" content="https://rollup.codes" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="RollupCodes: Interactive Reference of the Ethereum Rollup Ecosystem"
                />
                <meta
                    property="og:description"
                    content="A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />
                <meta
                    property="og:image"
                    content={`${window.location.origin}/images/thumbnail.png`}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />

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
                    content={`${window.location.origin}/images/thumbnail.png`}
                />

                <meta name="robots" content="index, follow" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <script src="/js/googleAnalytics.js" async />
            </Head>
            {topLeftShadow}
            <Container>
                <Nav />
                <div className={styles.content}>
                    {loading ? <Loading /> : children}
                </div>
                <Footer />
            </Container>
            {bottomRightShadow}
        </>
    )
}

export default Layout
