package com.felipeguell.terraserv.api.rest.services;

import java.util.List;
import java.util.Optional;

import com.felipeguell.terraserv.api.rest.models.entity.ArchivoAdjunto;

public interface IArchivoAdjuntoService {
	public Optional<ArchivoAdjunto> findByArchivoKey(String key);
	public List<ArchivoAdjunto> findByArchivoKeyIn (List<String> keys);
}
