import Footer from '@components/Footer'
import Nav from '@components/Nav'
import useMetadata from '@hooks/useMetatdata'
import Head from 'next/head'
import styles from './styles.module.scss'
import Container from '@components/Container'
import { useEffect, useState } from 'react'
import Loading from '@components/Loading'
import TopLeftShadow from 'public/images/top-left-shadow.svg'
import BottomRightShadow from 'public/images/bottom-right-shadow.svg'

interface ILayout {
    children: React.ReactNode
    loading?: boolean
}

const Layout = ({ children, loading }: ILayout) => {
    const { title, description } = useMetadata()

    const [mounted, setMounted] = useState(false)
    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Loading />
    }

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
            {/* <TopLeftShadow className={'topLeftShadow'} /> */}
            <Container>
                <Nav />
                <div className={styles.content}>
                    {loading ? <Loading /> : children}
                </div>
                <Footer />
            </Container>
            {/* <BottomRightShadow className={'bottomRightShadow'} /> */}
        </>
    )
}

export default Layout
