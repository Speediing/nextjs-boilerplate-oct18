/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseJsonContent } from './utils/parseContentJson'

const baseConfig = {
  assetsUrl: "https://www.potterybarn.com/",
  applicationUri: "https://assets.pbimgs.com/pbimgs/rk/images/dp/",
  headers: {
    "paw-base-context": "environment=prod-west;application=ecommerce;market=US;concept=PB",
    "paw-request-time": "2024-11-06T18:23:04.445461Z",
    "paw-application-uri": "https://www.potterybarn.com/",
    "paw-asset-uris": "static=https://www.potterybarn.com/.static/;scripts=https://www.potterybarn.com/.static/;images=https://assets.pbimgs.com/pbimgs/rk/images/dp/;ecmImages=https://assets.pbimgs.com/pbimgs/rk/images/dp/;",
    "paw-active-generations": "CAT=324110524;ECMCS=824451698;ECMHOMEPAGE=824451695;ECMMSG=824451701;ECMPAGES=824451700;ECMPROMOS=824451704;ENDECA=219031803;HOMEPAGE=112013.2;MISC=224110412;MSG=224110412;PROMOS=0;TMPL=224110412",
    "paw-active-properties": "borderfreeLocalization=US-USD-1;isMobile=0;isSeoBot=0",
    "paw-context": "generations=CAT ECMCS ECMHOMEPAGE ECMMSG ECMPAGES ECMPROMOS ENDECA HOMEPAGE MISC MSG PROMOS TMPL;properties=borderfreeLocalization isMobile isSeoBot",
    "paw-service-3": "contract=ecom.dp:1.0;context=3;uris=https://rk-internal-www.potterybarn.com/", "paw-context-3": "generations=CAT ECMCS ECMHOMEPAGE ECMMSG ECMPAGES ECMPROMOS ENDECA HOMEPAGE MISC MSG PROMOS TMPL;properties=borderfreeLocalization isMobile isSeoBot",
    "paw-service-5": "contract=ecom.dp.hostnameOnly:1.0;context=5;uris=https://www.potterybarn.com/",
    "paw-service-1": "contract=ecom.app.config:1.0;context=1;uris=https://ecommerce-ecom-app-config-all-prod.services.west.wsgc.com/",
    "paw-context-1": "properties=isMobile isSeoBot",
    "paw-service-2": "contract=ecom.svc.content.webapp:1.0;context=2 3 5;uris=https://ecommerce-ecom-svc-content-prod.services.west.wsgc.com/",
    "paw-context-2": "generations=CAT ECMCS ECMHOMEPAGE ECMPAGES ECMPROMOS MSG PROMOS TMPL;properties=isMobile isSeoBot",
    "paw-services-2": "dp-app-svc=3;dp-app-hostname=5", "paw-service-4": "contract=edap.app.config.service:1.0;uris=https://platform-svc-config-prod.services.west.wsgc.com/config-service/v2/feature-config/"
  },
  social: {
    facebook: {
      appId: "",
      fbLikeButtonEnabled: false,
    },
    pinterest: {
      pinterestEnabled: false,
    },
  },
};

/**
 * Fetch the content for the home page.
 * @returns {Object} the content object
 */
async function getData() {
  const res = await fetch('https://www.potterybarn.com/api/content/v1/content.json?subsystem=ECMHOMEPAGE', { next: { revalidate: 3600 } })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json()
}

/**
 * Fetch the home page content and parse it out to form the HTML
 * to be displayed on page.
 * @returns {string} the HTML to be displayed
 */
export default async function Home() {
  const response = await getData();
  const { contentString, scriptString } = parseJsonContent(response.desktop, baseConfig)
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pottery Barn Home</h1>
      <div className="content-mfe">
        <div className="desktopContentWrapper">
          <div className="responsive-content responsive-content-page MFE-HOMEPAGE" data-style="content-page">
            <div dangerouslySetInnerHTML={{ __html: contentString }} />
            <div dangerouslySetInnerHTML={{ __html: scriptString }} />
          </div>
        </div>
      </div>
    </main>
  )
}
