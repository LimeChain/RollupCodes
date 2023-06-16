import styles from './styles.module.scss'

interface IGrid {
    children: React.ReactElement | React.ReactElement[] | undefined
}

const Grid = ({ children }: IGrid) => {
    return <div className={styles.grid}>{children}</div>
}

export default Grid
