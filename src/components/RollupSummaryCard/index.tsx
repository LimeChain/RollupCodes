import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { IRollupMeta, Text } from '@utils/types'
import Link from 'next/link'
import Avatar from '@components/Avatar'
import Label from '@components/Label'
import ArrowIcon from 'public/images/arrow-icon.svg'

const RollupSummaryCard = ({
    name,
    summary,
    badges,
}: IRollupMeta): React.ReactElement => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <Avatar name={name} />
            </div>
            <div className={styles.cardBody}>
                <Typography variant={Text.BODY1} fontWeight="400">
                    {summary}
                </Typography>
            </div>
            <div className={styles.cardFooter}>
                {badges?.map((badge: string, index: number) => (
                    <Label key={`label-${index}`} text={badge} />
                ))}
            </div>
            <Link
                href={{
                    pathname: `/details`,
                    query: { slug: name.toLowerCase().replace(' ', '-') },
                }}
                className={styles.link}
            >
                <Typography
                    variant={Text.BODY2}
                    fontWeight="700"
                    marginRight={7}
                >
                    Details
                </Typography>
                <ArrowIcon fill="var(--icon-color)" />
            </Link>
        </div>
    )
}

export default RollupSummaryCard
