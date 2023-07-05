import React, { forwardRef } from 'react'
import styles from './styles.module.scss'
import classNames from 'classnames'
import useScrollTo from '@hooks/useScrollTo'

interface IHero {
    children: React.ReactNode
}

const Hero = forwardRef(({ children }: IHero, ref: any) => {
    const scrolled = useScrollTo()

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
})

export default Hero
