import { useEffect, useState } from 'react'

interface IScreenModes {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
}

const useScreenModes = (): IScreenModes => {
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [isTablet, setIsTablet] = useState<boolean>(false)
    const [isDesktop, setIsDesktop] = useState<boolean>(false)
    const [width, setWidth] = useState<number>(0)

    const handleResize = (event: any) => {
        setWidth(event?.target.innerWidth)
    }

    useEffect(() => {
        if (width < 768) {
            setIsTablet(false)
            setIsDesktop(false)
            setIsMobile(true)
        } else if (width < 1024) {
            setIsTablet(true)
            setIsDesktop(false)
            setIsMobile(false)
        } else {
            setIsTablet(false)
            setIsDesktop(true)
            setIsMobile(false)
        }
    }, [width])

    useEffect(() => {
        setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return {
        isMobile,
        isTablet,
        isDesktop,
    }
}

export default useScreenModes
