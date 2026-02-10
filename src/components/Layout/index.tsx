import { Footer } from '@components/Footer'
import { Navbar } from '@components/Nav'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import useBreadcrumbs from '@hooks/useBreadcrumbs'
import Loading from '@components/Loading'
import ExitHatchBanner from '@components/ExitHatchBanner'
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
    const [headerHeight, setHeaderHeight] = useState(128)
    const headerRef = useRef<HTMLElement>(null)
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

    // Measure header height and update CSS variable for Hero positioning
    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight
                setHeaderHeight(height)
                document.documentElement.style.setProperty('--header-height', `${height}px`)
            }
        }

        updateHeaderHeight()

        // Use MutationObserver to detect when banner is dismissed
        const observer = new MutationObserver(updateHeaderHeight)
        if (headerRef.current) {
            observer.observe(headerRef.current, { childList: true, subtree: true, attributes: true })
        }

        window.addEventListener('resize', updateHeaderHeight)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', updateHeaderHeight)
        }
    }, [mounted])

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

    const showExitHatchBanner = activeLink !== 'exit-hatch'

    return (
        <>
            <header ref={headerRef} className={styles.fixedHeader}>
                {showExitHatchBanner && <ExitHatchBanner />}
                <Container>
                    <Navbar activeLink={activeLink} onLinkClick={handleNavClick} rollupName={rollupName} />
                </Container>
            </header>
            {topLeftShadow}
            <Container>
                <div
                    className={styles.content}
                    style={{
                        paddingTop: `${headerHeight + (paddingTop ? paddingTop : 0)}px`,
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
