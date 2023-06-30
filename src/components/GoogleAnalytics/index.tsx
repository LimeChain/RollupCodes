import Script from 'next/script'

const Googleanalytics = () => {
    return (
        <>
            {process.env.NODE_ENV === 'production' && (
                <Script
                    id="ga"
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
                    })(window, document, 'script', 'dataLayer', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID}');`,
                    }}
                />
            )}
        </>
    )
}

export default Googleanalytics
