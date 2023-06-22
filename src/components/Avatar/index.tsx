import Typography from '@components/Typography'
import { AvatarSize, Headings, Text, Font } from '@utils/types'
import styles from './styles.module.scss'
import classNames from 'classnames'
import Image from 'next/image'

interface IAvatar {
    name: string
    src: string
    size?: AvatarSize
}

const Avatar = ({ name = '', size = AvatarSize.SMALL, src }: IAvatar) => {
    const isLarge = Boolean(AvatarSize.LARGE === size)

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
                variant={Headings[isLarge ? 'H3' : 'H4']}
                fontWeight="700"
                font={Font.ChakraPetch}
                marginLeft={isLarge ? 12 : 8}
                textTransform="uppercase"
            >
                {name}
            </Typography>
        </div>
    )
}

export default Avatar
