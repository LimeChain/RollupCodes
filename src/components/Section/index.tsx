import { useMemo, useRef, useState } from 'react'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Headings, ThemeMode } from '@utils/types'
import PlusGradientIcon from '/public/images/plus-gradient-icon.svg'
import MinusGradientIcon from '/public/images/minus-gradient-icon.svg'
import PlusGrayIcon from '/public/images/plus-gray-icon.svg'
import MinusGrayIcon from '/public/images/minus-gray-icon.svg'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import LinkIcon from '/public/images/link-icon.svg'

interface ISection {
    title: string
    children: React.ReactNode
}

const Section = ({ title, children }: ISection) => {
    const [isExpanded, setExpanded] = useState<boolean>(true)
    const { theme } = useTheme()
    const ref = useRef<any>(0)

    const plusIcon = useMemo(
        () =>
            theme === ThemeMode[ThemeMode.DARK].toLowerCase() ? (
                <PlusGradientIcon />
            ) : (
                <PlusGrayIcon />
            ),
        [theme]
    )
    const minusIcon = useMemo(
        () =>
            theme === ThemeMode[ThemeMode.DARK].toLowerCase() ? (
                <MinusGradientIcon />
            ) : (
                <MinusGrayIcon />
            ),
        [theme]
    )

    const toggle = () => setExpanded((prev) => !prev)

    return (
        <div
            data-element-type="section"
            className={styles.section}
            id={title.toLowerCase().replace(' ', '-')}
        >
            <div
                className={styles.sectionHeader}
                data-element-type="section-header"
            >
                <Link
                    href={`#${title.toLowerCase().replace(' ', '-')}`}
                    id={`${title.toLowerCase().replace(' ', '-')}`}
                >
                    <LinkIcon fill={`var(--)`} />
                </Link>
                <div
                    onClick={toggle}
                    className={styles.button}
                    data-element-type="section-title"
                    data-element-value={title}
                >
                    <Typography variant={Headings.H4} fontWeight={'700'}>
                        {title}
                    </Typography>
                    {isExpanded ? minusIcon : plusIcon}
                </div>
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
