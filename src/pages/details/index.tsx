import Avatar from '@components/Avatar'
import Layout from '@components/Layout'
import { AvatarSize, IRollup, IRollupMeta } from '@utils/types'
import { join } from 'path'
import fs from 'fs'
import getConfig from 'next/config'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import styles from './styles.module.scss'
import LinksGroup from './components/LinksGroup'
import { MDXRemote } from 'next-mdx-remote'
import MDXComponentsMap from '@components/MDXComponents'
import Head from 'next/head'

const { serverRuntimeConfig } = getConfig()

interface IDetailsProps {
    rollups: Record<any, IRollup>
    name: string
    paths: any
}

export default function Details({ rollups, paths }: IDetailsProps) {
    const router = useRouter()
    console.log('PATHS', paths)

    const details = useMemo(
        () => rollups[`${router?.query?.slug}`],
        [router?.query?.slug]
    )

    return (
        <Layout loading={!details}>
            <Head>
                <title>{`ROLLUPCODES | ${details?.meta?.name}`}</title>
                <meta name="description" content={details?.meta?.summary} />
            </Head>
            {details && (
                <div className={styles.pageContent}>
                    <div className={styles.hero}>
                        <Avatar
                            size={AvatarSize.LARGE}
                            name={details?.meta?.name as string}
                        />
                        <LinksGroup />
                    </div>
                    <MDXRemote
                        {...details.mdxSource}
                        components={MDXComponentsMap}
                    />
                </div>
            )}
        </Layout>
    )
}

export const getStaticProps = async () => {
    const docsPath = join(serverRuntimeConfig.APP_ROOT, 'src/docs/rollups')
    const docs = fs.readdirSync(docsPath)

    let rollups: Record<any, IRollup> = {}
    let paths: any = []

    await Promise.all(
        docs.map(async (doc) => {
            try {
                const markdownWithMeta = fs.readFileSync(
                    join(docsPath, doc),
                    'utf-8'
                )
                const { data, content } = matter(markdownWithMeta)
                const mdxSource = await serialize(content)

                rollups[data.name.toLowerCase().replace(' ', '-')] = {
                    meta: data as IRollupMeta,
                    mdxSource,
                }

                paths.push({
                    params: { slug: data.name.toLowerCase().replace(' ', '-') },
                })
            } catch (error) {
                console.debug(
                    "Couldn't read the Markdown doc for the opcode",
                    error
                )
            }
        })
    )

    return { props: { rollups, paths } }
}
