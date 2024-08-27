package com.felipeguell.terraserv.api.rest.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felipeguell.terraserv.api.rest.models.dao.IImagenDao;
import com.felipeguell.terraserv.api.rest.models.entity.Imagen;
import com.felipeguell.terraserv.api.rest.services.IImagenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImagenServiceImpl implements IImagenService{

	private final IImagenDao imagenDao;

	/**
	 * Busca una imagen por su clave única.
	 *
	 * @param key La clave única de la imagen.
	 * @return Optional que puede contener la imagen si se encuentra.
	 * @throws IllegalArgumentException si la clave proporcionada es nula o vacía.
	 */
	@Override
	@Transactional(readOnly = true)
	public Optional<Imagen> findByImagenKey(String key) {
		// Busca la imagen por su clave utilizando el DAO.
		return imagenDao.findCustomByImagenKey(key);
	}

	/**
	 * Busca imágenes por sus claves únicas.
	 *
	 * @param keys Lista de claves únicas de las imágenes.
	 * @return Lista de imágenes encontradas.
	 * @throws IllegalArgumentException si la lista de claves proporcionada es nula o vacía.
	 */
	@Override
	@Transactional(readOnly = true)
	public List<Imagen> findByImagenKeyIn(List<String> keys) {
		// Busca las imágenes por sus claves utilizando el DAO.
		return imagenDao.findByImagenKeyIn(keys);
	}

}
