package com.felipeguell.terraserv.api.rest.services;

import java.text.ParseException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.felipeguell.terraserv.api.rest.models.dao.projections.EstudioGeofisicoProjection;
import com.felipeguell.terraserv.api.rest.models.entity.EstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisicoPageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IEstudioGeofisicoService {
	public List<EstudioGeofisico> findAll();
	public Optional<EstudioGeofisico> findById(Long id);
	public EstudioGeofisico save(EstudioGeofisico estudioGeofisico);
	public void deleteById(Long id);
	public Set<EstudioGeofisicoProjection> filterEstudios(FiltroEstudioGeofisico filtro) throws ParseException;
	public Page<EstudioGeofisicoProjection> obtenerRegistrosEstudio(FiltroEstudioGeofisicoPageable filtro) throws ParseException;
}
