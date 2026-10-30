import { NoSelectableTextError } from './parsers';
import { UnsupportedFileError } from './importDocument';

export function importErrorMessage(error: unknown): string {
  if (error instanceof UnsupportedFileError) {
    return 'Ce type de fichier n’est pas encore pris en charge.';
  }
  if (error instanceof NoSelectableTextError) {
    return 'Ce PDF ne contient pas de texte sélectionnable (il est probablement scanné). La reconnaissance de texte (OCR) n’est pas encore disponible.';
  }
  return 'L’import a échoué. Essayez un autre fichier.';
}
