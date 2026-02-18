import classNames from 'classnames'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Button } from '@components/Button/Button'
import styles from './styles.module.scss'

interface InfoBannerProps {
    className?: string
}

const radialGlowStyle = {
    background: `radial-gradient(circle at 100% 100%,
        rgba(200, 242, 54, 1) 0%,
        rgba(150, 182, 41, 1) 10%,
        rgba(125, 151, 34, 1) 15%,
        rgba(100, 121, 27, 1) 20%,
        rgba(75, 91, 20, 1) 25%,
        rgba(50, 61, 14, 1) 30%,
        rgba(25, 30, 7, 1) 35%,
        rgba(13, 15, 3, 1) 40%,
        rgba(6, 8, 2, 1) 45%,
        rgba(0, 0, 0, 1) 50%)`,
}

export function InfoBanner({ className }: InfoBannerProps) {
    const { theme } = useTheme()

    return (
        <>
            {/* Desktop */}
            <section
                className={classNames(styles.bannerDesktop, className)}
                aria-labelledby="info-banner-title"
            >
                {/* Radial glow in bottom-right corner - only show in dark theme */}
                {theme === 'dark' && (
                    <div
                        className={styles.radialGlow}
                        style={radialGlowStyle}
                    />
                )}
                {/* Left Content */}
                <div className={styles.leftContent}>
                    {/* Text */}
                    <div className={styles.textContainer}>
                        <h3 id="info-banner-title" className={styles.title}>
                            Exit Hatch
                        </h3>
                        <p className={styles.description}>
                            Need to withdraw funds from an L2? RollupCodes now
                            provides a secure and easy way to move your assets
                            back to Ethereum mainnet, even if the rollup&apos;s
                            sequencer goes offline.
                        </p>
                    </div>

                    {/* Button */}
                    <Link href="/exit-hatch">
                        <Button
                            size="XL"
                            className={styles.buttonDesktop}
                            aria-label="Learn more about Exit Hatch"
                        >
                            Exit Hatch
                        </Button>
                    </Link>
                </div>

                {/* Right Content - Armadillo Image */}
                <div className={styles.imageContainer}>
                    <div className={styles.imageWrapper}>
                        <img
                              src={
                                theme === 'light'
                                    ? '/images/Tactical-Armadillo-Smaller.png'
                                    : '/images/Tactical-Armadillo-Smaller-Dark.png'
                            }
                            alt="Armadillo mascot"
                            className={styles.armadillo}
                        />
                    </div>
                </div>
            </section>

            {/* Mobile */}
            <section
                className={classNames(styles.bannerMobile, className)}
                aria-labelledby="info-banner-title-mobile"
            >
                {/* Radial glow in bottom-right corner - only show in dark theme */}
                {theme === 'dark' && (
                    <div
                        className={styles.radialGlowSmall}
                        style={radialGlowStyle}
                    />
                )}
                {/* Content */}
                <div className={styles.mobileContent}>
                    {/* Text */}
                    <div className={styles.textContainer}>
                        <h3
                            id="info-banner-title-mobile"
                            className={styles.title}
                        >
                            Exit Hatch
                        </h3>
                        <p className={styles.description}>
                            Need to withdraw funds from an L2? RollupCodes now
                            provides a secure and easy way to move your assets
                            back to Ethereum mainnet, even if the rollup&apos;s
                            sequencer goes offline.
                        </p>
                    </div>

                    {/* Button */}
                    <Link href="/exit-hatch">
                        <Button
                            size="XL"
                            className={styles.buttonMobile}
                            aria-label="Learn more about Exit Hatch"
                        >
                            Exit Hatch
                        </Button>
                    </Link>
                </div>

                {/* Armadillo Image */}
                <div className={styles.imageContainer}>
                    <div className={styles.imageWrapper}>
                        <img
                            src={
                                theme === 'light'
                                    ? '/images/Tactical-Armadillo-Smaller.png'
                                    : '/images/Tactical-Armadillo-Smaller-Dark.png'
                            }
                            alt="Armadillo mascot"
                            width={40}
                            height={40}
                            className={styles.armadillo}
                        />
                        <img
                            src={
                                theme === 'light'
                                    ? '/images/Tactical-Armadillo-Smaller.png'
                                    : '/images/Tactical-Armadillo-Smaller-Dark.png'
                            }
                            alt="Armadillo mascot"
                            className={styles.armadillo}
                        />
                    </div>
                </div>
            </section>
        </>
    )
}
