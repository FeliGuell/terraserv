package com.felipeguell.terraserv.api.rest.models.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felipeguell.terraserv.api.rest.models.entity.Imagen;

public interface IImagenDao extends JpaRepository<Imagen, Long>{
	Optional<Imagen> findCustomByImagenKey(String key);
	List<Imagen> findByImagenKeyIn(List<String> keys);
}
