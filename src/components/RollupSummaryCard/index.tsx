import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { IDocMeta, Text } from '@utils/types'
import Link from 'next/link'
import Avatar from '@components/Avatar'
import ArrowIcon from '../../../public/images/arrow-icon.svg'
import Labels from '@components/Labels'

const RollupSummaryCard = ({
    title,
    lightLogo,
    darkLogo,
    subtitle,
    slug,
    labels,
}: IDocMeta): React.ReactElement => (
    <Link href={`${slug}`} className={styles.card}>
        <div className={styles.cardHeader}>
            <Avatar lightLogo={lightLogo} darkLogo={darkLogo} name={title} />
        </div>
        <div className={styles.cardBody}>
            <Typography variant={Text.BODY2} fontWeight="400">
                {subtitle}
            </Typography>
        </div>
        <div className={styles.cardFooter}>
            <Labels labels={labels} title={title} />
        </div>
        <div className={styles.link}>
            <Typography variant={Text.BODY2} fontWeight="700" marginRight={7}>
                Details
            </Typography>
            <ArrowIcon fill="var(--icon-color)" />
        </div>
    </Link>
)

export default RollupSummaryCard
