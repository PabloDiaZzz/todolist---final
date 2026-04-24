package es.educastur.gjv64177.todolist.Service;

import es.educastur.gjv64177.todolist.dto.UsuarioRegistroDTO;
import es.educastur.gjv64177.todolist.model.Role;
import es.educastur.gjv64177.todolist.model.Usuario;
import es.educastur.gjv64177.todolist.repository.UsuarioRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
	private JavaMailSender mailSender;

	public void enviarEmailRecuperacion(String email) {
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Email no encontrado"));

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(email);
		message.setSubject("Recuperación de Contraseña - ToDo List");
		message.setText("Hola " + usuario.getFullName() + ",\n\n" +
				                "Has solicitado restablecer tu contraseña.\n" +
				                "Este es un correo de prueba para confirmar que el sistema funciona.\n\n" +
				                "Saludos,\nEl equipo de ToDo List.");

		mailSender.send(message);
	}

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
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Email no encontrado"));
		String tempPassword = UUID.randomUUID().toString().substring(0, 8);

		usuario.setPassword(passwordEncoder.encode(tempPassword));
		usuarioRepository.save(usuario);

		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

			helper.setFrom(remitentePersonalizado);
			helper.setTo(email);
			helper.setSubject("Nueva Contraseña Temporal");
			helper.setText("Tu nueva contraseña es: " + tempPassword);

			mailSender.send(message);
		} catch (Exception e) {
			throw new RuntimeException("Error al crear el mensaje de correo", e);
		}
	}

	public List<Usuario> listarTodos() {
		return usuarioRepository.findAll();
	}

	public void makeAdmin(Long id) {
		Usuario user = usuarioRepository.findById(id).orElseThrow();
		user.setRole(Role.ROLE_ADMIN);
		usuarioRepository.save(user);
	}
}
