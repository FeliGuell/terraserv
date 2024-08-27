package com.felipeguell.terraserv.api.rest.models.dao.projections;


import com.felipeguell.terraserv.api.rest.models.entity.Coordenada;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Date;
import java.util.List;
import java.util.Set;

@Getter
@AllArgsConstructor
public class EstudioGeofisicoProjectionImpl implements EstudioGeofisicoProjection {
    private Long id;
    private String nombreEstudio;
    private String nombreCliente;
    private String descripcion;
    private Date fechaRealizado;
    private String ubicacionEstudio;
    private List<Coordenada> coordenadas;
    private Set<EnumTipoEstudioGeofisico> tiposEstudio;
    private Set<EnumAreaAplicacionEstudioGeofisico> areasEstudio;
    private String creadoPor;
    private Date fechaHoraCreacion;
    private String ultimaActualizacionPor;
    private Date fechaModificacion;
}

