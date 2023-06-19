import { useRef, useState } from 'react'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import PlusIcon from 'public/images/plus-gradient-icon.svg'
import MinusIcon from 'public/images/minus-gradient-icon.svg'
import classNames from 'classnames'

interface ICollapse {
    title: string
    id: string
    children: React.ReactNode
    border?: boolean
}

const Collapse = ({ title, children, border = true, id }: ICollapse) => {
    const [isExpanded, setExpanded] = useState<boolean>(false)
    const ref = useRef<any>(0)

    const toggle = () => setExpanded((prev) => !prev)

    return (
        <div
            className={classNames(styles.collapse, { [styles.border]: border })}
            id={id}
        >
            <div onClick={toggle} className={styles.button}>
                <Typography variant={Headings.H4} fontWeight={'700'}>
                    {title}
                </Typography>
                {isExpanded ? <MinusIcon /> : <PlusIcon />}
            </div>
            <div
                ref={ref}
                style={
                    isExpanded
                        ? {
                              height: `${ref.current.scrollHeight}px`,
                              transition: 'height 0.3s ease',
                          }
                        : {
                              height: 0,
                              transition: 'height 03.s ease',
                          }
                }
                className={styles.body}
            >
                <div className={styles.children}>{children}</div>
            </div>
        </div>
    )
}

export default Collapse
