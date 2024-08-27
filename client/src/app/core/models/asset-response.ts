/**
 * Representa la respuesta de un activo que contiene archivos y un mensaje.
 */
export interface AssetResponse {
  /**
   * Lista de archivos asociados con el activo.
   * Cada archivo incluye su nombre, tamaño, clave y URL.
   */
  files: {
      /**
       * Nombre del archivo.
       */
      fileName: string;

      /**
       * Tamaño del archivo en bytes.
       */
      size: number;

      /**
       * Clave única del archivo en el almacenamiento.
       */
      key: string;

      /**
       * URL del archivo.
       */
      url: string;
  }[];

  /**
   * Mensaje relacionado con la respuesta del activo.
   */
  message: string;
}

