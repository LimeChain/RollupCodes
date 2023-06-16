import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'

const Loading = () => {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loading}></div>
            <Typography variant={Text.BODY2} fontWeight="400" marginTop={12}>
                Loading...
            </Typography>
        </div>
    )
}

export default Loading
