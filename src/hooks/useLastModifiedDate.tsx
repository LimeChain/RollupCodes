import { add, format, getTime } from 'date-fns'
import { useEffect, useState } from 'react'

const storageKeys = {
    LAST_CHECKED: 'last_checked',
    LAST_MODIFIED: 'last_modified',
}

const source: Record<string, string> = {
    main: 'https://api.github.com/repos/limechain/RollupCodes/commits/main',
    dedicated:
        'https://api.github.com/repos/limechain/RollupCodes/commits?path=./src/docs/',
}

const getLastTimeModified = (key: string): string =>
    localStorage?.getItem(key) || ''

const getLastTimeChecked = (key: string): string =>
    localStorage?.getItem(key) || ''

const storeLastTimeModified = (key: string, value: number) =>
    localStorage?.setItem(key, JSON.stringify(value))

const storeLastTimeChecked = (key: string, value: number) =>
    localStorage?.setItem(key, JSON.stringify(value))

const useLastModifiedDate = (slug?: string): string => {
    const NOW_IN_MS = +new Date()

    const [storedLastModifiedTs, setStoredLastModifiedTs] = useState<number>(0)

    const [storedLastCheckedTs, setStoredLastCheckedTs] = useState<number>(0)

    const [lastModifiedTs, setLastModifiedTs] = useState<number>(0)

    const storageModifiedKey = slug
        ? `${storageKeys.LAST_MODIFIED}_${slug}`
        : storageKeys.LAST_MODIFIED
    const storageCheckedKey = slug
        ? `${storageKeys.LAST_CHECKED}_${slug}`
        : storageKeys.LAST_CHECKED

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            setStoredLastModifiedTs(
                parseInt(getLastTimeModified(storageModifiedKey))
            )
            setStoredLastCheckedTs(
                parseInt(getLastTimeChecked(storageCheckedKey))
            )
        }
    }, [])

    const retreiveLastModifiedTs = async () => {
        const url = `${source[slug ? 'dedicated' : 'main']}${
            slug ? `/${slug}.mdx` : ''
        }`
        try {
            const result = await fetch(url)
            const data = await result.json()
            const date = Array.isArray(data)
                ? data[0]?.commit?.author?.date
                : data?.commit?.author?.date

            if (date) {
                setLastModifiedTs(+new Date(date))
                storeLastTimeModified(storageModifiedKey, +new Date(date))
                storeLastTimeChecked(storageCheckedKey, NOW_IN_MS)
            }
        } catch (_) {}
    }

    useEffect(() => {
        if (
            storedLastCheckedTs &&
            getTime(add(new Date(storedLastCheckedTs), { hours: 24 })) <
                NOW_IN_MS
        ) {
            retreiveLastModifiedTs()
        }
    }, [storedLastCheckedTs])

    return lastModifiedTs
        ? format(new Date(lastModifiedTs), 'd LLL yyyy')
        : format(new Date(storedLastModifiedTs), 'd LLL yyyy')
}

export default useLastModifiedDate
