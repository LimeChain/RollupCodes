import { IMetadata } from '@utils/types'

type MetadataConfig = Record<string, IMetadata>

const metadataConfig: MetadataConfig = {
    '/': {
        title: 'ROLLUPCODES',
        description: 'Interactive reference of the ethereum rollup ecosystem',
    },
    '/terms-of-service': {
        title: 'ROLLUPCODES | ToS',
        description: 'Interactive reference of the ethereum rollup ecosystem',
    },
    '*': {
        title: 'ROLLUPCODES | 404',
        description: 'Interactive reference of the ethereum rollup ecosystem',
    },
}

export default metadataConfig
