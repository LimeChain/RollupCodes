import { useTheme } from 'next-themes'
import styles from './styles.module.scss'
import MoonIcon from '../../../public/images/moon-icon.svg'
import SunIcon from '../../../public/images/sun-icon.svg'

const ThemeSwitch = () => {
    const { theme, setTheme } = useTheme()

    const handleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

    return (
        <button
            type="button"
            onClick={handleTheme}
            className={styles.button}
            id="theme-toggler"
        >
            {theme === 'dark' ? (
                <SunIcon fill="var(--icon-color)" />
            ) : (
                <MoonIcon fill="var(--icon-color)" />
            )}
        </button>
    )
}

export default ThemeSwitch
