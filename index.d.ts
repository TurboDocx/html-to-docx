/// <reference types="node" />

declare namespace HTMLtoDOCX {
    interface Margins {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
        header?: number;
        footer?: number;
        gutter?: number;
    }

    interface PageSize {
        width?: number;
        height?: number;
    }

    interface Row {
        cantSplit?: boolean;
    }

    interface Table {
        row?: Row;
        borderOptions?: {
            size?: number;
            stroke?: string;
            color?: string;
        };
        addSpacingAfter?: boolean;
    }

    interface LineNumberOptions {
        start: number;
        countBy: number;
        restart: "continuous" | "newPage" | "newSection";
    }

    interface HeadingSpacing {
        before?: number;
        after?: number;
    }

    interface HeadingStyle {
        font?: string;
        fontSize?: number;
        bold?: boolean;
        spacing?: HeadingSpacing;
        keepLines?: boolean;
        keepNext?: boolean;
        outlineLevel?: number;
    }

    interface HeadingConfig {
        heading1?: HeadingStyle;
        heading2?: HeadingStyle;
        heading3?: HeadingStyle;
        heading4?: HeadingStyle;
        heading5?: HeadingStyle;
        heading6?: HeadingStyle;
    }

    interface DocumentOptions {
        orientation?: "portrait" | "landscape";
        pageSize?: PageSize;
        margins?: Margins;
        title?: string;
        subject?: string;
        creator?: string;
        keywords?: string[];
        description?: string;
        lastModifiedBy?: string;
        revision?: number;
        createdAt?: Date;
        modifiedAt?: Date;
        headerType?: "default" | "first" | "even";
        header?: boolean;
        footerType?: "default" | "first" | "even";
        footer?: boolean;
        font?: string;
        fontSize?: number;
        complexScriptFontSize?: number;
        table?: Table;
        pageNumber?: boolean;
        skipFirstHeaderFooter?: boolean;
        lineNumber?: boolean;
        lineNumberOptions?: LineNumberOptions;
        numbering?: {
            defaultOrderedListStyleType?: string;
        };
        heading?: HeadingConfig;
        decodeUnicode?: boolean;
        /**
         * A CSS stylesheet applied to the content, header, and footer HTML.
         * Selectors (type, class, id, descendant, grouped, etc.) are resolved
         * with standard specificity and folded into each element's inline
         * style; an element's own inline `style` always wins. Embedded
         * `<style>` tags in the HTML are honored too. `!important`, at-rules,
         * and external `<link>` stylesheets are not supported.
         */
        css?: string;
        lang?: string;
        direction?: "ltr" | "rtl";
        preprocessing?: {
            skipHTMLMinify?: boolean;
        };
        imageProcessing?: {
            maxRetries?: number;
            verboseLogging?: boolean;
            downloadTimeout?: number;
            maxImageSize?: number;
            retryDelayBase?: number;
            minTimeout?: number;
            maxTimeout?: number;
            minImageSize?: number;
            maxCacheSize?: number;
            maxCacheEntries?: number;
            svgHandling?: "convert" | "native" | "auto";
            suppressSharpWarning?: boolean;
        };
    }
}

declare function HTMLtoDOCX(
    htmlString: string,
    headerHTMLstring?: string | null,
    documentOptions?: HTMLtoDOCX.DocumentOptions,
    footerHtmlString?: string | null,
): Promise<ArrayBuffer | Blob | Buffer>;

export = HTMLtoDOCX;
