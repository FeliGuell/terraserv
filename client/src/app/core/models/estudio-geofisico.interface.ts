import { ArchivoAdjunto } from "./archivo-adjunto.model";
import { Coordenada } from "./coordenada.interface";
import { EnumAreaAplicacionEstudioGeofisico } from "./enums/area-estudio.enum";
import { EnumTipoEstudioGeofisico } from "./enums/tipo-estudio.enum";
import { Imagen } from "./imagen/imagen.model";

/**
 * Representa un estudio geofísico con sus propiedades asociadas.
 */
export interface EstudioGeofisico {
    /**
     * Identificador único del estudio geofísico (opcional).
     */
    id?: number;

    /**
     * Nombre del estudio geofísico (opcional).
     */
    nombreEstudio?: string;

    /**
     * Nombre del cliente para el que se realizó el estudio (opcional).
     */
    nombreCliente?: string;

    /**
     * Descripción del estudio geofísico (opcional).
     */
    descripcion?: string;

    /**
     * Fecha en la que se realizó el estudio geofísico en formato de cadena (opcional).
     */
    fechaRealizado?: string;

    /**
     * Ubicación donde se realizó el estudio geofísico (opcional).
     */
    ubicacionEstudio?: string;

    /**
     * Lista de coordenadas geográficas asociadas con el estudio (opcional).
     */
    coordenadas?: Coordenada[];

    /**
     * Conjunto de tipos de estudio geofísico realizados (opcional).
     */
    tiposEstudio?: Set<EnumTipoEstudioGeofisico>;

    /**
     * Conjunto de áreas de aplicación del estudio geofísico (opcional).
     */
    areasEstudio?: Set<EnumAreaAplicacionEstudioGeofisico>;

    /**
     * Lista de imágenes asociadas con el estudio geofísico (opcional).
     */
    imagenes?: Imagen[];

    /**
     * Lista de archivos adjuntos relacionados con el estudio geofísico (opcional).
     */
    archivosAdjuntos?: ArchivoAdjunto[];

    // Propiedades de auditoría

    /**
     * Nombre del usuario que creó el registro del estudio geofísico (opcional).
     */
    creadoPor?: string;

    /**
     * Fecha y hora de creación del registro del estudio geofísico en formato de cadena (opcional).
     */
    fechaHoraCreacion?: string;

    /**
     * Nombre del usuario que realizó la última actualización del registro del estudio geofísico (opcional).
     */
    ultimaActualizacionPor?: string;

    /**
     * Fecha y hora de la última modificación del registro del estudio geofísico en formato de cadena (opcional).
     */
    fechaModificacion?: string;
}
