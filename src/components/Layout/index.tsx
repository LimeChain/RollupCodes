import Footer from '@components/Footer'
import Nav from '@components/Nav'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useEffect, useState } from 'react'
import Loading from '@components/Loading'
import TopLeftCornerLight from '/public/images/top-left-corner-light.svg'
import BottomRightCornerLight from '/public/images/bottom-right-corner-light.svg'
import TopLeftCornerDark from '/public/images/top-left-corner-dark.svg'
import BottomRightCornerDark from '/public/images/bottom-right-corner-dark.svg'

import isDarkTheme from '@utils/isDarkTheme'

interface ILayout {
    children: React.ReactNode
    loading?: boolean
}

const Layout = ({ children, loading }: ILayout) => {
    const isDark = isDarkTheme()

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
