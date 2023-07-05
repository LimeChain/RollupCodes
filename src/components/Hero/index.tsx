import React, { useEffect, useRef } from 'react'
import styles from './styles.module.scss'
import classNames from 'classnames'
import useScrollTo from '@hooks/useScrollTo'

interface IHero {
    children: React.ReactNode
    getHeight?: (height: number | undefined) => void
}

const Hero = ({ children, getHeight }: IHero) => {
    const ref = useRef<HTMLDivElement>(null)
    const scrolled = useScrollTo()

    useEffect(() => {
        if (ref && ref.current) {
            getHeight && getHeight(ref?.current?.offsetHeight)
        }
    }, [getHeight])

    return (
        <div
            className={classNames(styles.container, {
                [styles.bg]: scrolled,
            })}
        >
            <div className={styles.hero} id="hero" ref={ref}>
                {children}
            </div>
        </div>
    )
}

export default Hero
