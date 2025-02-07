import { Breadcrumbs } from '@utils/types'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

const normalizedRollupTitles: {[key: string]: string} = {
    'arbitrum-one': 'Arbitrum One',
    'base': 'Base',
    'blast': 'Blast',
    'linea': 'Linea',
    'optimism': 'Optimism',
    'polygon-zkevm': 'Polygon zkEVM',
    'scroll': 'Scroll',
    'taiko': 'Taiko',
    'zksync-era': 'ZKsync Era'
}

const useBreadcrumbs = (): Breadcrumbs => {
    const router = useRouter()
    function generateBreadcrumbs() {
        // Remove any query parameters, as those aren't included in breadcrumbs
        const asPathWithoutQuery = router.asPath.split('?')[0]

        // Break down the path between "/"s, removing empty entities
        // Ex:"/my/nested/path" --> ["my", "nested", "path"]
        const asPathNestedRoutes = asPathWithoutQuery
            .split('/')
            .filter((v) => v.length > 0)

        // Iterate over the list of nested route parts and build
        // a "crumb" object for each one.
        const crumblist = asPathNestedRoutes.map((subpath, idx) => {
            // We can get the partial nested route for the crumb
            // by joining together the path parts up to this point.
            const href = '/' + asPathNestedRoutes.slice(0, idx + 1).join('/')
            // The title will just be the route string for now
            const title = normalizedRollupTitles[subpath.split('#')[0]] || subpath.split('#')[0]
            return { href, title }
        })

        // Add in a default "Home" crumb for the top-level
        return [{ href: '/', title: 'Main' }, ...crumblist]
    }

    // Call the function to generate the breadcrumbs list
    return useMemo(() => generateBreadcrumbs(), [router?.asPath])
}

export default useBreadcrumbs
