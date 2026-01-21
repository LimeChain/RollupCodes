import { Footer } from '@components/Footer'
import { Navbar } from '@components/Nav'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useBreadcrumbs from '@hooks/useBreadcrumbs'
import Loading from '@components/Loading'
import TopLeftCornerLight from '../../../public/images/top-left-corner-light.svg'
import BottomRightCornerLight from '../../../public/images/bottom-right-corner-light.svg'
import TopLeftCornerDark from '../../../public/images/top-left-corner-dark.svg'
import BottomRightCornerDark from '../../../public/images/bottom-right-corner-dark.svg'
import { ThemeMode } from '@utils/types'
import { useTheme } from 'next-themes'

interface ILayout {
    children: React.ReactNode
    loading?: boolean
    paddingTop?: number | undefined
}

const Layout = ({ children, loading, paddingTop }: ILayout) => {
    const { theme } = useTheme()
    const isDarkTheme = ThemeMode[ThemeMode.DARK].toLowerCase() === theme
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const activeLink = router.asPath.startsWith('/exit-hatch') ? 'exit-hatch' as const : 'rollups' as const
    const breadcrumbs = useBreadcrumbs()
    const rollupName = breadcrumbs.length > 1 && activeLink === 'rollups' ? breadcrumbs[breadcrumbs.length - 1].title : undefined

    const handleNavClick = useCallback((link: 'rollups' | 'exit-hatch') => {
        if (link === 'exit-hatch') {
            router.push('/exit-hatch')
        } else {
            router.push('/')
        }
    }, [router])
    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const topLeftShadow = isDarkTheme ? (
        <TopLeftCornerDark className={'topLeftShadow'} />
    ) : (
        <TopLeftCornerLight className={'topLeftShadow'} />
    )

    const bottomRightShadow = isDarkTheme ? (
        <BottomRightCornerDark className={'bottomRightShadow'} />
    ) : (
        <BottomRightCornerLight className={'bottomRightShadow'} />
    )

    return (
        <>
            {topLeftShadow}
            <Container>
                <Navbar activeLink={activeLink} onLinkClick={handleNavClick} rollupName={rollupName} />
                <div
                    className={styles.content}
                    style={{
                        paddingTop: `${128 + (paddingTop ? paddingTop : 0)}px`,
                    }}
                >
                    {loading ? <Loading /> : children}
                </div>
                <Footer />
            </Container>
            {bottomRightShadow}
        </>
    )
}

export default Layout
