import { create } from 'xmlbuilder2';
import namespaces from '../namespaces';
import { applicationName } from '../constants';

const xmlnsNamespace = 'http://www.w3.org/2000/xmlns/';

// # Reason: The properties are text supplied by the caller. They are written as text nodes so the
// serializer escapes them once, instead of being interpolated into an XML string where `<` would
// be parsed as markup and an entity would be escaped a second time.
const generateCoreXML = (
  title = '',
  subject = '',
  creator = applicationName,
  keywords = [applicationName],
  description = '',
  lastModifiedBy = applicationName,
  revision = 1,
  createdAt = new Date(),
  modifiedAt = new Date()
) => {
  const coreProperties = create({ encoding: 'UTF-8', standalone: true })
    .ele(namespaces.coreProperties, 'cp:coreProperties')
    .att(xmlnsNamespace, 'xmlns:dc', namespaces.dc)
    .att(xmlnsNamespace, 'xmlns:dcterms', namespaces.dcterms)
    .att(xmlnsNamespace, 'xmlns:dcmitype', namespaces.dcmitype)
    .att(xmlnsNamespace, 'xmlns:xsi', namespaces.xsi);

  coreProperties.ele(namespaces.dc, 'dc:title').txt(String(title));
  coreProperties.ele(namespaces.dc, 'dc:subject').txt(String(subject));
  coreProperties.ele(namespaces.dc, 'dc:creator').txt(String(creator));
  if (keywords && Array.isArray(keywords)) {
    coreProperties.ele(namespaces.coreProperties, 'cp:keywords').txt(keywords.join(', '));
  }
  coreProperties.ele(namespaces.dc, 'dc:description').txt(String(description));
  coreProperties.ele(namespaces.coreProperties, 'cp:lastModifiedBy').txt(String(lastModifiedBy));
  coreProperties.ele(namespaces.coreProperties, 'cp:revision').txt(String(revision));
  coreProperties
    .ele(namespaces.dcterms, 'dcterms:created')
    .att(namespaces.xsi, 'xsi:type', 'dcterms:W3CDTF')
    .txt(createdAt instanceof Date ? createdAt.toISOString() : new Date().toISOString());
  coreProperties
    .ele(namespaces.dcterms, 'dcterms:modified')
    .att(namespaces.xsi, 'xsi:type', 'dcterms:W3CDTF')
    .txt(modifiedAt instanceof Date ? modifiedAt.toISOString() : new Date().toISOString());

  return coreProperties.doc().toString({ prettyPrint: true });
};

export default generateCoreXML;
