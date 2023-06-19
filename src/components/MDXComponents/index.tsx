import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import styles from './styles.module.scss'

type Props = {
    children: string | JSX.Element
}

const P = ({ children }: Props) => (
    <Typography
        variant={Text.BODY2}
        fontWeight="400"
        marginBottom={8}
        breakWord={'break-all'}
    >
        {children}
    </Typography>
)

const H1 = ({ children }: Props) => (
    <Typography variant={Headings.H1} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const H2 = ({ children }: Props) => (
    <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const H3 = ({ children }: Props) => (
    <Typography variant={Headings.H2} fontWeight="700" marginBottom={24}>
        {children}
    </Typography>
)

const H4 = ({ children }: Props) => (
    <Typography
        variant={Headings.H4}
        fontWeight="700"
        marginBottom={24}
        marginTop={32}
    >
        {children}
    </Typography>
)

const H5 = ({ children }: Props) => (
    <Typography variant={Headings.H5} fontWeight="700" marginBottom={4}>
        {children}
    </Typography>
)

const UL = ({ children }: Props) => <ul className={styles.ul}>{children}</ul>

const OL = ({ children }: Props) => <ol className={styles.ol}>{children}</ol>

const LI = ({ children }: Props) => <li>{children}</li>

const Blockquote = ({ children }: Props) => (
    <blockquote className={styles.blockquote}>{children}</blockquote>
)

const MDXComponentsMap = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    p: P,
    ul: UL,
    ol: OL,
    li: LI,
    // table: MDXComponents.Table,
    // th: MDXComponents.TH,
    // td: MDXComponents.TD,
    // a: MDXComponents.A,
    // pre: MDXComponents.Pre,
    blockquote: Blockquote,
}

export default MDXComponentsMap
