import Link from 'next/link'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Links, Text } from '@utils/types'
import Icon from '@components/Icon'
import ReferenceIcon from 'public/images/reference-icon.svg'
import ChevronDownIcon from 'public/images/chevron-down-icon.svg'
import { useEffect, useMemo, useState } from 'react'
import useScreenModes from '@hooks/useScreenModes'

const DropdownLinks = ({ links }: { links: Links }) => {
    const [width, setWidth] = useState<number>(0)

    const { isMobile, isTablet } = useScreenModes()

    const dropdownButtonLabel = useMemo(() => {
        if (isMobile) {
            return 'Links'
        }

        if (isTablet) {
            return 'More'
        }

        return 'Social'
    }, [isMobile, isTablet])

    const handleResize = (event: any) => {
        const width = event?.target.innerWidth
        setWidth(width)
    }

    const numberOfIndividuals = useMemo(
        () => (width >= 1024 ? 4 : width >= 768 ? 2 : 0),
        [width]
    )

    useEffect(() => {
        setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const keys = Object?.keys(links)

    const individuals: string[] = []
    const grouped: string[] = []
    keys?.filter((key: string, index: number) => {
        if (index < numberOfIndividuals) {
            individuals.push(key)
        } else {
            grouped.push(key)
        }
    })

    const individualsLink = individuals?.map((key: string, index: number) => (
        <Link
            key={index}
            href={links[key]?.url}
            className={styles.link}
            target="_blank"
        >
            <Icon name={key} />
            <Typography
                variant={Text.BODY2}
                fontWeight="700"
                marginLeft={4}
                marginRight={4}
            >
                {links[key]?.name}
            </Typography>
            <ReferenceIcon fill={'var(--text-color)'} />
        </Link>
    ))

    const groupedLinks = grouped?.map((key: string, index: number) => (
        <Link
            key={index}
            href={links[key]?.url}
            className={styles.dropdownItem}
            target="_blank"
        >
            <Icon name={key} />{' '}
            <Typography
                variant={Text.BODY2}
                fontWeight="700"
                marginLeft={4}
                marginRight={4}
            >
                {links[key]?.name}
            </Typography>
            <ReferenceIcon fill={'var(--text-color)'} />
        </Link>
    ))

    return (
        <div className={styles.linksRow}>
            {individualsLink}
            <div className={styles.dropdown}>
                <div className={styles.dropdownButton}>
                    <Typography variant={Text.BODY2} fontWeight="700">
                        {dropdownButtonLabel}
                    </Typography>{' '}
                    <ChevronDownIcon />
                </div>
                <div className={styles.dropdownBody}>{groupedLinks}</div>
            </div>
        </div>
    )
}

export default DropdownLinks
