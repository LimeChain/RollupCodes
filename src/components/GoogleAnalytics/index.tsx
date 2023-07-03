import Script from 'next/script'
import { useEffect, useState } from 'react'

const Googleanalytics = () => {
    const [domain, setDomain] = useState<string>('')
    const IS_PRODUCTION = process.env.NODE_ENV === 'production'
    const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID
    const PRODUCTION_DOMAIN = 'www.rollup.codes'

    useEffect(() => {
        if (typeof window != 'undefined') {
            console.log(window.location)

            setDomain(window.location.hostname)
        }
    }, [])

    if (!GA_TRACKING_ID || !IS_PRODUCTION || PRODUCTION_DOMAIN !== domain) {
        return null
    }

    return (
        <>
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${GA_TRACKING_ID}`}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                />
            </noscript>
            <Script
                id="google-analytics"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(w, d, s, l, i) {
                            w[l] = w[l] || [];
                            w[l].push({
                                'gtm.start': new Date().getTime(),
                                event: 'gtm.js'
                            });
                            var f = d.getElementsByTagName(s)[0],
                                j = d.createElement(s),
                                dl = l != 'dataLayer' ? '&l=' + l : '';
                            j.async = true;
                            j.src =
                                'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                            f.parentNode.insertBefore(j, f);
                        })(window, document, 'script', 'dataLayer', '${GA_TRACKING_ID}');`,
                }}
            />
        </>
    )
}

export default Googleanalytics
