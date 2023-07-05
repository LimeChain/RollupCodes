import { useEffect, useState } from 'react'

const useScrollTo = (position?: number): boolean => {
    const [done, setDone] = useState<boolean>(false)
    const scrollPosition = position || 0

    const handleScroll = () => {
        if (window.scrollY > scrollPosition) {
            setDone(true)
        } else {
            setDone(false)
        }
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return done
}

export default useScrollTo
