import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'
import Link from 'next/link'
import PlusIcon from '/public/images/plus-icon.svg'
import TwitterIcon from '/public/images/twitter-icon.svg'
import EmailIcon from '/public/images/email-icon.svg'
import LimeChainLogo from '/public/images/limechain-logo.svg'
import GithubIcon from '/public/images/github-icon.svg'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

const Footer = () => {
    const [lastModified, setLastModified] = useState<string>('')

    useEffect(() => {
        const getLastModifiedDate = async () => {
            const timestamp = window.localStorage.getItem(
                'last_deployment_check'
            )
            const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
            const NOW_IN_MS = +new Date()

            if (
                !timestamp ||
                +new Date(timestamp) + ONE_DAY_IN_MS < NOW_IN_MS
            ) {
                try {
                    const result = await fetch(
                        'https://api.github.com/repos/limechain/RollupCodes/commits/main'
                    )
                    const data = await result.json()

                    setLastModified(
                        format(
                            new Date(data?.commit?.author?.date),
                            'd LLL yyyy'
                        )
                    )
                    window.localStorage.setItem(
                        'last_deployment_check',
                        `${NOW_IN_MS}`
                    )
                } catch (_) {}
            }
        }

        getLastModifiedDate()
    }, [])

    return (
        <div className={styles.footer}>
            <div className={styles.group}>
                <Link
                    href="https://limechain.tech/"
                    target="_target"
                    className={styles.defaultButton}
                >
                    <Typography
                        variant={Text.BODY2}
                        fontWeight={'400'}
                        marginRight={5}
                    >
                        Made by
                    </Typography>
                    <LimeChainLogo fill="var(--icon-color)" />
                </Link>
                <div className={styles.pipe}>{'|'}</div>
                <div className={styles.socials}>
                    <Link
                        href={'https://twitter.com/LimeChainHQ'}
                        target="_target"
                        className={styles.link}
                    >
                        <TwitterIcon fill="var(--icon-color)" />
                    </Link>
                    <Link
                        href={'https://github.com/LimeChain/rollup-codes'}
                        target="_target"
                        className={styles.link}
                    >
                        <GithubIcon fill="var(--icon-color)" />
                    </Link>
                    <Link
                        href={'mailto:rollup.codes@limechain.tech'}
                        target="_target"
                        className={styles.link}
                    >
                        <EmailIcon fill="var(--icon-color)" />
                    </Link>
                </div>
                {lastModified && (
                    <>
                        <div className={styles.pipe}>{'|'}</div>
                        <Typography
                            variant={Text.BODY2}
                            fontWeight="400"
                            color={'var(--neutral50)'}
                        >
                            Last Updated {lastModified}
                        </Typography>
                    </>
                )}
            </div>
            <div className={styles.group}>
                <Link href="/privacy-policy">
                    <Typography variant={Text.BODY2} fontWeight="400">
                        Privacy Policy
                    </Typography>
                </Link>
                <div className={styles.pipe}>{'|'}</div>
                <Link
                    href="https://github.com/LimeChain/rollup-codes/blob/main/LICENSE"
                    target="_blank"
                    className={styles.defaultButton}
                >
                    <Typography variant={Text.BODY2} fontWeight="400">
                        Open-sourced under MIT license
                    </Typography>
                </Link>
                <div className={styles.pipe}>{'|'}</div>
                <Link
                    href="https://github.com/LimeChain/rollup-codes"
                    target="_blank"
                    className={styles.defaultButton}
                >
                    <Typography
                        variant={Text.BODY2}
                        fontWeight={'700'}
                        marginRight={4}
                    >
                        Contribute on Github
                    </Typography>
                    <PlusIcon fill="var(--icon-color)" />
                </Link>
            </div>
        </div>
    )
}

export default Footer
