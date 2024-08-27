package com.felipeguell.terraserv.api.rest.models.dao;

import java.util.Date;
import java.util.Set;

import com.felipeguell.terraserv.api.rest.models.dao.projections.EstudioGeofisicoProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.felipeguell.terraserv.api.rest.models.entity.EstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;

public interface IEstudioGeofisicoDao extends JpaRepository<EstudioGeofisico, Long> {

    /**
     * Consulta para filtrar los estudios geofísicos en la base de datos.
     *
     * @param consultaMultiple Cadena de texto que se utiliza para buscar coincidencias en los campos nombreEstudio, nombreCliente y ubicacionEstudio.
     * @param fechaInicio      Fecha de inicio del rango de fechas en el que se realizó el estudio geofísico.
     * @param fechaFin         Fecha de fin del rango de fechas en el que se realizó el estudio geofísico.
     * @param tipoEstudio      Enumerador del tipo de estudio geofísico.
     * @param areaEstudio      Enumerador del área de aplicación del estudio geofísico.
     * @return Un conjunto de estudios geofísicos que cumplen con los criterios de filtrado.
     */
    @Query("SELECT e " +
            "FROM EstudioGeofisico e " +
            "WHERE (:consultaMultiple is null or " +
            "       (e.nombreEstudio LIKE %:consultaMultiple% OR " +
            "        e.nombreCliente LIKE %:consultaMultiple% OR " +
            "        e.ubicacionEstudio LIKE %:consultaMultiple%)) " +
            "AND (:fechaInicio is null or :fechaFin is null or " +
            "       (e.fechaRealizado BETWEEN :fechaInicio AND :fechaFin)) " +
            "AND (:tipoEstudio is null or :tipoEstudio MEMBER OF e.tiposEstudio) " +
            "AND (:areaEstudio is null or :areaEstudio MEMBER OF e.areasEstudio)")
    Set<EstudioGeofisico> filterEstudios(@Param("consultaMultiple") String consultaMultiple,
                                         @Param("fechaInicio") Date fechaInicio,
                                         @Param("fechaFin") Date fechaFin,
                                         @Param("tipoEstudio") EnumTipoEstudioGeofisico tipoEstudio,
                                         @Param("areaEstudio") EnumAreaAplicacionEstudioGeofisico areaEstudio);

    /**
     * Este método se utiliza para buscar registros de estudios geofísicos.
     *
     * @param pageable Es un objeto Pageable que proporciona información sobre la paginación y la clasificación.
     *                 Contiene los detalles de la página actual, el tamaño de la página, etc.
     * @return Retorna un objeto Page que contiene los registros de estudios geofísicos.
     * Cada registro contiene los siguientes campos:
     * - id: El ID del estudio geofísico.
     * - nombreEstudio: El nombre del estudio geofísico.
     * - creadoPor: El nombre del usuario que creó el estudio geofísico.
     * - fechaHoraCreacion: La fecha y hora de creación del estudio geofísico.
     * - ultimaActualizacionPor: El nombre del usuario que realizó la última actualización del estudio geofísico.
     * - fechaModificacion: La fecha de la última modificación del estudio geofísico.
     */
    @Query("SELECT e.id AS id, " +
            "e.nombreEstudio AS nombreEstudio, " +
            "e.nombreCliente AS nombreCliente, " +
            "e.fechaRealizado AS fechaRealizado, " +
            "e.ubicacionEstudio AS ubicacionEstudio, " +
            "e.creadoPor AS creadoPor, " +
            "e.fechaHoraCreacion AS fechaHoraCreacion, " +
            "e.ultimaActualizacionPor AS ultimaActualizacionPor, " +
            "e.fechaModificacion AS fechaModificacion " +
            "FROM EstudioGeofisico e " +
            "WHERE (:consultaMultiple is null or " +
            "       (e.nombreEstudio LIKE %:consultaMultiple% OR " +
            "        e.nombreCliente LIKE %:consultaMultiple% OR " +
            "        e.ubicacionEstudio LIKE %:consultaMultiple%)) " +
            "AND (:fechaInicio is null or :fechaFin is null or " +
            "       (e.fechaRealizado BETWEEN :fechaInicio AND :fechaFin)) " +
            "AND (:tipoEstudio is null or :tipoEstudio MEMBER OF e.tiposEstudio) " +
            "AND (:areaEstudio is null or :areaEstudio MEMBER OF e.areasEstudio)")
    Page<EstudioGeofisicoProjection> findFilteredEstudios(@Param("consultaMultiple") String consultaMultiple,
                                                          @Param("fechaInicio") Date fechaInicio,
                                                          @Param("fechaFin") Date fechaFin,
                                                          @Param("tipoEstudio") EnumTipoEstudioGeofisico tipoEstudio,
                                                          @Param("areaEstudio") EnumAreaAplicacionEstudioGeofisico areaEstudio,
                                                          Pageable pageable);

}
