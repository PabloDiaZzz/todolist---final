package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.dto.UsuarioRegistroDTO;
import es.educastur.gjv64177.todolist.model.Role;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.UsuarioRepository;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {
	@Autowired
	private UsuarioRepository usuarioRepository;
	@Autowired
	private PasswordEncoder passwordEncoder;
	@Autowired
	private JavaMailSender mailSender;
	@Autowired
	private TaskService taskService;

	@Value("${app.mail.from}")
	private String remitentePersonalizado;

	private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

	public Usuario findByUsername(String username) {
		return usuarioRepository.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario " + username + " no fue encontrado"));
	}

	public boolean existsByUsername(String username) {
		return usuarioRepository.existsByUsername(username);
	}

	public boolean existsByEmail(String email) {
		return usuarioRepository.existsByEmail(email);
	}

	public void registrarUsuario(UsuarioRegistroDTO dto) {
		if (usuarioRepository.existsByUsername(dto.username()) ||
				usuarioRepository.existsByEmail(dto.email())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario o Email ya en uso");
		}
		
		Usuario nuevoUsuario = new Usuario();
		nuevoUsuario.setUsername(dto.username());
		nuevoUsuario.setFullName(dto.fullName());
		nuevoUsuario.setEmail(dto.email());
		nuevoUsuario.setPassword(passwordEncoder.encode(dto.password()));
		nuevoUsuario.setRole(Role.ROLE_USER);

		usuarioRepository.save(nuevoUsuario);
	}

	public void enviarNuevaPassword(String email) {
		log.info("[FORGOT-PASSWORD] Iniciando proceso de recuperación para el email: {}", email);
		
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> {
					log.error("[FORGOT-PASSWORD] Error: El email {} no existe en la base de datos.", email);
					return new RuntimeException("Email no encontrado en el sistema: " + email);
				});

		log.info("[FORGOT-PASSWORD] Usuario encontrado: {}. Generando clave temporal...", usuario.getUsername());
		String tempPassword = UUID.randomUUID()
				.toString()
				.substring(0, 8);

		try {
			log.info("[FORGOT-PASSWORD] Creando MimeMessage y configurando helper...");
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

			log.info("[FORGOT-PASSWORD] Configurando parámetros del correo. From: {}, To: {}", remitentePersonalizado, email);
			helper.setFrom(remitentePersonalizado);
			helper.setTo(email);
			helper.setSubject("Nueva Contraseña Temporal");
			helper.setText("Tu nueva contraseña es: " + tempPassword);

			log.info("[FORGOT-PASSWORD] Intentando enviar correo a través de SMTP de Brevo (Puerto 2525)...");
			mailSender.send(message);
			log.info("[FORGOT-PASSWORD] ¡Correo enviado con éxito! Procediendo a encriptar y guardar la nueva clave...");

			usuario.setPassword(passwordEncoder.encode(tempPassword));
			usuarioRepository.save(usuario);
			log.info("[FORGOT-PASSWORD] Proceso completado con éxito. Contraseña actualizada en BBDD para: {}", usuario.getUsername());

		} catch (org.springframework.mail.MailAuthenticationException e) {
			log.error("[FORGOT-PASSWORD] ❌ ERROR DE AUTENTICACIÓN: Las credenciales SMTP leídas desde Render son incorrectas.");
			log.error("[FORGOT-PASSWORD] Detalle del fallo: {}", e.getMessage());
			throw new RuntimeException("Fallo de autenticación SMTP: Revisa MAIL_USERNAME y MAIL_PASSWORD en Render.", e);

		} catch (org.springframework.mail.MailSendException e) {
			log.error("[FORGOT-PASSWORD] ❌ ERROR DE CONEXIÓN O RECHAZO: El servidor SMTP ha denegado el envío.");
			log.error("[FORGOT-PASSWORD] Detalle completo del fallo: {}", e.getMessage());
			throw new RuntimeException("Fallo al procesar el envío en el servidor de correo SMTP.", e);

		} catch (Exception e) {
			log.error("[FORGOT-PASSWORD] ❌ ERROR INESPERADO al procesar el envío de correo.");
			log.error("[FORGOT-PASSWORD] Clase de la excepción: {}", e.getClass()
					.getName());
			log.error("[FORGOT-PASSWORD] Mensaje de error: {}", e.getMessage());
			throw new RuntimeException("Error interno en el servicio de correo: " + e.getMessage(), e);
		}
	}

	public List<Usuario> listarTodos() {
		return usuarioRepository.findAll();
	}

	@Transactional
	public void changeRole(String username, Role role) {
		Usuario user = usuarioRepository.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
		user.setRole(role);
		usuarioRepository.save(user);
	}

	@Transactional
	public void makeAdmin(String username) {
		changeRole(username, Role.ROLE_ADMIN);
	}

	@Transactional
	public Usuario updateProfile(String currentUsername, String newUsername, String newFullName, String newEmail, String newTheme) {
		Usuario user = usuarioRepository.findByUsername(currentUsername)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

		if (newFullName != null && !newFullName.isBlank()) {
			user.setFullName(newFullName.trim());
		}

		if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(currentUsername)) {
			if (usuarioRepository.existsByUsername(newUsername)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso");
			}
			user.setUsername(newUsername.trim());
		}

		if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(user.getEmail())) {
			if (usuarioRepository.existsByEmail(newEmail)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo electrónico ya está en uso");
			}
			user.setEmail(newEmail.trim());
		}

		if (newTheme != null && !newTheme.isBlank()) {
			user.setTheme(newTheme.trim().toUpperCase());
		}

		return usuarioRepository.save(user);
	}

	@Transactional
	public void updatePassword(String username, String currentPassword, String newPassword) {
		Usuario user = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

		if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual es incorrecta");
		}

		if (newPassword == null || newPassword.isBlank() || newPassword.length() < 4) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener al menos 4 caracteres");
		}

		user.setPassword(passwordEncoder.encode(newPassword));
		usuarioRepository.save(user);
	}

	@Transactional
	public void deleteUser(String username) {
		Usuario user = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
		taskService.deleteAllTasksByAuthor(user);
		usuarioRepository.delete(user);
	}
}
