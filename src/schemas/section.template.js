import namespaces from '../namespaces';

/**
 * The root of a header or footer part: <w:hdr> or <w:ftr>, declaring the
 * prefixes document.xml's root declares (document.template.js), plus wps for
 * the page furniture's shapes.
 *
 * Declared, not implied, because xmlbuilder2 writes an element with whatever
 * prefix is in scope for its namespace. Under a root that declared none, a
 * band came out as <hdr xmlns="…"> with every child unprefixed and every
 * attribute given a generated ns1:, ns2: prefix. The same XML to Word — but
 * not to docxtemplater, or anything else that reads `w:t` by name: a
 * {placeholder} in a header or footer could be neither found nor filled in.
 *
 * @param {'header'|'footer'} type - Which band the part is
 * @returns {string} The part, with an empty root to import the band's content into
 */
const generateSectionTemplate = (type) => {
  const root = type === 'footer' ? 'w:ftr' : 'w:hdr';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <${root}
        xmlns:a="${namespaces.a}"
        xmlns:cdr="${namespaces.cdr}"
        xmlns:o="${namespaces.o}"
        xmlns:pic="${namespaces.pic}"
        xmlns:r="${namespaces.r}"
        xmlns:v="${namespaces.v}"
        xmlns:ve="${namespaces.ve}"
        xmlns:vt="${namespaces.vt}"
        xmlns:w="${namespaces.w}"
        xmlns:w10="${namespaces.w10}"
        xmlns:wp="${namespaces.wp}"
        xmlns:wne="${namespaces.wne}"
        xmlns:wps="${namespaces.wps}"
        ></${root}>`;
};

export default generateSectionTemplate;
