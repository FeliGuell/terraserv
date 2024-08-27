/**
 * Representa una solicitud de inicio de sesión con nombre de usuario y contraseña.
 */
export interface LoginRequest {
    /**
     * Nombre de usuario proporcionado para el inicio de sesión.
     */
    username: string;

    /**
     * Contraseña proporcionada para el inicio de sesión.
     */
    password: string;
}
