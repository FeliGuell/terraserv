package com.felipeguell.terraserv.api.rest.models.dao.projections;

import java.text.ParseException;
import java.util.Date;
import java.util.List;
import java.util.Set;

import com.felipeguell.terraserv.api.rest.models.entity.Coordenada;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;

public interface EstudioGeofisicoProjection {
	 	Long getId();
	    String getNombreEstudio();
	    String getNombreCliente();
	    String getDescripcion();
	    Date getFechaRealizado() throws ParseException;
		String getUbicacionEstudio();
	    List<Coordenada> getCoordenadas();
	    Set<EnumTipoEstudioGeofisico> getTiposEstudio();
	    Set<EnumAreaAplicacionEstudioGeofisico> getAreasEstudio();
		String getCreadoPor();
		Date getFechaHoraCreacion();
		String getUltimaActualizacionPor();
		Date getFechaModificacion();
}
