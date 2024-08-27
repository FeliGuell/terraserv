package com.felipeguell.terraserv.api.rest.models.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felipeguell.terraserv.api.rest.models.entity.ArchivoAdjunto;

public interface IArchivoAdjuntoDao extends JpaRepository<ArchivoAdjunto, Long>{
    Optional<ArchivoAdjunto> findCustomByArchivoKey(String key);
    List<ArchivoAdjunto> findByArchivoKeyIn(List<String> keys);
}
