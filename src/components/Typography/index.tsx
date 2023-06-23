import { Font, Headings, ITypography } from '@utils/types'
import styles from './styles.module.scss'
import classNames from 'classnames'

const Typography = ({
    variant,
    children,
    fontWeight = '400',
    textAlign = 'left',
    marginTop = 0,
    marginRight = 0,
    marginLeft = 0,
    marginBottom = 0,
    fontStyle = 'normal',
    className,
    font = Font.Inter,
    textTransform = 'none',
    color,
    letterSpacing,
    fontSize,
    breakWord = 'normal',
    width,
}: ITypography): React.ReactElement => {
    const style = {
        fontWeight,
        textAlign,
        marginBottom,
        marginTop,
        marginRight,
        marginLeft,
        fontStyle,
        textTransform,
        color,
        letterSpacing,
        fontSize,
        breakWord,
        width,
    }

    switch (variant) {
        case Headings.H1:
            return (
                <h1
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H1],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h1>
            )
        case Headings.H2:
            return (
                <h2
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H2],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h2>
            )
        case Headings.H3:
            return (
                <h3
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H3],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h3>
            )
        case Headings.H4:
            return (
                <h4
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H4],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h4>
            )
        case Headings.H5:
            return (
                <h5
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H5],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h5>
            )
        case Headings.H6:
            return (
                <h6
                    className={classNames(
                        styles.defaultStyles,
                        styles[Headings.H6],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </h6>
            )
        default:
            return (
                <p
                    className={classNames(
                        styles.defaultStyles,
                        styles[variant],
                        styles[Font[font]],
                        className
                    )}
                    style={style}
                >
                    {children}
                </p>
            )
    }
}

export default Typography
