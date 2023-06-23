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

type Props = {
    children: string | JSX.Element
}

// const Paragraph = ({ children }: Props) => (
//     <Typography
//         variant={Text.BODY2}
//         fontWeight="400"
//         marginBottom={24}
//         breakWord={'break-all'}
//     >
//         {children}
//     </Typography>
// )

// const Heading1 = ({ children }: Props) => (
//     <Typography variant={Headings.H1} fontWeight="700" marginBottom={24}>
//         {children}
//     </Typography>
// )

// const Heading2 = ({ children }: Props) => (
//     <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
//         {children}
//     </Typography>
// )

// const Heading3 = ({ children }: Props) => (
//     <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
//         {children}
//     </Typography>
// )

// const Heading4 = ({ children }: Props) => (
//     <Typography variant={Headings.H4} fontWeight="700" marginBottom={24}>
//         {children}
//     </Typography>
// )

// const Heading5 = ({ children }: Props) => (
//     <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
//         {children}
//     </Typography>
// )

// const Heading6 = ({ children }: Props) => (
//     <Typography variant={Headings.H6} fontWeight="700" marginBottom={8}>
//         {children}
//     </Typography>
// )

// const UnorderedList = ({ children }: Props) => (
//     <ul className={styles.ul}>{children}</ul>
// )

// const OrderedList = ({ children }: Props) => (
//     <ol className={styles.ol}>{children}</ol>
// )

// const ListItem = ({ children }: Props) => (
//     <li className={styles.li}>{children}</li>
// )

// const Blockquote = ({ children }: Props) => (
//     <blockquote className={styles.blockquote}>{children}</blockquote>
// )

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

// const Table = ({ children }: Props) => <table>{children}</table>

// const Tr = ({ children }: Props) => <tr>{children}</tr>

// const Td = ({ children }: Props) => <td>{children}</td>

const Tooltip = ({ tooltip }: { tooltip: string }) => {
    const id = Math.random()
    return (
        <span
            data-tooltip-id={`${id}-tooltip`}
            data-tooltip-content={`${tooltip}🔗`}
            className={styles.tooltip}
        >
            <QuestionMarkIcon />
            <TooltipComponent
                clickable
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
            >
                <a href="">asd</a>
            </TooltipComponent>
        </span>
        // <>
        //     <a id="clickable">click</a>
        //     <TooltipComponent anchorSelect="#clickable" clickable>
        //         The rate at which the rollup produces blocks. Keep in mind that
        //         as per Optimism docs (reference icon), the value is subject to
        //         change in the future.{' '}
        //         <a href="https://www.google.com" target="_blank">
        //             See reference
        //         </a>
        //     </TooltipComponent>
        // </>
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
    <div className={styles.icon}>
        <UnsupportedIcon />
    </div>
)

const Modified = () => (
    <div className={styles.icon}>
        <ModifiedIcon />
    </div>
)

const Added = () => (
    <div className={styles.icon}>
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
}

export default MDXShortcodes
