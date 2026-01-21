import classNames from 'classnames'
import Link from 'next/link'
import ChevronRightIcon from '../../../public/images/chevron-right-icon.svg'
import styles from './styles.module.scss'

interface NavLinkProps {
    active?: boolean
    showBadge?: boolean
    badgeCount?: number
    children: React.ReactNode
    onClick?: () => void
}

function NavLink({
    active = false,
    showBadge = false,
    badgeCount = 1,
    children,
    onClick,
}: NavLinkProps) {
    return (
        <button
            onClick={onClick}
            className={classNames(styles.navLink, {
                [styles.navLinkActive]: active,
            })}
            aria-current={active ? 'page' : undefined}
        >
            <span>{children}</span>
            {showBadge && (
                <div
                    className={styles.badge}
                    aria-label={`${badgeCount} pending transactions`}
                >
                    {badgeCount}
                </div>
            )}
        </button>
    )
}

interface NavbarProps {
    activeLink?: 'rollups' | 'exit-hatch'
    onLinkClick?: (link: 'rollups' | 'exit-hatch') => void
    pendingCount?: number
    rollupName?: string
    className?: string
}

export function Navbar({
    activeLink = 'rollups',
    onLinkClick,
    pendingCount = 0,
    rollupName,
    className,
}: NavbarProps) {
    return (
        <nav
            className={classNames(styles.navbar, className)}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className={styles.logoContainer}>
                <Link href="/">
                    <h1 className={styles.logo}>ROLLUPCODES</h1>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className={styles.navLinks} role="list">
                <div role="listitem" className={styles.breadcrumbItem}>
                    <NavLink
                        active={activeLink === 'rollups' && !rollupName}
                        onClick={() => onLinkClick?.('rollups')}
                    >
                        Rollups
                    </NavLink>
                    {rollupName && (
                        <>
                            <ChevronRightIcon className={styles.chevron} />
                            <span className={styles.rollupName}>{rollupName}</span>
                        </>
                    )}
                </div>
                <div role="listitem">
                    <NavLink
                        active={activeLink === 'exit-hatch'}
                        showBadge={pendingCount > 0}
                        badgeCount={pendingCount}
                        onClick={() => onLinkClick?.('exit-hatch')}
                    >
                        Exit Hatch
                    </NavLink>
                </div>
            </div>
        </nav>
    )
}
