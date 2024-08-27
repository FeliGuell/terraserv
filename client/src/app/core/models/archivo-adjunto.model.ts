/**
 * Representa un archivo adjunto del Estudio Geofísico con sus propiedades asociadas.
 */
export class ArchivoAdjunto {
  /**
   * Identificador único del archivo adjunto.
   */
  id: number;

  /**
   * Clave única del archivo en el almacenamiento.
   */
  archivoKey: string;

  /**
   * URL del archivo adjunto (opcional).
   */
  archivoUrl?: string;

  /**
   * Nombre del archivo adjunto (opcional).
   */
  archivoFileName?: string;

  /**
   * Tamaño del archivo adjunto en bytes (opcional).
   */
  archivoSize?: number;

  /**
   * Indica si el botón de eliminación está deshabilitado (opcional).
   */
  deleteButtonDisabled?: boolean;
}