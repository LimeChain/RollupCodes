import Typography from '@components/Typography'
import { AvatarSize, Headings, Text, Font, ThemeMode } from '@utils/types'
import styles from './styles.module.scss'
import classNames from 'classnames'
import Image from 'next/image'
import useScreenModes from '@hooks/useScreenModes'
import { useTheme } from 'next-themes'

interface IAvatar {
    name: string
    lightLogo: string
    darkLogo?: string
    size?: AvatarSize
}

const Avatar = ({
    name = '',
    size = AvatarSize.SMALL,
    lightLogo,
    darkLogo,
}: IAvatar) => {
    const isLarge = Boolean(AvatarSize.LARGE === size)
    const { theme } = useTheme()
    const isDarkTheme = ThemeMode[ThemeMode.DARK].toLowerCase() === theme

    const src = isDarkTheme ? lightLogo : darkLogo ? darkLogo : lightLogo

    const { isMobile } = useScreenModes()

    return (
        <div className={styles.avatar}>
            {src ? (
                <Image
                    src={src}
                    alt={name}
                    width={isLarge ? 48 : 32}
                    height={isLarge ? 48 : 32}
                />
            ) : (
                <div
                    className={classNames(styles.circle, {
                        [styles.largeCircle]: isLarge,
                    })}
                >
                    <Typography
                        variant={isLarge ? Headings.H5 : Text.BODY2}
                        fontWeight="500"
                        fontStyle={'italic'}
                        color="var(--opposite-text-color)"
                    >
                        {name.slice(0, 1).toUpperCase()}
                    </Typography>
                </div>
            )}
            <Typography
                variant={Headings[isLarge ? (isMobile ? 'H4' : 'H3') : 'H4']}
                fontWeight="700"
                font={Font.ChakraPetch}
                marginLeft={isLarge ? 12 : 8}
            >
                {name}
            </Typography>
        </div>
    )
}

export default Avatar
