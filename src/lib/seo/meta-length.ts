export const DOCUMENT_TITLE_MIN = 50;
export const DOCUMENT_TITLE_MAX = 60;
export const META_DESCRIPTION_MIN = 150;
export const META_DESCRIPTION_MAX = 160;

export function withBrandTitle(title: string) {
  return `${title} | Run Without Stops`;
}

export function isDocumentTitleLength(title: string) {
  return title.length >= DOCUMENT_TITLE_MIN && title.length <= DOCUMENT_TITLE_MAX;
}

export function isMetaDescriptionLength(description: string) {
  return description.length >= META_DESCRIPTION_MIN && description.length <= META_DESCRIPTION_MAX;
}
