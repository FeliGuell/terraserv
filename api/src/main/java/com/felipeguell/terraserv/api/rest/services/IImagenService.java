package com.felipeguell.terraserv.api.rest.services;

import java.util.List;
import java.util.Optional;

import com.felipeguell.terraserv.api.rest.models.entity.Imagen;

public interface IImagenService{
	public Optional<Imagen> findByImagenKey(String key);
	public List<Imagen> findByImagenKeyIn (List<String> keys);
}
