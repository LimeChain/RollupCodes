import Link from 'next/link'
import styles from './styles.module.scss'

const LinksGroup = () => {
    return (
        <div className={styles.group}>
            {[{ href: '', label: '' }].map((link, index) => (
                <Link key={index} href={link.href} target="_blank">
                    {link.label}
                </Link>
            ))}
        </div>
    )
}

export default LinksGroup
