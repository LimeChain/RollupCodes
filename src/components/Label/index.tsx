import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Text } from '@utils/types'

interface ILabel {
    text: string
    color: string
}

const Label = ({ text, color }: ILabel) => {
    return (
        <div className={styles.label} style={{ background: `${color}` }}>
            <Typography variant={Text.BODY2} fontWeight="700">
                {text}
            </Typography>
        </div>
    )
}

export default Label
