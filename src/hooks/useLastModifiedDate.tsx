import { add, format, getTime } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

const storageKeys = {
    LAST_TIME_CHECKED: 'last_time_checked',
    LAST_TIME_MODIFIED: 'last_time_modified',
}

const source: Record<string, string> = {
    main: 'https://api.github.com/repos/limechain/RollupCodes/commits/main',
    dedicated:
        'https://api.github.com/repos/limechain/RollupCodes/commits?path=./src/docs/',
}

const getLastTimeModified = (key: string): number | null => {
    const value = localStorage?.getItem(key)
    if (value) {
        return parseInt(value)
    }

    return null
}

const getLastTimeChecked = (key: string): number | null => {
    const value = localStorage?.getItem(key)
    if (value) {
        return parseInt(value)
    }

    return null
}

const storeLastTimeModified = (key: string, value: number) =>
    localStorage?.setItem(key, JSON.stringify(value))

const storeLastTimeChecked = (key: string, value: number) =>
    localStorage?.setItem(key, JSON.stringify(value))

const useLastModifiedDate = (slug?: string): string => {
    const NOW_IN_MS = +new Date()
    const [lastModifiedTs, setLastModifiedTs] = useState<number>(0)

    const storageModifiedKey = slug
        ? `${storageKeys.LAST_TIME_MODIFIED}_${slug}`
        : storageKeys.LAST_TIME_MODIFIED
    const storageCheckedKey = slug
        ? `${storageKeys.LAST_TIME_CHECKED}_${slug}`
        : storageKeys.LAST_TIME_CHECKED

    const retreiveLastModifiedTs = async () => {
        const url = `${source[slug ? 'dedicated' : 'main']}${
            slug ? `${slug}.mdx` : ''
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
        const storedLastModifiedTsValue =
            getLastTimeModified(storageModifiedKey)
        const stroredLastCheckedTsValue = getLastTimeChecked(storageCheckedKey)

        if (
            !storedLastModifiedTsValue ||
            !stroredLastCheckedTsValue ||
            getTime(add(new Date(stroredLastCheckedTsValue), { hours: 24 })) <
                NOW_IN_MS
        ) {
            retreiveLastModifiedTs()
        } else {
            setLastModifiedTs(+new Date(storedLastModifiedTsValue))
        }
    }, [])

    const formattedDate = useMemo(
        () => format(new Date(lastModifiedTs), 'd LLL yyyy'),
        [lastModifiedTs]
    )

    return formattedDate
}

export default useLastModifiedDate
