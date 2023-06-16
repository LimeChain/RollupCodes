import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Headings, Text, IRollupMeta, Font } from '@utils/types'
import RollupSummaryCard from '@components/RollupSummaryCard'
import Grid from '@components/Grid'
import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import getConfig from 'next/config'

interface IHomeProps {
    rollups: IRollupMeta[]
}

const { serverRuntimeConfig } = getConfig()

export default function Home({ rollups }: IHomeProps) {
    return (
        <Layout>
            <Typography
                variant={Headings.H2}
                fontWeight="300"
                textTransform="uppercase"
                font={Font.ChakraPetch}
                textAlign="center"
                marginTop={64}
                letterSpacing={'3px'}
            >
                INTERACTIVE REFERENCE OF THE
            </Typography>
            <div className="gradientBg">
                <Typography
                    variant={Headings.H2}
                    fontWeight="500"
                    textTransform="uppercase"
                    font={Font.ChakraPetch}
                    textAlign="center"
                    color="var(--neutral100)"
                    letterSpacing={'2px'}
                >
                    ETHEREUM ROLLUP ECOSYSTEM
                </Typography>
            </div>
            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                textAlign="center"
                marginBottom={96}
                marginTop={16}
            >
                A comprehensive tool for <b>developers</b> to compare and and do
                in-depth analyses of the expanding Ethereum ecosystem
            </Typography>
            <Grid>
                {rollups?.map((meta: IRollupMeta, index: number) => (
                    <RollupSummaryCard key={`rollup-${index}`} {...meta} />
                ))}
            </Grid>
        </Layout>
    )
}

export const getStaticProps = async () => {
    const docsPath = join(serverRuntimeConfig.APP_ROOT, 'src/docs/rollups')
    const docs = fs.readdirSync(docsPath)

    let rollups: IRollupMeta[] = []

    await Promise.all(
        docs.map(async (doc) => {
            try {
                const markdownWithMeta = fs.readFileSync(
                    join(docsPath, doc),
                    'utf-8'
                )
                const { data } = matter(markdownWithMeta)
                if (data) {
                    rollups.push(data as IRollupMeta)
                }
            } catch (error) {
                console.debug(
                    "Couldn't read the Markdown doc for the opcode",
                    error
                )
            }
        })
    )

    return { props: { rollups } }
}
