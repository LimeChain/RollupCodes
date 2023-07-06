import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'
import Link from 'next/link'
import PlusIcon from '/public/images/plus-icon.svg'
import TwitterIcon from '/public/images/twitter-icon.svg'
import EmailIcon from '/public/images/email-icon.svg'
import LimeChainLogo from '/public/images/limechain-logo.svg'
import GithubIcon from '/public/images/github-icon.svg'
import useLastModifiedDate from '@hooks/useLastModifiedDate'

const Footer = () => {
    const lastModifiedDate = useLastModifiedDate()

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
                {lastModifiedDate && (
                    <>
                        <div className={styles.pipe}>{'|'}</div>
                        <Typography
                            variant={Text.BODY2}
                            fontWeight="400"
                            color={'var(--neutral50)'}
                        >
                            Last Updated {lastModifiedDate}
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
