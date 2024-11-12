/* eslint-disable @typescript-eslint/no-explicit-any */
const YOUTUBE_VIDEO = "youtube";
const VIMEO_VIDEO = "vimeo";

let contentVimeoThumbnail = false;
let dataContent: string | string[] | null;

const scripts = [];

/**
 * Parses JSON from ecom-svc-content-webapp into an HTML string
 * @param { array } contentArray - the array of json objects to parse
 * @param { Object } config - configuration used in parsing the JSON content
 * @return { string } the resulting html string
 */
export function parseJsonContent(contentArray: any[], config: { assetsUrl: string; applicationUri: string; headers: { "paw-base-context": string; "paw-request-time": string; "paw-application-uri": string; "paw-asset-uris": string; "paw-active-generations": string; "paw-active-properties": string; "paw-context": string; "paw-service-3": string; "paw-context-3": string; "paw-service-5": string; "paw-service-1": string; "paw-context-1": string; "paw-service-2": string; "paw-context-2": string; "paw-services-2": string; "paw-service-4": string; }; social: { facebook: { appId: string; fbLikeButtonEnabled: boolean; }; pinterest: { pinterestEnabled: boolean; }; }; }) {
    let contentString = "";
    let scriptString = "";
    // Apply the parser logic to each element in the data array
    if (contentArray.length) {
        contentArray.forEach((content) => {
            const newContent = getParsedContent(content, config);
            contentString += newContent;
        });
    }
    let scriptMatches = contentString.matchAll(/<noscript(.+?)\/noscript>/gms);
    for(const script of scriptMatches) {
        let newScript = script[0].trim().replaceAll("noscript", "script");
        scriptString += newScript;
    };
    return { contentString, scriptString };
}

/**
 * Parse the content object and return the html associated with that type.
 * @param content {Object} the content to be parsed
 * @param config {Object} the configuration used to process the content
 * @returns {string} the HTML
 */
const getParsedContent = (content: { type: any; data: any; }, config: { assetsUrl: any; applicationUri: any; headers?: { "paw-base-context": string; "paw-request-time": string; "paw-application-uri": string; "paw-asset-uris": string; "paw-active-generations": string; "paw-active-properties": string; "paw-context": string; "paw-service-3": string; "paw-context-3": string; "paw-service-5": string; "paw-service-1": string; "paw-context-1": string; "paw-service-2": string; "paw-context-2": string; "paw-services-2": string; "paw-service-4": string; }; social?: { facebook: { appId: string; fbLikeButtonEnabled: boolean; }; pinterest: { pinterestEnabled: boolean; }; }; ecmMetadata?: any; }) => {
    const methodName = "getParsedContent";
    const { type, data } = content;

    switch (type) {
        case "CONTENT":
            dataContent = data.CONTENT;
            // html content strings are added to the output string
            return _cleanContent(data.CONTENT);

        case "wsgc.contextualappurl":
        case "wsgc.appurl":
            // Populate page links based on application url
            const path = _removePreceedingSlash(data.url);
            return `${config.applicationUri.concat(path)}`;

        case "wsgc.ecmasseturl":
            // This provides an absolute url for ecm images etc
            const root = config.applicationUri;
            return root + _removePreceedingSlash(data.url);

        case "ecm.includeAccordionScript":
            //Empty string returned to remove macro from content, as accordion behavior is handled with event listeners in ecm-content component.
            return "";

        case "ecm.displayVideo":
            if (
                dataContent &&
                dataContent.length &&
                dataContent.includes("vimeo-video-thumbnail")
            ) {
                contentVimeoThumbnail = true;
            }
            dataContent = null;
            return parseVideoMarkup(content, config);

        case "ecm.includeContent":
            console.error(
                `methodName - ${methodName} FTL imports and ecm.includeContent are not supported in MFE. Please use the custom JS component or the custom Vue component instead. (${
                    (data || {}).contentId
                })`,
            );
            return "";

        case "ecm.vue":
            return parseVueContent(content, config);

        case "ecmMetadata":
            config.ecmMetadata = data.ecmMetadata;
            return "";

        default:
            // default: log error for invalid type
            console.error(
                `No parser available for type ${type}`,
            );
            return "";
    }
};

const parseVueContent = (content: { type?: any; data: any; }, config: { assetsUrl?: any; applicationUri?: any; headers?: { "paw-base-context": string; "paw-request-time": string; "paw-application-uri": string; "paw-asset-uris": string; "paw-active-generations": string; "paw-active-properties": string; "paw-context": string; "paw-service-3": string; "paw-context-3": string; "paw-service-5": string; "paw-service-1": string; "paw-context-1": string; "paw-service-2": string; "paw-context-2": string; "paw-services-2": string; "paw-service-4": string; } | undefined; social?: { facebook: { appId: string; fbLikeButtonEnabled: boolean; }; pinterest: { pinterestEnabled: boolean; }; } | undefined; ecmMetadata?: any; componentMap?: any; }) => {
    const methodName = "parseVueContent";
    const { data } = content;

    let componentProps = [];
    let contentString = "";
    if (!data.name) {
        console.log(
            `methodName - ${methodName} component missing name property. Please publish component with 'name' property specified.`,
        );
        return contentString;
    }
    for (const item in data) {
        if (item !== "name" && item !== "macroType" && item !== "CONTENT") {
            componentProps.push({
                attributeName: `${item}`.trim(),
                attributeValue: `${data[item]}`.trim(),
            });
        }
    }
    // support re-mapping names from ecm into custom component names, if needed
    if (config?.componentMap?.[data.name]) {
        data.name = config?.componentMap?.[data.name];
    }
    // support re-mapping names from ecm into custom component names, if needed
    if (config?.componentMap?.[data.name]) {
        data.name = config?.componentMap?.[data.name];
    }
    componentProps = JSON.stringify(componentProps);

    contentString = `<div class="vue-reference-component ${data.name}" data-name="${data.name}" data-props=${componentProps}></div>`;

    return contentString;
};

