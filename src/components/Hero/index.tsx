import React from 'react'
import styles from './styles.module.scss'

interface IHero {
    children: React.ReactNode
}

const Hero = ({ children }: IHero) => {
    return (
        <div className={styles.hero} id="hero">
            {children}
        </div>
    )
}

export default Hero
