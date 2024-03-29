import ThemeSwitch from '@components/ThemeSwitch'
import styles from './styles.module.scss'
import Typography from '@components/Typography'
import { Font, Headings } from '@utils/types'
import Link from 'next/link'
import useScrollTo from '@hooks/useScrollTo'
import classNames from 'classnames'
import Breadcrumbs from '@components/Breadcrumbs'

const Nav = () => {
    const scrolled = useScrollTo()

    return (
        <div
            className={classNames(styles.container, {
                [styles.bg]: scrolled,
            })}
        >
            <div className={styles.nav} id="nav">
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
                <Breadcrumbs />
                <ThemeSwitch />
            </div>
        </div>
    )
}

export default Nav
