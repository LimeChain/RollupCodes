import { useRef, useState } from 'react'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import PlusIcon from 'public/images/plus-gradient-icon.svg'
import MinusIcon from 'public/images/minus-gradient-icon.svg'

interface ISection {
    title: string
    children: React.ReactNode
}

const Section = ({ title, children }: ISection) => {
    const [isExpanded, setExpanded] = useState<boolean>(true)
    const ref = useRef<any>(0)

    const toggle = () => setExpanded((prev) => !prev)

    return (
        <div
            data-element-type="section"
            className={styles.section}
            id={title.toLowerCase().replace(' ', '-')}
        >
            <div
                onClick={toggle}
                className={styles.button}
                data-element-type="section-title"
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
                              overflowX: 'auto',
                              overflowY: 'hidden',
                          }
                        : {
                              height: 0,
                              transition: 'height 0.3s ease',
                              overflow: 'hidden',
                          }
                }
            >
                <div className={styles.children}>{children}</div>
            </div>
        </div>
    )
}

export default Section
