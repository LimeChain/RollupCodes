import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Font, Text } from '@utils/types'
import styles from '@styles/error.module.scss'

export default function Custom500() {
    return (
        <Layout>
            <div className={styles.centered}>
                <Typography
                    variant={Text.BODY2}
                    fontWeight="700"
                    fontSize="92px"
                    font={Font.ChakraPetch}
                >
                    500
                </Typography>
                <Typography variant={Text.BODY2} fontWeight="400">
                    Internal Server Error
                </Typography>
            </div>
        </Layout>
    )
}