/**
 * Parse video content.
 * @param content {Object} the content to be parsed
 * @param config {Object} the configuration used to process the content
 * @returns {string} HTML
 */
const parseVideoMarkup = (content: { type?: any; data: any; }, config: object) => {
    // This renders an embedded video, optionally with hooks to wrap it in a modal later
    // destinationURL is a property on the data object that will be used for embdedd video clickthroughs
    const { data } = content;
    // inverts the showControls flag
    const controlsParam = data && data.showControls ? `&amp;controls=0` : "";
    // playlist attribute required for youtube to loop single video
    const playlistParam =
        data && data.loopVideo ? `&amp;playlist=${data.videoId}` : "";
    const youtubeIframeUrl = `https://www.youtube.com/embed/${
        data.videoId
    }?enablejsapi=1&amp;version=3&amp;rel=0&amp;wmode=transparent&amp;modestbranding=1&amp;autoplay=${
        data.autoplay ? "1" : "0"
    }&amp;loop=${
        data.loopVideo ? "1" : "0"
    }&amp;mute=1${controlsParam}${playlistParam}`;

    const youtubeIframeThumbnail = `https://img.youtube.com/vi/${data.videoId}/sddefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${data.videoId}?wmode=transparent&autohide=1&autoplay=${data.autoplay}&iv_load_policy=3&fs=1&cc_load_policy=0&rel=0&showsearch=0&enablejsapi=1&version=3&webkitAllowFullScreen=webkitAllowFullScreen&mozallowfullscreen=mozallowfullscreen&allowFullScreen=allowFullScreen&theme=light&origin=${config.applicationUri}&widgetid=2`;

    if (!Object.hasOwn(config, "itemListElement")) {
        config.itemListElement = [];
    }

    config.itemListElement.push({
        "@type": "VideoObject",
        name: data.name,
        url: config.applicationUri,
        description: data.description,
        thumbnailUrl: youtubeIframeThumbnail,
        uploadDate: data?.uploadDate ?? `${new Date()}`,
        embedUrl: embedUrl,
    });

    let vimeoThumbnailUrl = "";

    if (Array.isArray(data.CONTENT) && data.CONTENT.length) {
        data.CONTENT.forEach((videoContent) => {
            if (videoContent.type === "wsgc.ecmasseturl") {
                vimeoThumbnailUrl =
                    config.assetsUrl +
                    _removePreceedingSlash(videoContent.data.url);
            }
        });
    }

    const vimeoIframeUrl = `https://player.vimeo.com/video/${data.videoId}${
        data.videoId.includes("?") ? "&amp;" : "?"
    }autoplay=${
        data.autoplay ? "true" : "false"
    }&amp;byline=0&amp;title=0&amp;loop=${
        data.loopVideo ? "true" : "false"
    }&amp;autopause=false&amp;muted=1${controlsParam}`;

    let socialIconsContent = "";
    let videoModalContentString = "";
    let videoContentString = "";
    let url = "";
    let videoSchemaObject;

    if (data.videoProvider && data.videoProvider === YOUTUBE_VIDEO) {
        url = youtubeIframeUrl;
    } else if (data.videoProvider === VIMEO_VIDEO) {
        url = vimeoIframeUrl;
    } else {
        // if videoProvider prop isn't present, fallback to videoId
        if (data.videoId.match(/[a-zA-Z]/)) {
            // If the video ID is youtube formatted, use a youtube iframe url
            url = youtubeIframeUrl;
        } else {
            // Otherwise, use a vimeo iframe url
            url = vimeoIframeUrl;
        }
    }

    if (data.CONTENT && data.CONTENT.length && !contentVimeoThumbnail) {
        // handle content array, for nested mixed content
        if (data.CONTENT.forEach) {
            data.CONTENT.forEach((videoContent: { type: any; data: any; }) => {
                videoModalContentString += getParsedContent(
                    videoContent,
                    config,
                );
            });
        } else {
            // handle content string
            videoContentString += _cleanContent(data.CONTENT);
        }
    }

    let componentProps = [];

    for (const item in data) {
        if (
            item !== "destinationUrl" &&
            item !== "name" &&
            item !== "description" &&
            item !== "macroType" &&
            item !== "CONTENT"
        ) {
            componentProps.push({
                attributeName: item,
                attributeValue: data[item],
            });
        }
    }

    const finalVueMarkup = `<div class="vue-video-component" data-name="VideoContent" data-props=${JSON.stringify(
        componentProps,
    )}> </div>`;

    const videoMarkup =
        data.videoProvider === VIMEO_VIDEO
            ? `<div class="responsive-video-wrapper"> 
            <vimeo-video 
                thumbnail="${vimeoThumbnailUrl}"
                url="${url}" 
                ${data.destinationUrl ? `destination-url=${config.applicationUri.concat(_removePreceedingSlash(data.destinationUrl))}` : ""}
                ${data.showControls ? "" : "controls"}
                ${data.autoplay ? "autoplay" : ""}
                ${data.loopVideo ? "loop" : ""}
                ${data.CONTENT && data.CONTENT.length && !contentVimeoThumbnail ? "is-video-modal" : ""}
                ${data.width ? `width=${data.width}` : ""} 
                ${data.height ? `height=${data.height}` : ""}>
                
            </vimeo-video>
            ${
                videoContentString
                    ? `<div class="videoContent">${videoContentString}</div>`
                    : ""
            }
        </div>`
            : `<div class="responsive-video-wrapper">
          <iframe class="responsiveVideo" src="${url}" ${
                  data.width ? `width=${data.width}` : ""
              } ${
                  data.height ? `height=${data.height}` : ""
              } webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" allowfullscreen="allowfullscreen"></iframe>
          ${
              videoContentString
                  ? `<div class="videoContent">${videoContentString}</div>`
                  : ""
          }
        </div>`;

    videoSchemaObject = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: config.itemListElement,
    };

    videoSchemaObject["itemListElement"].forEach((video, index) => {
        video.position = index + 1;
    });

    config.videoSchemaObject = videoSchemaObject;

    if (!data.isOverlay && config.lazyLoadVideosEnabled) {
        return finalVueMarkup;
    } else if (!data.isOverlay) {
        return videoMarkup;
    }

    const overlayLinkMatch = videoModalContentString.match(
        /href="#id([0-9a-zA-Z]+)"/i,
    );
    const overlayLink = overlayLinkMatch ? `id${overlayLinkMatch[1]}` : "";
    data.overlayLinkId = overlayLink || data.overlayLinkId;

    if (data.displaySocialIcons) {
        const thumbnailImageSrc = _extractImgSrc(videoModalContentString);
        const fbLikeWidget = `<li class="facebook">
                              <div class="fb-like" 
                                  data-href="${url}" 
                                  data-layout="button_count" 
                                  data-send="false" 
                                  data-width="90" 
                                  data-action="like" 
                                  data-show-faces="true" 
                                  data-colorscheme="light" 
                                  data-font="verdana" 
                                  width="90"></div>
                             </li>`;
        const pinterestWidget = `<li class="pinterest">
                                  <a href="http://pinterest.com/pin/create/button/" 
                                      class="pin-it-button" 
                                      data-pin-do="buttonPin" 
                                      data-pin-url="${url}" 
                                      data-pin-media="${thumbnailImageSrc}" 
                                      data-pin-description="${data.description}" 
                                      data-pin-count="beside">
                                  </a>
                                </li>`;

        socialIconsContent = `<div>
                                <ul class="social-icons">
                                  ${
                                      config.social.facebook.fbLikeButtonEnabled
                                          ? fbLikeWidget
                                          : ""
                                  }
                                  ${
                                      config.social.pinterest.pinterestEnabled
                                          ? pinterestWidget
                                          : ""
                                  }
                                </ul>
                              </div>`;
    }

    contentVimeoThumbnail = false;

    return `<div class="videoThumbnail modal">
                  <div class="thumbnailContent">
                    ${videoModalContentString}
                  </div>
                  <div class="modalHook" id="${data.overlayLinkId}">
                    ${videoMarkup}
                    ${socialIconsContent}
                  </div>
                </div>`;
};

/**
 * Utility to lift image src attributes for legacy video thumbnails
 * @param {string} content - to process
 * @returns {string} the video attributes
 */
const _extractImgSrc = (content: string) => {
    const imgSources = content.match(/src\s*=\s*"(.+?)"/gm);
    return (
        imgSources &&
        imgSources[0] &&
        imgSources[0].substring(5, imgSources[0].length - 1)
    );
};

// Utility to ensure URI has no initial slash
const _removePreceedingSlash = (path: string) => {
    return path.startsWith("/") ? path.substring(1) : path;
};

/** 
 * Utility to clean up content string
 * @param content {string} the string gto process
 * @return {string} Update specific tags to allow correct rendering
 */
const _cleanContent = (content: string) => {
    let cleanContent = content
        .replace(/<noscript\W*data-tag-name=\"script\"(.+?)(<\/noscript>)/gmis, "<noscript type='text/javascript'$1</noscript>")
        .replace(/\&quot;/gmi, "'")
        .replace(/\&gt;/gmi, ">")
        .replace(/<body/gi, "<div")
        .replace(/<\/body/gi, "</div");
    
    return cleanContent;
}
    
