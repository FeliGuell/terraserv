package com.felipeguell.terraserv.api.rest.services.impl;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import com.felipeguell.terraserv.api.rest.models.dao.projections.EstudioGeofisicoProjectionImpl;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisicoPageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felipeguell.terraserv.api.rest.models.dao.IEstudioGeofisicoDao;
import com.felipeguell.terraserv.api.rest.models.dao.projections.EstudioGeofisicoProjection;
import com.felipeguell.terraserv.api.rest.models.entity.EstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.services.IEstudioGeofisicoService;

import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class EstudioGeofisicoServiceImpl implements IEstudioGeofisicoService{

	private final IEstudioGeofisicoDao estudioGeofisicoDao;

	/**
	 * Elimina un EstudioGeofisico de la base de datos utilizando su ID.
	 *
	 * @param id El ID del EstudioGeofisico a eliminar.
	 */
	@Override
	@Transactional
	public void deleteById(Long id) {
		estudioGeofisicoDao.deleteById(id);
	}

	/**
	 * Obtiene todos los EstudioGeofisico de la base de datos.
	 *
	 * @return Una lista de todos los EstudioGeofisico.
	 */
	@Override
	@Transactional(readOnly = true)
	public List<EstudioGeofisico> findAll() {
		return (List<EstudioGeofisico>) estudioGeofisicoDao.findAll();
	}

	/**
	 * Obtiene un EstudioGeofisico de la base de datos utilizando su ID.
	 *
	 * @param id El ID del EstudioGeofisico a obtener.
	 * @return Un Optional que puede contener el EstudioGeofisico si se encuentra.
	 */
	@Override
	@Transactional(readOnly = true)
	public Optional<EstudioGeofisico> findById(Long id) {
		return estudioGeofisicoDao.findById(id);
	}

	/**
	 * Guarda un EstudioGeofisico en la base de datos.
	 *
	 * @param estudioGeofisico El EstudioGeofisico a guardar.
	 * @return El EstudioGeofisico guardado.
	 */
	@Override
	@Transactional
	public EstudioGeofisico save(EstudioGeofisico estudioGeofisico) {
		return estudioGeofisicoDao.save(estudioGeofisico);
	}

	/**
	 * Filtra los EstudioGeofisico en la base de datos según los criterios especificados.
	 *
	 * @param filtro Los criterios de filtrado.
	 * @return Un conjunto de proyecciones de EstudioGeofisico que cumplen con los criterios de filtrado.
	 * @throws ParseException Si ocurre un error al analizar las fechas o los enumerations
	 */
	@Override
	@Transactional(readOnly = true)
	public Set<EstudioGeofisicoProjection> filterEstudios(FiltroEstudioGeofisico filtro) throws ParseException {
		Set<EstudioGeofisico> entities = estudioGeofisicoDao.filterEstudios(
				filtro.getConsultaMultiple(),
				parseDate(filtro.getFechaInicio()),
				parseDate(filtro.getFechaFin()),
				parseTipoEstudio(filtro.getTipoEstudio()),
				parseAreaEstudio(filtro.getAreaEstudio()));



		return entities.stream()
				.map(entity -> new EstudioGeofisicoProjectionImpl(
						entity.getId(),
						entity.getNombreEstudio(),
						entity.getNombreCliente(),
						entity.getDescripcion(),
						entity.getFechaRealizado(),
						entity.getUbicacionEstudio(),
						entity.getCoordenadas(),
						entity.getTiposEstudio(),
						entity.getAreasEstudio(),
						entity.getCreadoPor(),
						entity.getFechaHoraCreacion(),
						entity.getUltimaActualizacionPor(),
						entity.getFechaModificacion()))
				.collect(Collectors.toSet());
	}


	/**
	 * Obtiene registros de estudios geofísicos utilizando los criterios de filtrado, paginación y ordenamiento especificados.
	 * Este método se basa en el método `findFilteredEstudios` del DAO para realizar la consulta.
	 *
	 * @param filtro Objeto que contiene los parámetros de filtrado, paginación y ordenamiento:
	 *               - page: Número de página que se desea obtener (predeterminado: 0).
	 *               - size: Tamaño de la página, es decir, número de registros por página (predeterminado: 10).
	 *               - sort: Campo por el cual se desea ordenar los registros (predeterminado: "id").
	 *               - direction: Dirección del ordenamiento ("asc" para ascendente, "desc" para descendente; predeterminado: "asc").
	 *               - consultaMultiple: Cadena de texto para buscar coincidencias en los campos nombreEstudio, nombreCliente y ubicacionEstudio.
	 *               - fechaInicio: Fecha de inicio del rango de fechas en el que se realizó el estudio geofísico.
	 *               - fechaFin: Fecha de fin del rango de fechas en el que se realizó el estudio geofísico.
	 *               - tipoEstudio: Enumerador del tipo de estudio geofísico.
	 *               - areaEstudio: Enumerador del área de aplicación del estudio geofísico.
	 *
	 * @return Page<EstudioGeofisicoProjection> que contiene los registros de estudios geofísicos. Cada registro incluye:
	 *         - id: El ID del estudio geofísico.
	 *         - nombreEstudio: El nombre del estudio geofísico.
	 *         - creadoPor: El nombre del usuario que creó el estudio geofísico.
	 *         - fechaHoraCreacion: La fecha y hora de creación del estudio geofísico.
	 *         - ultimaActualizacionPor: El nombre del usuario que realizó la última actualización del estudio geofísico.
	 *         - fechaModificacion: La fecha de la última modificación del estudio geofísico.
	 *
	 * @throws ParseException Si hay un error al parsear las fechas proporcionadas en el filtro.
	 */
	@Override
	@Transactional(readOnly = true)
	public Page<EstudioGeofisicoProjection> obtenerRegistrosEstudio(FiltroEstudioGeofisicoPageable filtro) throws ParseException {
		Sort.Direction dir = filtro.getDirection().equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
		Sort sortParam = Sort.by(dir, filtro.getSort() != null ? filtro.getSort() : "id");
		Pageable pageable = PageRequest.of(filtro.getPage(), filtro.getSize(), sortParam);
		return estudioGeofisicoDao.findFilteredEstudios(
				filtro.getConsultaMultiple(),
				parseDate(filtro.getFechaInicio()),
				parseDate(filtro.getFechaFin()),
				parseTipoEstudio(filtro.getTipoEstudio()),
				parseAreaEstudio(filtro.getAreaEstudio()), pageable);
	}

	/**
	 * Convierte una cadena de texto en un objeto Date.
	 *
	 * @param dateString La cadena de texto a convertir.
	 * @return El objeto Date correspondiente, o null si la cadena de texto es null o está vacía.
	 * @throws ParseException Si la cadena de texto no puede ser parseada a un objeto Date.
	 */
	public Date parseDate(String dateString) throws ParseException {
		if (StringUtils.isEmpty(dateString)) {
			return null;
		}

		SimpleDateFormat formato = new SimpleDateFormat("yyyy-MM-dd");
		return formato.parse(dateString);
	}

	/**
	 * Convierte una cadena de texto en un EnumTipoEstudioGeofisico.
	 *
	 * @param tipoEstudioString La cadena de texto a convertir.
	 * @return El EnumTipoEstudioGeofisico correspondiente, o null si la cadena de texto es null o está vacía.
	 */
	public EnumTipoEstudioGeofisico parseTipoEstudio(String tipoEstudioString) {
		if (StringUtils.isEmpty(tipoEstudioString)) {
			return null;
		}

		return EnumTipoEstudioGeofisico.valueOf(tipoEstudioString.trim());
	}

	/**
	 * Convierte una cadena de texto en un EnumAreaAplicacionEstudioGeofisico.
	 *
	 * @param areaEstudioString La cadena de texto a convertir.
	 * @return El EnumAreaAplicacionEstudioGeofisico correspondiente, o null si la cadena de texto es null o está vacía.
	 */
	public EnumAreaAplicacionEstudioGeofisico parseAreaEstudio(String areaEstudioString) {
		if (StringUtils.isEmpty(areaEstudioString)) {
			return null;
		}

		return EnumAreaAplicacionEstudioGeofisico.valueOf(areaEstudioString.trim());
	}

 
}
