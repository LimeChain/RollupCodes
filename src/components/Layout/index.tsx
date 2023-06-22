import Footer from '@components/Footer'
import Nav from '@components/Nav'
import useMetadata from '@hooks/useMetatdata'
import Head from 'next/head'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useEffect, useState } from 'react'
import Loading from '@components/Loading'
import TopLeftCornerLight from 'public/images/top-left-corner-light.svg'
import BottomRightCornerLight from 'public/images/bottom-right-corner-light.svg'
import TopLeftCornerDark from 'public/images/top-left-corner-dark.svg'
import BottomRightCornerDark from 'public/images/bottom-right-corner-dark.svg'
import { useTheme } from 'next-themes'
import { ThemeMode } from '@utils/types'

interface ILayout {
    children: React.ReactNode
    loading?: boolean
}

const Layout = ({ children, loading }: ILayout) => {
    const { title, description } = useMetadata()
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
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                {/* <link rel="icon" href="/favicon.ico" /> */}
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
