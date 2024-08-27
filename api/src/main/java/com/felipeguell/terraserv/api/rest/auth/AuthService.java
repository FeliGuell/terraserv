package com.felipeguell.terraserv.api.rest.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.felipeguell.terraserv.api.rest.jwt.JwtService;
import com.felipeguell.terraserv.api.rest.models.dao.IUsuarioDao;
import com.felipeguell.terraserv.api.rest.models.entity.Usuario;
import com.felipeguell.terraserv.api.rest.models.enumeration.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final IUsuarioDao usuarioDao; // Interfaz para el acceso a la base de datos de los usuarios.
	private final JwtService jwtService;  // Servicio para la generación y validación de tokens JWT.
	private final PasswordEncoder passwordEncoder; // Codificador de contraseñas para almacenarlas de manera segura.
	private final AuthenticationManager authenticationManager; // Administrador de autenticación de Spring Security.

	/**
	 * Este método se utiliza para autenticar a un usuario.
	 * @param request Un objeto LoginRequest que contiene las credenciales del usuario.
	 * @return Una respuesta HTTP que contiene un objeto AuthResponse. Si las credenciales son válidas, AuthResponse contendrá el token JWT.
	 */
	public AuthResponse login(LoginRequest request) {
			// Autentica al usuario utilizando Spring Security.
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

			// Obtiene los detalles del usuario autenticado.
			UserDetails user = usuarioDao.findByUsername(request.getUsername()).orElseThrow();

			// Genera un token JWT y lo devuelve como parte de la respuesta.
			String token = jwtService.getToken(user);

			return AuthResponse.builder().token(token).build();
	}

	/**
	 * Este método se utiliza para registrar a un nuevo usuario.
	 * @param request Un objeto RegisterRequest que contiene la información del nuevo usuario.
	 * @return Una respuesta HTTP que contiene un objeto AuthResponse. Si el registro es exitoso, AuthResponse contendrá el token JWT.
	 */
	public AuthResponse register(RegisterRequest request) {
		// Crea un nuevo usuario con la información proporcionada en el registro.
		Usuario usuario = Usuario.builder().username(request.getUsername()).password(passwordEncoder.encode(request.getPassword())).role(Role.USER).build();

		// Guarda el usuario en la base de datos.
		usuarioDao.save(usuario);

		// Genera un token JWT para el nuevo usuario y lo devuelve como parte de la respuesta.
		return AuthResponse.builder().token(jwtService.getToken(usuario)).build();
	}

	/**
	 * Este método se utiliza para registrar a un nuevo usuario con un rol específico.
	 * @param request Un objeto RegisterRequest que contiene la información del nuevo usuario.
	 * @param role Un objeto Role que representa el rol que se asignará al nuevo usuario.
	 * @return El objeto Usuario que se acaba de crear y guardar en la base de datos.
	 */
	public Usuario registerWithRole(RegisterRequest request, Role role) {
		// Crea un nuevo usuario con la información proporcionada en el registro.
		Usuario usuario = Usuario.builder().username(request.getUsername()).password(passwordEncoder.encode(request.getPassword())).role(role).build();

		// Guarda el usuario en la base de datos.
		usuarioDao.save(usuario);

		// No necesitamos generar un token JWT para el nuevo usuario en este caso,
		// ya que solo estamos creando el usuario al iniciar la aplicación.
		return usuario;
	}

	/**
	 * Este método se utiliza para verificar si un usuario ya existe en la base de datos por su nombre de usuario.
	 * @param username El nombre de usuario del usuario que se quiere verificar.
	 * @return Un valor booleano que indica si el usuario existe (true) o no (false).
	 */
	public boolean existsByUsername(String username) {
		return usuarioDao.findByUsername(username).isPresent();
	}
}

