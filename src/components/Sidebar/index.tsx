import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'
import Link from 'next/link'

interface ISidebar {
    items: string[]
}

const Sidebar = ({ items }: ISidebar) => {
    return (
        <div className={styles.sidebar}>
            {items?.map((item) => (
                <Link
                    key={item}
                    href={`/details?slug=optimism#${item
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    className={styles.sidebarItem}
                >
                    <Typography variant={Text.BODY2} fontWeight="700">
                        {item}
                    </Typography>
                </Link>
            ))}
        </div>
    )
}

export default Sidebar
