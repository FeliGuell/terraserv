/**
 * Representa una respuesta de un estudio con su estado, resultado y mensaje asociado.
 */
export interface ResponseEstudio {
    /**
     * Estado de la respuesta.
     */
    status: string;

    /**
     * Resultado de la respuesta (puede ser de cualquier tipo).
     */
    result: any;

    /**
     * Mensaje asociado con la respuesta.
     */
    message: string;
}
