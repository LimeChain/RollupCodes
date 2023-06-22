import Avatar from '@components/Avatar'
import Layout from '@components/Layout'
import { AvatarSize, IDocMeta, IRollup } from '@utils/types'
import { join } from 'path'
import fs from 'fs'
import getConfig from 'next/config'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import styles from './styles.module.scss'
import { MDXRemote } from 'next-mdx-remote'
import Head from 'next/head'
import Script from 'next/script'

const { serverRuntimeConfig } = getConfig()

interface IDetailsProps {
    rollups: Record<any, IRollup>
    name: string
    contents: any
}

export default function Details({ contents }: IDetailsProps) {
    const router = useRouter()

    const content = useMemo(
        () => contents[`${router?.query?.slug}`],
        [router?.query?.slug]
    )

    return (
        <Layout loading={!content}>
            <Head>
                <title>{`ROLLUPCODES | ${content?.meta?.title}`}</title>
                <meta name="description" content={content?.meta?.summary} />
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
                        <div className={'sidebar'} />
                        <div className={styles.docContent}>
                            <MDXRemote {...content.mdxContent} />
                        </div>
                    </div>
                </div>
            )}
            <Script src="js/details.js" />
        </Layout>
    )
}

const getDocsContent = async () => {
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
            const mdxContent = await serialize(content)

            const meta = {
                title: data?.title,
                logo: `images/${fileName.replace('.mdx', '')}-logo.svg`,
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

const getDocsPaths = () => {
    const folder = 'src/docs/'
    const path = join(serverRuntimeConfig.APP_ROOT, folder)
    const files = fs.readdirSync(path)
    const markdownDocs = files.filter((file) => file.endsWith('.mdx'))

    // Get gray-matter data from each file.
    const paths: Record<string, Record<string, { slug: string }>>[] = []

    markdownDocs?.map((fileName) => {
        return { params: { slug: fileName.replace('.mdx', '') } }
    })

    // await Promise.all(
    //     markdownDocs.map((fileName) => {
    //         const fileContents = fs.readFileSync(`${folder}${fileName}`, 'utf8')
    //         const matterResult = matter(fileContents)
    //         docs.push({
    //             title: matterResult?.data?.title,
    //             logo: `images/${fileName.replace('.mdx', '')}-logo.svg`,
    //             subtitle: matterResult?.data?.subtitle,
    //             slug: fileName.replace('.mdx', ''),
    //             labels: matterResult?.data?.labels,
    //         })
    //     })
    // )

    return paths
}

export async function getStaticPaths() {
    const paths = getDocsPaths()
    return { paths, fallback: false }
}

export const getStaticProps = async () => {
    const contents = await getDocsContent()

    return { props: { contents } }
}
