import Typography from '@components/Typography'
import { Text } from '@utils/types'
import Link from 'next/link'
import styles from './styles.module.scss'
import CloseIcon from '../../../public/images/close-icon.svg'
import classNames from 'classnames'
import { useCallback, useEffect, useState } from 'react'
import useScreenModes from '@hooks/useScreenModes'
const ExitHatchBanner = () => {
    const [isBannerHidden, setIsBannerHidden] = useState(false)

    const { isMobile } = useScreenModes()

    const handleCloseBanner = useCallback(() => {
        localStorage.setItem('exit_hatch_banner_hidden', 'true')
        setIsBannerHidden(true)
    }, [])

    useEffect(() => {
        const value = localStorage.getItem('exit_hatch_banner_hidden')
        setIsBannerHidden(value === 'true')
    }, [])

    return (
        <div
            className={classNames(styles.exit_hatch_banner_container, {
                [styles.hidden]: isBannerHidden,
            })}
        >
            <CloseIcon
                onClick={handleCloseBanner}
                style={{ cursor: 'pointer' }}
            />
            <Typography
                variant={Text[isMobile ? 'BODY4' : 'BODY2']}
                fontWeight="400"
                color="var(--neutral)"
                className={styles.exit_hatch_banner_text}
            >
                Need to exit an L2? RollupCodes now offers a secure way to withdraw your funds to Ethereum.
            </Typography>
            <Link
                href="/exit-hatch"
                className={styles.button}
            >
                <Typography
                    variant={Text[isMobile ? 'BODY4' : 'BODY2']}
                    fontWeight="700"
                    color={'var(--neutral100)'}
                >
                    Try Exit Hatch
                </Typography>
            </Link>
        </div>
    )
}

export default ExitHatchBanner
