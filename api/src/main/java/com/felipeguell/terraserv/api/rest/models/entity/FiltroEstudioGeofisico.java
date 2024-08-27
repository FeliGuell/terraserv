package com.felipeguell.terraserv.api.rest.models.entity;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
public class FiltroEstudioGeofisico {
	  private String consultaMultiple;
	  private String fechaInicio;
	  private String fechaFin;
	  private String tipoEstudio;
	  private String areaEstudio;
}
