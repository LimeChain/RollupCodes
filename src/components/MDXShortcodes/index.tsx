import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import styles from './styles.module.scss'

type Props = {
    children: string | JSX.Element
}

const Paragraph = ({ children }: Props) => (
    <Typography
        variant={Text.BODY2}
        fontWeight="400"
        marginBottom={24}
        breakWord={'break-all'}
    >
        {children}
    </Typography>
)

const Heading1 = ({ children }: Props) => (
    <Typography variant={Headings.H1} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const Heading2 = ({ children }: Props) => (
    <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const Heading3 = ({ children }: Props) => (
    <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const Heading4 = ({ children }: Props) => (
    <Typography variant={Headings.H4} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const Heading5 = ({ children }: Props) => (
    <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
        {children}
    </Typography>
)

const Heading6 = ({ children }: Props) => (
    <Typography variant={Headings.H6} fontWeight="700" marginBottom={8}>
        {children}
    </Typography>
)

const UnorderedList = ({ children }: Props) => (
    <ul className={styles.ul}>{children}</ul>
)

const OrderedList = ({ children }: Props) => (
    <ol className={styles.ol}>{children}</ol>
)

const ListItem = ({ children }: Props) => (
    <li className={styles.li}>{children}</li>
)

const Blockquote = ({ children }: Props) => (
    <blockquote className={styles.blockquote}>{children}</blockquote>
)

// const MDXComponentsMap = {
//     // h1: H1,
//     // h2: H2,
//     // h3: H3,
//     // h4: H4,
//     // h5: H5,
//     h6: H6,
//     p: P,
//     ul: UL,
//     // ol: OL,
//     li: LI,
//     // table: MDXComponents.Table,
//     // th: MDXComponents.TH,
//     // td: MDXComponents.TD,
//     // a: MDXComponents.A,
//     // pre: MDXComponents.Pre,
//     // blockquote: Blockquote,
// }

const MDXShortcodes = {
    Paragraph,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    UnorderedList,
    OrderedList,
    ListItem,
    Blockquote,
}

export default MDXShortcodes
