import classNames from 'classnames'
import { useTheme } from 'next-themes'
import { Mail } from 'lucide-react'
import RollupCodesLogo from '../../../public/images/RollupCodes-LimeChain-Logo.svg'
import RollupCodesLogoDark from '../../../public/images/RollupCodes-LimeChain-Logo-Dark.svg'
import GithubIcon from '../../../public/images/github-icon.svg'
import XIcon from '../../../public/images/x-icon.svg'
import styles from './styles.module.scss'

function Separator() {
    return <div className={styles.separator} />
}

interface FooterProps {
    className?: string
}

export function Footer({ className }: FooterProps) {
    const { theme, setTheme } = useTheme()
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

    return (
        <footer
            className={classNames(styles.footer, className)}
            role="contentinfo"
            aria-label="Site footer"
        >
            {/* Desktop Layout */}
            <nav
                className={styles.desktopNav}
                aria-label="Footer navigation"
            >
                {/* Left Section */}
                <div className={styles.leftSection}>
                    {/* Made by */}
                    <div className={styles.madeBy}>
                        <span className={styles.madeByText}>Made by</span>
                        {theme === 'light' ? (
                            <RollupCodesLogoDark />
                        ) : (
                            <RollupCodesLogo />
                        )}
                    </div>

                    <Separator />

                    {/* Theme Toggle */}
                    <div className={styles.themeToggle}>
                        <button
                            onClick={toggleTheme}
                            className={styles.themeButton}
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                            aria-pressed={theme === 'dark'}
                        >
                            <div className={styles.toggleTrack}>
                                <div
                                    className={classNames(
                                        styles.toggleIndicator,
                                        theme === 'dark'
                                            ? styles.toggleIndicatorDark
                                            : styles.toggleIndicatorLight
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                        </button>
                        <span className={styles.themeText} aria-live="polite">
                            {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                        </span>
                    </div>
                </div>

                {/* Right Section */}
                <div className={styles.rightSection}>
                    {/* Social Icons */}
                    <div
                        className={styles.socialIcons}
                        role="list"
                        aria-label="Social media links"
                    >
                        <a
                            href="https://twitter.com/limechain"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                            aria-label="Follow us on Twitter (opens in new window)"
                            role="listitem"
                        >
                            <XIcon aria-hidden="true" />
                        </a>
                        <a
                            href="https://github.com/LimeChain/rollup-codes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                            aria-label="View source code on GitHub (opens in new window)"
                            role="listitem"
                        >
                            <GithubIcon aria-hidden="true" />
                        </a>
                        <a
                            href="mailto:contact@limechain.tech"
                            className={styles.socialLink}
                            aria-label="Contact us via email"
                            role="listitem"
                        >
                            <Mail aria-hidden="true" />
                        </a>
                    </div>

                    <Separator />

                    {/* Links */}
                    <a
                        href="https://github.com/LimeChain/rollup-codes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Contribute on Github
                    </a>

                    <Separator />

                    <a
                        href="https://github.com/LimeChain/rollup-codes-mcp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Get MCP
                    </a>

                    <Separator />

                    <a href="#" className={styles.navLink}>
                        Privacy Policy
                    </a>

                    <a
                        href="https://github.com/LimeChain/rollup-codes/blob/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Open-sourced under MIT license
                    </a>
                </div>
            </nav>

            {/* Mobile Layout */}
            <nav
                className={styles.mobileNav}
                aria-label="Footer navigation"
            >
                {/* Made by */}
                <div className={styles.madeBy}>
                    <span className={styles.madeByText}>Made by</span>
                    {theme === 'light' ? (
                        <RollupCodesLogoDark />
                    ) : (
                        <RollupCodesLogo />
                    )}
                </div>

                {/* Theme Toggle */}
                <div className={styles.themeToggle}>
                    <button
                        onClick={toggleTheme}
                        className={styles.themeButton}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                        aria-pressed={theme === 'dark'}
                    >
                        <div className={styles.toggleTrack}>
                            <div
                                className={classNames(
                                    styles.toggleIndicator,
                                    theme === 'dark'
                                        ? styles.toggleIndicatorDark
                                        : styles.toggleIndicatorLight
                                )}
                                aria-hidden="true"
                            />
                        </div>
                    </button>
                    <span className={styles.themeText} aria-live="polite">
                        {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                    </span>
                </div>

                {/* Social Icons */}
                <div
                    className={styles.socialIcons}
                    role="list"
                    aria-label="Social media links"
                >
                    <a
                        href="https://twitter.com/limechain"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        aria-label="Follow us on Twitter (opens in new window)"
                        role="listitem"
                    >
                        <XIcon aria-hidden="true" />
                    </a>
                    <a
                        href="https://github.com/LimeChain/rollup-codes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        aria-label="View source code on GitHub (opens in new window)"
                        role="listitem"
                    >
                        <GithubIcon aria-hidden="true" />
                    </a>
                    <a
                        href="mailto:contact@limechain.tech"
                        className={styles.socialLink}
                        aria-label="Contact us via email"
                        role="listitem"
                    >
                        <Mail aria-hidden="true" />
                    </a>
                </div>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Links */}
                <div className={styles.mobileLinks}>
                    <a
                        href="https://github.com/LimeChain/rollup-codes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Contribute on Github
                    </a>
                    <a
                        href="https://github.com/LimeChain/rollup-codes-mcp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Get MCP
                    </a>
                    <a href="#" className={styles.navLink}>
                        Privacy Policy
                    </a>
                    <a
                        href="https://github.com/LimeChain/rollup-codes/blob/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                        Open-sourced under MIT license
                    </a>
                </div>
            </nav>
        </footer>
    )
}
