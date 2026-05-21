package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.dto.UsuarioRegistroDTO;
import es.educastur.gjv64177.todolist.model.Role;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {
	@Value("${app.mail.from}")
	private String remitentePersonalizado;
	@Autowired
	private UsuarioRepository usuarioRepository;
	@Autowired
	private PasswordEncoder passwordEncoder;
	@Autowired
	private TaskService taskService;

	@Value("${spring.mail.password}")
	private String brevoApiKey;

	@Value("${spring.mail.username}")
	private String brevoSenderEmail;

	private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

	public Usuario findByUsername(String username) {
		return usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario " + username + " no fue encontrado"));
	}

	public boolean existsByUsername(String username) {
		return usuarioRepository.existsByUsername(username);
	}

	public boolean existsByEmail(String email) {
		return usuarioRepository.existsByEmail(email);
	}

	public void registrarUsuario(UsuarioRegistroDTO dto) {
		if (usuarioRepository.existsByUsername(dto.username()) || usuarioRepository.existsByEmail(dto.email())) {
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
		log.info("[FORGOT-PASSWORD-API] Iniciando recuperación vía HTTP para: {}", email);

		// Buscar el usuario en la base de datos
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Email no encontrado"));

		String tempPassword = UUID.randomUUID()
				.toString()
				.substring(0, 8);

		// 2. Construimos el JSON exacto que pide la API v3 de Brevo
		String jsonBody = """
				{
				  "sender": { "name": "ToDo List Support", "email": "%s" },
				  "to": [{ "email": "%s" }],
				  "subject": "Nueva Contraseña Temporal",
				  "htmlContent": "<html><body><p>Tu nueva contraseña temporal es: <strong>%s</strong></p><p>Por seguridad, cámbiala en cuanto inicies sesión.</p></body></html>"
				}
				""".formatted(brevoSenderEmail, email, tempPassword);

		try {
			log.info("[FORGOT-PASSWORD-API] Enviando petición POST a la API de Brevo...");

			// Creamos el cliente HTTP de Spring
			RestClient restClient = RestClient.create();

			// Ejecutamos la petición web por el puerto 443
			restClient.post()
					.uri("https://api.brevo.com/v3/smtp/email")
					.header("api-key", brevoApiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(jsonBody)
					.retrieve()
					.toBodilessEntity();

			log.info("[FORGOT-PASSWORD-API] ¡API de Brevo respondió con éxito! Actualizando credenciales en base de datos...");

			// 3. Si la llamada HTTP no dio error, guardamos la contraseña en la base de datos
			usuario.setPassword(passwordEncoder.encode(tempPassword));
			usuarioRepository.save(usuario);
			log.info("[FORGOT-PASSWORD-API] Proceso completado. Nueva clave guardada para el usuario.");

		} catch (Exception e) {
			log.error("[FORGOT-PASSWORD-API] ❌ Error crítico al conectar con la API de Brevo: {}", e.getMessage());
			throw new RuntimeException("Error al enviar el mensaje de correo vía API", e);
		}
	}
	
	public List<Usuario> listarTodos() {
		return usuarioRepository.findAll();
	}

	@Transactional
	public void changeRole(String username, Role role) {
		Usuario user = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
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
			user.setTheme(newTheme.trim()
					              .toUpperCase());
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
