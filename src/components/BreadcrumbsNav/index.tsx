import useBreadcrumbs from '@hooks/useBreadcrumbs'
import { ICrumb, Text } from '@utils/types'
import Link from 'next/link'
import styles from './styles.module.scss'
import ChevronRightIcon from 'public/images/chevron-right-icon.svg'
import Typography from '@components/Typography'

const Crumb = ({ title, href, last = false }: ICrumb) => {
    // The last crumb is rendered as normal text since we are already on the page
    if (last) {
        return (
            <Typography fontWeight="400" variant={Text.BODY2}>
                {title}
            </Typography>
        )
    }

    // All other crumbs will be rendered as links that can be visited
    return (
        <Link href={href}>
            <Typography
                fontWeight="400"
                variant={Text.BODY2}
                color={'var(--neutral30'}
            >
                {title}
                <span className={styles.icon}>
                    <ChevronRightIcon />
                </span>
            </Typography>
        </Link>
    )
}

const Breadcrumbs = () => {
    const breadcrumbs = useBreadcrumbs()

    if (breadcrumbs?.length <= 1) {
        return null
    }

    return (
        <div className={styles.breadcrumbs}>
            {breadcrumbs?.map((crumb: ICrumb, index: number) => (
                <Crumb
                    key={`breadcrumb-${index}`}
                    {...crumb}
                    last={index === breadcrumbs?.length - 1}
                />
            ))}
        </div>
    )
}

export default Breadcrumbs
