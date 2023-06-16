import ThemeSwitch from '@components/ThemeSwitch'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Font, Headings } from '@utils/types'
import Link from 'next/link'

const Nav = () => {
    return (
        <div className={styles.nav}>
            <Link href="/">
                <Typography
                    variant={Headings.H5}
                    fontWeight="500"
                    textTransform="uppercase"
                    font={Font.ChakraPetch}
                >
                    RollupCodes
                </Typography>
            </Link>
            <ThemeSwitch />
        </div>
    )
}

export default Nav
