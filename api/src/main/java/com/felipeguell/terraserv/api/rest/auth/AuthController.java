package com.felipeguell.terraserv.api.rest.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = {"http://localhost:4200"})
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
	
	private final AuthService authService; // Servicio que maneja la lógica de autenticación y registro

	/**
	 * Este método maneja las solicitudes POST a la ruta "/login".
	 * Se utiliza para iniciar sesión en la aplicación.
	 *
	 * @param login Un objeto LoginRequest que contiene las credenciales del usuario (nombre de usuario y contraseña).
	 * @return Una respuesta HTTP que contiene un objeto AuthResponse. Si las credenciales son válidas, AuthResponse contendrá el token JWT.
	 */
	@PostMapping(value = "/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest login){
		return ResponseEntity.ok(authService.login(login));
	}

	/**
	 * Este método maneja las solicitudes POST a la ruta "/register".
	 * Se utiliza para registrar un nuevo usuario en la aplicación.
	 *
	 * @param request Un objeto RegisterRequest que contiene la información del nuevo usuario (por ejemplo, nombre de usuario, contraseña, correo electrónico, etc.).
	 * @return Una respuesta HTTP que contiene un objeto AuthResponse. Si el registro es exitoso, AuthResponse contendrá el token JWT.
	 */
	@PostMapping(value = "/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request){
		return ResponseEntity.ok(authService.register(request));
	}
	
}
