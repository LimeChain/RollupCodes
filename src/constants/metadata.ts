import { IMetadata } from '@utils/types'

type MetadataConfig = Record<string, IMetadata>

const metadataConfig: MetadataConfig = {
    '/': {
        title: 'Rollup Codes',
        description: 'Interactive reference of the ethereum rollup ecosystem',
    }
}

export default metadataConfig
