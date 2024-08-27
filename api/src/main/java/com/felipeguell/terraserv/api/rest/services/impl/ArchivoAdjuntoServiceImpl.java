package com.felipeguell.terraserv.api.rest.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felipeguell.terraserv.api.rest.models.dao.IArchivoAdjuntoDao;
import com.felipeguell.terraserv.api.rest.models.entity.ArchivoAdjunto;
import com.felipeguell.terraserv.api.rest.services.IArchivoAdjuntoService;

import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ArchivoAdjuntoServiceImpl implements IArchivoAdjuntoService{

	private final IArchivoAdjuntoDao archivoDao;

	/**
	 * Busca un archivo adjunto por su clave única.
	 *
	 * @param key La clave única del archivo adjunto.
	 * @return Optional que puede contener el archivo adjunto si se encuentra.
	 */
	@Override
	@Transactional(readOnly = true)
	public Optional<ArchivoAdjunto> findByArchivoKey(String key) {
		// Busca el archivo adjunto por su clave utilizando el DAO.
		return archivoDao.findCustomByArchivoKey(key);
	}

	/**
	 * Busca archivos adjuntos por sus claves únicas.
	 *
	 * @param keys Lista de claves únicas de los archivos adjuntos.
	 * @return Lista de archivos adjuntos encontrados.
	 */
	@Override
	@Transactional(readOnly = true)
	public List<ArchivoAdjunto> findByArchivoKeyIn(List<String> keys) {
		// Busca los archivos adjuntos por sus claves utilizando el DAO.
		return archivoDao.findByArchivoKeyIn(keys);
	}


}
