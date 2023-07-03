import Script from 'next/script'
import { useEffect, useState } from 'react'

const Googleanalytics = () => {
    const [isProductionOrigin, setIsProductionOrigin] = useState<boolean>(false)
    const isProduction = process.env.NODE_ENV === 'production'

    useEffect(() => {
        if (typeof window != 'undefined') {
            console.log(window.location)

            setIsProductionOrigin(
                window.location.origin === 'https://www.rollup.codes'
            )
        }
    }, [])

    if (!isProduction || !isProductionOrigin) {
        return null
    }

    return (
        <>
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
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
                        })(window, document, 'script', 'dataLayer', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`,
                }}
            />
        </>
    )
}

export default Googleanalytics
