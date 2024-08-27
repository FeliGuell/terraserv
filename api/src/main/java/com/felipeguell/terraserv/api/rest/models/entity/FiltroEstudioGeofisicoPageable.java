package com.felipeguell.terraserv.api.rest.models.entity;

import lombok.Data;

@Data
public class FiltroEstudioGeofisicoPageable {
    private int page = 0;
    private int size = 10;
    private String sort = "id";
    private String direction = "asc";
    private String consultaMultiple;
    private String fechaInicio;
    private String fechaFin;
    private String tipoEstudio;
    private String areaEstudio;
}
