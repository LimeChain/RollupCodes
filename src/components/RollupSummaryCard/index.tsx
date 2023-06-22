import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { IDocMeta, Text } from '@utils/types'
import Link from 'next/link'
import Avatar from '@components/Avatar'
import Label from '@components/Label'
import ArrowIcon from 'public/images/arrow-icon.svg'

const RollupSummaryCard = ({
    title,
    logo,
    subtitle,
    slug,
    labels,
}: IDocMeta): React.ReactElement => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <Avatar src={logo} name={title} />
            </div>
            <div className={styles.cardBody}>
                <Typography variant={Text.BODY1} fontWeight="400">
                    {subtitle}
                </Typography>
            </div>
            <div className={styles.cardFooter}>
                {labels?.map((label: string, index: number) => (
                    <Label
                        key={`label-${index}`}
                        text={label}
                        color={`var(--label-color-${index + 1})`}
                    />
                ))}
            </div>
            <Link href={`details/${slug}`} className={styles.link}>
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
