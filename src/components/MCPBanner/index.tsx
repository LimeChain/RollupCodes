import Typography from '@components/Typography'
import { Text } from '@utils/types'
import Link from 'next/link'
import styles from './styles.module.scss'
import CloseIcon from '../../../public/images/close-icon.svg'
import classNames from 'classnames'
import { useCallback, useEffect, useState } from 'react'
import useScreenModes from '@hooks/useScreenModes'
const MCPBanner = () => {
    const [isBannerHidden, setIsBannerHidden] = useState(false)

    const { isMobile } = useScreenModes()

    const handleCloseBanner = useCallback(() => {
        localStorage.setItem('mcp_banner_hidden', 'true')
        setIsBannerHidden(true)
    }, [])

    useEffect(() => {
        const value = localStorage.getItem('mcp_banner_hidden')
        setIsBannerHidden(value === 'true')
    }, [])

    return (
        <div
            className={classNames(styles.mcp_banner_container, {
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
                className={styles.mcp_banner_text}
            >
                RollupCodes now has its own MCP server that feeds your favorite
                AI with the latest L2 development knowledge!
            </Typography>
            <Link
                href="https://github.com/LimeChain/rollup-codes-mcp"
                target="_blank"
                className={styles.button}
            >
                <Typography
                    variant={Text[isMobile ? 'BODY4' : 'BODY2']}
                    fontWeight="700"
                    color={'var(--neutral100)'}
                >
                    Get MCP
                </Typography>
            </Link>
        </div>
    )
}

export default MCPBanner
