import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Headings, Text, Font, IDocMeta } from '@utils/types'
import RollupSummaryCard from '@components/RollupSummaryCard'
import Grid from '@components/Grid'
import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import getConfig from 'next/config'
import Feedback from '@components/Feedback'
import useScreenModes from '@hooks/useScreenModes'
import MCPSection from '@components/MCPSection'

interface IHomeProps {
    docs: IDocMeta[]
}

const { serverRuntimeConfig } = getConfig()

export default function Home({ docs }: IHomeProps) {
    const { isMobile } = useScreenModes()

    return (
        <Layout loading={docs?.length === 0}>
            <Typography
                variant={Headings[isMobile ? 'H3' : 'H2']}
                fontWeight="300"
                textTransform="uppercase"
                textAlign="center"
                marginTop={64}
                letterSpacing={'3px'}
            >
                INTERACTIVE REFERENCE OF THE
            </Typography>
            <div className="gradientBg">
                <Typography
                    variant={Headings[isMobile ? 'H3' : 'H2']}
                    fontWeight="500"
                    textTransform="uppercase"
                    textAlign="center"
                    color="var(--neutral100)"
                    letterSpacing={'3px'}
                    lineHeight={'110%'}
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
                A comprehensive tool for <b>developers</b> to compare and do
                in-depth analysis of the expanding Ethereum ecosystem
            </Typography>
            <Grid>
                {docs?.map((docMeta: IDocMeta, index: number) => (
                    <RollupSummaryCard key={`rollup-${index}`} {...docMeta} />
                ))}
            </Grid>
            <MCPSection />
            <Feedback />
        </Layout>
    )
}

export const getStaticProps = async () => {
    const docs = await getDocsMetadata()
    return { props: { docs } }
}

const getDocsMetadata = async () => {
    const folder = 'src/docs/'
    const path = join(serverRuntimeConfig.APP_ROOT, folder)
    const files = fs.readdirSync(path)
    const markdownDocs = files.filter((file) => file.endsWith('.mdx'))

    // Get gray-matter data from each file.
    const docs: IDocMeta[] = []

    await Promise.all(
        markdownDocs.map((fileName) => {
            const fileContents = fs.readFileSync(`${folder}${fileName}`, 'utf8')
            const matterResult = matter(fileContents)

            const hasDarkLogo = fs.existsSync(
                `public/images/${fileName.replace('.mdx', '')}-dark-logo.svg`
            )

            docs.push({
                title: matterResult?.data?.title,
                // Light logo will be used as default if there is ONLY one
                lightLogo: `images/${fileName.replace('.mdx', '')}-logo.svg`,
                darkLogo: hasDarkLogo
                    ? `images/${fileName.replace('.mdx', '')}-dark-logo.svg`
                    : '',
                subtitle: matterResult?.data?.subtitle,
                slug: fileName.replace('.mdx', ''),
                labels: matterResult?.data?.labels,
                links: matterResult?.data?.links,
            })
        })
    )

    const sorted = docs
        // Sort alphabetically
        .sort((a, b) => {
            const aTitle = a.title.toLowerCase()
            const bTitle = b.title.toLowerCase()
            if (aTitle < bTitle) {
                return -1
            }
            if (aTitle > bTitle) {
                return 1
            }
            return 0
        })
        // Sort the "Mainnet" rollups before the "Testnet" ones
        .sort((_, b) => (b.labels.includes('Mainnet') ? 0 : -1))

    return sorted
}
