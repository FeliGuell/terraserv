package com.felipeguell.terraserv.api.rest.models.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felipeguell.terraserv.api.rest.models.entity.Usuario;

public interface IUsuarioDao extends JpaRepository<Usuario, Integer>{
	Optional<Usuario> findByUsername(String username);
}
