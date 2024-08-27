/**
 * Representa un usuario con su identificador único y nombre de usuario (opcional).
 */
export interface User {
    /**
     * Identificador único del usuario.
     */
    id: number;

    /**
     * Nombre de usuario del usuario (opcional).
     */
    username?: string;
}
