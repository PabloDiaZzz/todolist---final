package es.educastur.gjv64177.todolist.controller;

import es.educastur.gjv64177.todolist.Service.UsuarioService;
import es.educastur.gjv64177.todolist.dto.UsuarioDTO;
import es.educastur.gjv64177.todolist.dto.UpdateProfileDTO;
import es.educastur.gjv64177.todolist.dto.UpdatePasswordRequest;
import es.educastur.gjv64177.todolist.mapper.UsuarioMapper;
import es.educastur.gjv64177.todolist.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UsuarioController {

	@Autowired private UsuarioService usuarioService;
	@Autowired private UsuarioMapper usuarioMapper;

	@GetMapping("/me")
	public ResponseEntity<UsuarioDTO> getCurrentUser(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		Usuario user = usuarioService.findByUsername(authentication.getName());
		return ResponseEntity.ok(usuarioMapper.toDTO(user));
	}

	@PatchMapping("/profile")
	public ResponseEntity<UsuarioDTO> updateProfile(Authentication authentication, @RequestBody UpdateProfileDTO dto) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		try {
			Usuario updated = usuarioService.updateProfile(
					authentication.getName(),
					dto.username(),
					dto.fullName(),
					dto.email(),
					dto.theme()
			);
			return ResponseEntity.ok(usuarioMapper.toDTO(updated));
		} catch (org.springframework.web.server.ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).build();
		}
	}

	@PatchMapping("/password")
	public ResponseEntity<Void> updatePassword(Authentication authentication, @RequestBody UpdatePasswordRequest dto) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		try {
			usuarioService.updatePassword(authentication.getName(), dto.currentPassword(), dto.newPassword());
			return ResponseEntity.ok().build();
		} catch (org.springframework.web.server.ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).build();
		}
	}

	@DeleteMapping("/me")
	public ResponseEntity<Void> deleteAccount(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		try {
			usuarioService.deleteUser(authentication.getName());
			return ResponseEntity.noContent().build();
		} catch (org.springframework.web.server.ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).build();
		}
	}
}
