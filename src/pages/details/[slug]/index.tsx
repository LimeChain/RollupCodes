import Avatar from '@components/Avatar'
import Layout from '@components/Layout'
import { AvatarSize, IDocMeta } from '@utils/types'
import { join } from 'path'
import fs from 'fs'
import getConfig from 'next/config'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import styles from './styles.module.scss'
import { MDXRemote } from 'next-mdx-remote'
import Head from 'next/head'
import Script from 'next/script'
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher'
import MDXShortcodes from '@components/MDXShortcodes'
import remarkGfm from 'remark-gfm'

const { serverRuntimeConfig } = getConfig()

type Path = { params: { slug: string } }

type Paths = Path[]

type StaticPathsResult = {
    paths: Paths
    fallback: boolean
}

type Content = {
    meta: IDocMeta
    mdxContent: {
        compiledSource: string
        frontmatter: Record<string, unknown>
        scope: Record<string, unknown>
    }
}

type StaticPropsResult = {
    props: {
        content: Content
    }
}

type DocsContent = Record<string, Content>

interface IContent {
    content: Content
}

export default function Details({ content }: IContent) {
    return (
        <Layout loading={!content}>
            <Head>
                <title>{`ROLLUPCODES | ${content?.meta?.title}`}</title>
                <meta name="description" content={content?.meta?.subtitle} />
            </Head>
            {content && (
                <div className={styles.pageContent}>
                    <div className={styles.hero}>
                        <Avatar
                            size={AvatarSize.LARGE}
                            src={content?.meta?.logo}
                            name={content?.meta?.title}
                        />
                    </div>
                    <div className={styles.pageGrid}>
                        <div id="sidebar" className={styles.sidebar} />
                        <div id="markdown" className={styles.docContent}>
                            <MDXRemote
                                {...content.mdxContent}
                                components={MDXShortcodes}
                            />
                        </div>
                    </div>
                </div>
            )}
            <Script src="../js/details.js" />
        </Layout>
    )
}

const getDocsContent = async (): Promise<DocsContent> => {
    const folder = 'src/docs/'
    const path = join(serverRuntimeConfig.APP_ROOT, folder)
    const files = fs.readdirSync(path)
    const markdownDocs = files.filter((file) => file.endsWith('.mdx'))

    // Get gray-matter data from each file.
    const docs: Record<string, { meta: IDocMeta; mdxContent: any }> = {}

    await Promise.all(
        markdownDocs.map(async (fileName) => {
            const fileContents = fs.readFileSync(`${folder}${fileName}`, 'utf8')
            const { data, content } = matter(fileContents)
            const mdxContent = await serialize(content, {
                mdxOptions: { remarkPlugins: [remarkGfm] },
            })

            const meta = {
                title: data?.title,
                logo: `../images/${fileName.replace('.mdx', '')}-logo.svg`,
                subtitle: data?.subtitle,
                slug: fileName.replace('.mdx', ''),
                labels: data?.labels,
            }

            docs[`${fileName.replace('.mdx', '')}`] = {
                meta,
                mdxContent,
            }
        })
    )

    return docs
}

const getDocsPaths = (): Paths => {
    const folder = 'src/docs/'
    const path = join(serverRuntimeConfig.APP_ROOT, folder)
    const files = fs.readdirSync(path)
    const markdownDocs = files.filter((file) => file.endsWith('.mdx'))

    // Get gray-matter data from each file.
    const paths: Paths = []

    markdownDocs?.map((fileName) => {
        return { params: { slug: fileName.replace('.mdx', '') } }
    })

    return paths
}

export async function getStaticPaths(): Promise<StaticPathsResult> {
    const paths = getDocsPaths()
    return { paths, fallback: false }
}

export const getStaticProps = async ({
    params,
}: Params): Promise<StaticPropsResult> => {
    const { slug } = params

    const contents = await getDocsContent()
    const content = contents[slug]

    return { props: { content } }
}
