package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.UsuarioRegistroDTO;
import es.educastur.gjv64177.todolist.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Autowired
	private UsuarioService usuarioService;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtService jwtService;
	
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
		try {
			String username = loginRequest.get("username");
			String password = loginRequest.get("password");

			Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(username, password)
			);

			String token = jwtService.generarToken(authentication.getName());

			return ResponseEntity.ok(Map.of("token", token));

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "Credenciales incorrectas"));
		}
	}

	@GetMapping("/check-username")
	public boolean checkUsername(@RequestParam String username) {
		return usuarioService.existsByUsername(username);
	}

	@GetMapping("/check-email")
	public boolean checkEmail(@RequestParam String email) {
		return usuarioService.existsByEmail(email);
	}

	@PostMapping("/register")
	public ResponseEntity<String> procesarRegistro(@Valid UsuarioRegistroDTO registroDTO,
	                                               BindingResult result) {
		if (result.hasErrors()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Datos inválidos");
		}

		if (!registroDTO.password().equals(registroDTO.confirmPassword())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Las contraseñas no coinciden");
		}

		try {
			usuarioService.registrarUsuario(registroDTO);
			return ResponseEntity.status(HttpStatus.CREATED).body("Registro exitoso");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: Usuario o Email ya existen");
		}
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<String> procesarRecuperacion(@RequestParam String email) {
		if (!usuarioService.existsByEmail(email)) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email no registrado.");
		}

		try {
			usuarioService.enviarNuevaPassword(email);
			return ResponseEntity.ok("Te hemos enviado una nueva contraseña a tu correo.");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al procesar la solicitud.");
		}
	}
}