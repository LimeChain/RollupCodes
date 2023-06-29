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
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/images/favicon.ico" />
                <meta
                    property="twitter:image"
                    content="/images/thumbnail.png"
                />
                <meta property="twitter:card" content="summary_large_image" />
                <meta
                    property="twitter:title"
                    content="Rollup Codes: Interactive Reference of the Ethereum Rollup Ecosystem"
                />
                <meta
                    property="twitter:description"
                    content="A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />
                <title>Rollup Codes</title>
                <meta
                    property="description"
                    content="Rollup Codes: Interactive Reference of the Ethereum Rollup Ecosystem. A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />
                <meta
                    property="og:image"
                    content="/images/thumbnail.png"
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta
                    property="og:title"
                    content="Rollup Codes: Interactive Reference of the Ethereum Rollup Ecosystem"
                />
                <meta
                    property="og:description"
                    content="A comprehensive tool for developers to compare and and do in-depth analysis of the expanding Ethereum ecosystem"
                />
                {/* <meta property="og:url" content="" /> */}
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
