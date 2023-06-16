import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'

interface ILabel {
    text: string
}

const Label = ({ text }: ILabel) => {
    return (
        <div className={styles.label}>
            <Typography
                variant={Text.BODY2}
                fontWeight="700"
                color="var(--opposite-text-color)"
            >
                {text}
            </Typography>
        </div>
    )
}

export default Label
