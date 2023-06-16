import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Text } from '@utils/types'
import NotFoundIcon from 'public/images/not-found-icon.svg'
import styles from '@styles/error.module.scss'

export default function Custom404() {
    return (
        <Layout>
            <div className={styles.centered}>
                <div className={styles.row}>
                    <NotFoundIcon fill="var(--icon-color)" />
                    <div className={styles.number}>404</div>
                </div>
                <Typography
                    variant={Text.BODY2}
                    fontWeight="400"
                    marginTop={33}
                >
                    The link you are searching cannot be found.
                </Typography>
            </div>
        </Layout>
    )
}
