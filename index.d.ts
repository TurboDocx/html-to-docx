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
        /** A heading in a table cell as a Word heading (its HeadingN style); off by default. */
        cellHeadings?: boolean;
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

    interface SectionOptions {
        orientation?: "portrait" | "landscape";
        pageSize?: PageSize;
        margins?: Margins;
        headerHTML?: string | null;
        footerHTML?: string | null;
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
        /**
         * Word's "Different first page": page 1's own header and footer, written
         * as the first section's first-page parts. An empty one leaves page 1's
         * band blank.
         */
        firstPage?: { headerHTML?: string | null; footerHTML?: string | null };
        /** Every page section but the last, which is the document's own. */
        sections?: SectionOptions[];
        /**
         * Lay the document out the way a browser renders the HTML: CSS line height,
         * em/rem sizes, margins, padding, borders, table header rows and the data-*
         * features. Off by default, which keeps 1.23.3's output.
         */
        browserLayout?: boolean;
        /**
         * Fonts for the glyphs no common text font has, used with browserLayout. `checkbox`
         * draws the checklist boxes (default "Segoe UI Symbol", with "DejaVu Sans" as its
         * font table alternative); `glyph` draws data-bullet characters outside Arial's set
         * (default "DejaVu Sans", with "Segoe UI Symbol" as its alternative). Name your own
         * font, for instance one you embed or install, to draw them in it.
         */
        symbolFont?: {
            checkbox?: string;
            glyph?: string;
        };
        lineNumber?: boolean;
        lineNumberOptions?: LineNumberOptions;
        numbering?: {
            defaultOrderedListStyleType?: string;
            /** Each list level's indent, in twips (Word's 720). */
            levelIndent?: number;
            /** How far a list marker hangs before the text, in twips (Word's 360). */
            hangingIndent?: number;
        };
        heading?: HeadingConfig;
        decodeUnicode?: boolean;
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
