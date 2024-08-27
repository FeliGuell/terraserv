package com.felipeguell.terraserv.api.rest.auditor;

import java.util.Optional;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Esta clase implementa la interfaz AuditorAware para proporcionar la funcionalidad de auditoría.
 * Se utiliza para obtener el nombre del usuario actualmente autenticado.
 */
public class AuditorAwareImpl implements AuditorAware<String>{

	/**
	 * Este método se utiliza para obtener el nombre del usuario actualmente autenticado.
	 * @return Un Optional que contiene el nombre del usuario si está autenticado, o un Optional vacío si no lo está.
	 */
	@Override
	public Optional<String> getCurrentAuditor() {

		// Obtenemos el objeto de autenticación actual del SecurityContextHolder.
		Authentication authentication =
                SecurityContextHolder
                    .getContext()
                    .getAuthentication();

		// Si la autenticación es nula o el usuario no está autenticado, devolvemos un Optional vacío.
		if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

		// Si el usuario está autenticado, obtenemos el nombre del usuario del objeto de autenticación y lo devolvemos.
        return Optional.ofNullable(((UserDetails) authentication.getPrincipal()).getUsername());
	}
}
