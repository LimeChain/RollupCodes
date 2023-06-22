import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Headings } from '@utils/types'

export default function TermsOfService() {
    return (
        <Layout>
            <Typography
                variant={Headings.H3}
                fontWeight="400"
                textTransform="uppercase"
                textAlign="center"
                marginTop={64}
            >
                Terms of service
            </Typography>
        </Layout>
    )
}
