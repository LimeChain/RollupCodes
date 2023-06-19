import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'
import Link from 'next/link'

const Sidebar = () => {
    return (
        <div className={styles.sidebar}>
            <Link href={'#overview'} className={styles.sidebarItem}>
                <Typography variant={Text.BODY2} fontWeight="700">
                    Overview
                </Typography>
            </Link>
            <Link href={'#general'} className={styles.sidebarItem}>
                <Typography variant={Text.BODY2} fontWeight="700">
                    General
                </Typography>
            </Link>
        </div>
    )
}

export default Sidebar
