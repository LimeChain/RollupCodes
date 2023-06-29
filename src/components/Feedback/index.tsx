import Typography from '@components/Typography'
import styles from './styles.module.scss'
import Link from 'next/link'
import { Text, ThemeMode } from '@utils/types'
import { useTheme } from 'next-themes'

const Feedback = () => {
    const { theme } = useTheme()

    return (
        <div className={styles.container}>
            <Typography variant={Text.BODY1} fontWeight="700" marginBottom={8}>
                Found a discrepancy?
            </Typography>
            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={32}
                textAlign="center"
                color={
                    theme === ThemeMode[ThemeMode.DARK].toLowerCase()
                        ? 'var(--neutral30)'
                        : 'var(--neutral70)'
                }
            >
                We strive for accuracy, but as Rollup technologies evolve, there
                may be mismatches between our content and current
                implementations.
            </Typography>
            <Link
                href="https://github.com/LimeChain/RollupCodes/issues/new"
                target="_blank"
                className={styles.button}
            >
                <Typography
                    variant={Text.BODY2}
                    fontWeight="700"
                    color={'var(--neutral100)'}
                >
                    Report an Issue
                </Typography>
            </Link>
        </div>
    )
}

export default Feedback
