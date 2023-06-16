import metadataConfig from '@constants/metadata'
import { IMetadata } from '@utils/types'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

const useMetadata = (): IMetadata => {
    const router = useRouter()

    const metadata = useMemo(
        () => metadataConfig[router?.pathname] ?? metadataConfig['/'],
        [router?.pathname]
    )

    return metadata
}

export default useMetadata
