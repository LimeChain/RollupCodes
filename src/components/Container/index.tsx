import React from 'react'
import styles from './styles.module.scss'

interface IContainer {
    children: React.ReactNode
}

const Container = ({ children }: IContainer): React.ReactElement => {
    return <div className={styles.container}>{children}</div>
}

export default Container
