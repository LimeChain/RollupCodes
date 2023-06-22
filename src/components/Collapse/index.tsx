import { useRef, useState } from 'react'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import PlusIcon from 'public/images/plus-gradient-icon.svg'
import MinusIcon from 'public/images/minus-gradient-icon.svg'

interface ICollapse {
    title: string
    children: React.ReactNode
}

const Collapse = ({ title, children }: ICollapse) => {
    const [isExpanded, setExpanded] = useState<boolean>(false)
    const ref = useRef<any>(0)

    const toggle = () => setExpanded((prev) => !prev)

    return (
        <div
            data-element-type="collapse"
            className={styles.collapse}
            id={title.toLowerCase().replace(' ', '-')}
        >
            <div
                onClick={toggle}
                className={styles.button}
                data-element-type="collapse-button"
                data-element-value={title}
            >
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
