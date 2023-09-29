import Section from '@components/Section'
import Labels from '@components/Labels'
import styles from './styles.module.scss'
import QuestionMarkIcon from '/public/images/question-mark-icon.svg'
import { Tooltip as TooltipComponent } from 'react-tooltip'
import Typography from '@components/Typography'
import { Text } from '@utils/types'
import classNames from 'classnames'
import UnsupportedIcon from '/public/images/unsupported-triangle-icon.svg'
import ModifiedIcon from '/public/images/modified-triangle-icon.svg'
import AddedIcon from '/public/images/added-triangle-icon.svg'
import CopyIcon from '/public/images/copy-icon.svg'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReferenceIcon from '/public/images/reference-icon.svg'
import CheckmarkIcon from '/public/images/checkmark-icon.svg'

type Props = {
    children: string | JSX.Element
}

const Tooltip = ({ tooltip }: { tooltip: string }) => {
    const id = Math.random()
    return (
        <span
            data-tooltip-id={`${id}-tooltip`}
            data-tooltip-content={tooltip}
            className={styles.tooltip}
        >
            <QuestionMarkIcon />
            <TooltipComponent
                id={`${id}-tooltip`}
                style={{
                    background: 'var(--opposite-background-color)',
                    color: 'var(--opposite-text-color)',
                    zIndex: 1,
                    borderRadius: 0,
                    opacity: 1,
                    maxWidth: 200,
                    height: 'auto',
                    fontWeight: '400',
                }}
            />
        </span>
    )
}

const Copy = ({ value, label }: { value: string; label: string }) => {
    const [copied, setCopied] = useState<boolean>(false)
    const intervalRef: any = useRef(null)

    useEffect(() => {
        if (copied) {
            intervalRef.current = setInterval(() => setCopied(false), 1500)
        }
        return () => clearInterval(intervalRef.current)
    }, [copied])

    return (
        <div className={styles.copy}>
            {label && label}
            { /* ts-ignore */}
            <CopyToClipboard text={value} onCopy={() => setCopied(true)}>
                    <span className={styles.copyIcon}>
                        {copied ? <CheckmarkIcon /> : <CopyIcon />}
                    </span>
            </CopyToClipboard>
        </div>
    )
}

const Parameter = ({
    name,
    value,
    tooltip,
    bordered = true,
    reference,
}: {
    name: string
    value?: string | React.ReactNode | React.ReactNode[]
    tooltip?: string
    bordered?: boolean
    reference?: string
}) => (
    <span
        className={classNames(styles.parameter, {
            [styles.bordered]: bordered && value,
        })}
    >
        <Typography
            variant={Text.BODY2}
            fontWeight="700"
            marginRight={4}
            width={'35%'}
            className={styles.additionalParameterClass}
        >
            {name}
            {reference && <Reference url={reference} />}
            {tooltip ? <Tooltip tooltip={tooltip} /> : null}
        </Typography>
        <span className={styles.parameterValue}>
            {typeof value === 'string' ? (
                <Typography
                    variant={Text.BODY2}
                    fontWeight="400"
                    color={'var(--markdown-text-color)'}
                >
                    {value}
                </Typography>
            ) : (
                value
            )}
        </span>
    </span>
)

const Legend = () => (
    <ul className={styles.legend}>
        <li className={classNames(styles.marker, styles.marker_unsupported)}>
            &#8226; Unsupported
        </li>
        <li className={classNames(styles.marker, styles.marker_modified)}>
            &#8226; Modified
        </li>
        <li className={classNames(styles.marker, styles.marker_added)}>
            &#8226; Added
        </li>
    </ul>
)

const Unsupported = () => (
    <div className={styles.stateIcon}>
        <UnsupportedIcon />
    </div>
)

const Modified = () => (
    <div className={styles.stateIcon}>
        <ModifiedIcon />
    </div>
)

const Added = () => (
    <div className={styles.stateIcon}>
        <AddedIcon />
    </div>
)

const Reference = ({ url, label }: { url: string; label?: string }) => (
    <Link href={url} target="_blank" className={styles.reference}>
        {label && (
            <Typography variant={Text.BODY2} fontWeight="400" color="inherit">
                {label}
            </Typography>
        )}
        <ReferenceIcon fill={'var(--neutral60)'} />
    </Link>
)

type MultiRowParametersData = Record<
    string,
    string | Record<string, string>[]
>[]

const MultiRowParameters = ({
    title,
    tooltip,
    data,
    bordered = true,
}: {
    title: string
    tooltip: string
    data: MultiRowParametersData
    bordered: boolean
}) => {
    return (
        <div className={styles.multiRowContainer}>
            <Typography
                variant={Text.BODY2}
                fontWeight="700"
                className={styles.additionalParameterClass}
                marginBottom={12}
            >
                {title}
                {tooltip ? <Tooltip tooltip={tooltip} /> : null}
            </Typography>
            {data?.map((row: any, index: number) => (
                <div
                    key={`row-${index}`}
                    className={classNames(styles.multiRow, {
                        [styles.bordered]: bordered,
                    })}
                >
                    <Typography
                        variant={Text.BODY2}
                        fontWeight="700"
                        marginRight={4}
                        width={'26%'}
                        className={styles.additionalParameterClass}
                    >
                        {row?.title}
                        {row?.reference && <Reference url={row?.reference} />}
                    </Typography>
                    <div className={styles.multiRowValues}>
                        {row?.rows?.map((row: any, index: number) => (
                            <div
                                key={`inner-row-${index}`}
                                className={styles.multiRowValue}
                            >
                                <Typography
                                    variant={Text.BODY2}
                                    fontWeight="700"
                                    marginRight={4}
                                    width={'25%'}
                                >
                                    {row?.label}
                                    {row?.tooltip && (
                                        <Tooltip tooltip={row?.tooltip} />
                                    )}
                                </Typography>
                                <Typography
                                    variant={Text.BODY2}
                                    fontWeight="400"
                                    color={'var(--markdown-text-color)'}
                                >
                                    {row?.value}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

const MDXShortcodes = {
    Labels,
    Section,
    Parameter,
    Legend,
    Tooltip,
    Unsupported,
    Modified,
    Added,
    Copy,
    Reference,
    MultiRowParameters,
}

export default MDXShortcodes
