import Layout from '@components/Layout'
import Typography from '@components/Typography'
import { Headings, Text } from '@utils/types'
import styles from './styles.module.scss'
import Link from 'next/link'
import Hero from '@components/Hero'
import { createRef, useEffect, useState } from 'react'

export default function PrivacyPolicy() {
    const heroRef = createRef()
    const [additionalPaddingTop, setAdditionalPaddingTop] = useState<
        number | undefined
    >(0)

    useEffect(() => {
        if (heroRef) {
            setAdditionalPaddingTop(heroRef?.current?.offsetHeight)
        }
    }, [heroRef])

    return (
        <Layout paddingTop={additionalPaddingTop}>
            <Hero ref={heroRef}>
                <Typography variant={Headings.H3} fontWeight="700">
                    Privacy Policy
                </Typography>
            </Hero>
            <Typography
                variant={Headings.H5}
                fontWeight="400"
                marginTop={40}
                marginBottom={24}
            >
                Effective Date: June 29, 2023
            </Typography>
            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                Welcome to RollupCodes. This Privacy Policy explains how we use
                your information, including any data collected from your use of
                our website. Please read it carefully to understand our
                practices and your rights.
            </Typography>

            <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
                What Information We Collect and How We Use It
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                RollupCodes does not directly collect any personal data.
                However, we use third-party services, Google Analytics and
                Vercel Speed Insights, to help us understand how our website is
                used and how we can improve your experience. These services
                collect aggregate data about our website traffic and
                interactions.
            </Typography>

            <Typography variant={Headings.H6} fontWeight="700" marginBottom={8}>
                Google Analytics
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                We use Google Analytics to help us understand how our users use
                the site. The data collected includes your IP address, browser
                type, operating system, the web pages you view, the links you
                click, and other actions taken on our website. Google Analytics
                does not identify individual users or associate your IP address
                with any other data held by Google. We use the information we
                get from Google Analytics only to improve this site. For more
                information on how Google uses data when you use our site, visit
                Google’s privacy & terms.
            </Typography>

            <Typography variant={Headings.H6} fontWeight="700" marginBottom={8}>
                Vercel Speed Insights
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                We use Vercel Speed Insights to analyze the performance of our
                website. This tool provides us with aggregate data on website
                speed and performance, which helps us optimize the user
                experience. Vercel Speed Insights does not collect personally
                identifiable information.
            </Typography>

            <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
                Third-Party Links
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                Our website may contain links to other websites. Please be aware
                that we are not responsible for the privacy practices of other
                websites. We encourage our users to be aware when they leave our
                website and to read the privacy statements of each and every
                website that collects personally identifiable information.
            </Typography>

            <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
                Privacy Policy Changes
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={40}
                color={'var(--privacy-policy-text-color)'}
            >
                We may update this Privacy Policy from time to time to reflect
                changes in our practices. Any changes will be effective
                immediately upon the posting of the revised Privacy Policy.
            </Typography>

            <Typography variant={Headings.H5} fontWeight="700" marginBottom={8}>
                Contact Us
            </Typography>

            <Typography
                variant={Text.BODY2}
                fontWeight="400"
                marginBottom={80}
                color={'var(--privacy-policy-text-color)'}
            >
                If you have questions or concerns about this privacy policy,
                please contact us at{' '}
                <Link
                    href="mailto:rollup.codes@limechain.tech"
                    className={styles.link}
                >
                    rollup.codes@limechain.tech
                </Link>
            </Typography>
        </Layout>
    )
}
