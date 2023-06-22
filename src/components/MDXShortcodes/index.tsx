import Typography from '@components/Typography'
import Section from '@components/Section'
import Label from '@components/Label'
import { Headings, Text } from '@utils/types'
import styles from './styles.module.scss'

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

const Mark = ({ children }: Props) => (
    <mark className={styles.mark}>{children}</mark>
)

const MDXShortcodes = {
    Labels,
    Section,
    Mark,
}

export default MDXShortcodes
