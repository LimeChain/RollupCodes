import Section from '@components/Section'
import Label from '@components/Label'
import styles from './styles.module.scss'
import QuestionMarkIcon from 'public/images/question-mark-icon.svg'
import { Tooltip as TooltipComponent } from 'react-tooltip'
import Typography from '@components/Typography'
import { Text } from '@utils/types'
import classNames from 'classnames'
import UnsupportedIcon from 'public/images/unsupported-triangle-icon.svg'
import ModifiedIcon from 'public/images/modified-triangle-icon.svg'
import AddedIcon from 'public/images/added-triangle-icon.svg'
import ReferenceIcon from 'public/images/reference-icon.svg'
import CopyIcon from 'public/images/copy-icon.svg'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useState } from 'react'

type Props = {
    children: string | JSX.Element
}

const Labels = ({ labels }: { labels: string[] }) => (
    <div className={styles.labels}>
        {labels?.map((label: string, index: number) => (
            <Label
                key={`label-${index}`}
                text={label}
                color={`var(--label-color-${
                    (index > 7 ? index % 7 : index) + 1
                })`}
            />
        ))}
    </div>
)

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
                }}
            />
        </span>
    )
}

const Copy = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState<boolean>(false)

    return (
        <span
            className={styles.copy}
            data-tooltip-id="copy-tooltip"
            data-tooltip-content={copied ? 'Copied' : 'Copy'}
            onMouseLeave={() => setCopied(false)}
        >
            <CopyToClipboard text={value} onCopy={() => setCopied(true)}>
                <span className={styles.copyIcon}>
                    <CopyIcon />
                </span>
            </CopyToClipboard>
            <TooltipComponent
                id="copy-tooltip"
                style={{
                    background: 'var(--opposite-background-color)',
                    color: 'var(--opposite-text-color)',
                    zIndex: 1,
                    borderRadius: 0,
                    opacity: 1,
                    maxWidth: 200,
                    height: 'auto',
                }}
            />
        </span>
    )
}

const Parameter = ({
    name,
    value,
    tooltip,
}: {
    name: string
    value?: string | React.ReactElement | string
    tooltip?: string
}) => (
    <div className={classNames(styles.parameter, { [styles.bordered]: value })}>
        <Typography variant={Text.BODY2} fontWeight="700" marginRight={4}>
            {name}
        </Typography>
        <span>{tooltip ? <Tooltip tooltip={tooltip} /> : null}</span>{' '}
        {typeof value === 'string' ? (
            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginLeft={24}
                color={'var(--neutral30)'}
            >
                {value}
            </Typography>
        ) : (
            value
        )}
    </div>
)

const Legend = () => (
    <div className={styles.legend}>
        <div className={classNames(styles.marker, styles.unsupported)}>
            <UnsupportedIcon /> Unsupported
        </div>
        <div className={classNames(styles.marker, styles.modified)}>
            <ModifiedIcon /> Modified
        </div>
        <div className={classNames(styles.marker, styles.added)}>
            <AddedIcon /> Added
        </div>
    </div>
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

const Reference = ({ url }: { url: string }) => <ReferenceIcon />

const MDXShortcodes = {
    Labels,
    Section,
    Parameter,
    Legend,
    Tooltip,
    Unsupported,
    Modified,
    Added,
    Reference,
    Copy,
}

export default MDXShortcodes
